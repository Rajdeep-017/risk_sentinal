"""Risk Copilot API — RAG-powered conversational risk assistant with SSE streaming."""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json

from app.rag.vector_store import vector_store
from app.config import settings

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    entity_id: str = ""


@router.post("/chat")
async def copilot_chat(request: ChatRequest):
    """RAG-powered risk copilot with SSE streaming."""

    async def event_generator():
        query = request.message
        entity_id = request.entity_id

        # Step 1: Retrieve relevant policy context from ChromaDB
        context_text = ""
        sources = []
        try:
            results = vector_store.search(query, k=3)
            if results and results.get("documents") and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    meta = results["metadatas"][0][i] if results.get("metadatas") else {}
                    context_text += f"\n---\nSource: {meta.get('filename', 'unknown')} "
                    context_text += f"(Policy: {meta.get('policy_id', 'N/A')}, "
                    context_text += f"Type: {meta.get('risk_type', 'GENERAL')})\n"
                    context_text += doc + "\n"
                    sources.append({
                        "filename": meta.get("filename", "unknown"),
                        "policy_id": meta.get("policy_id", "N/A"),
                        "risk_type": meta.get("risk_type", "GENERAL"),
                    })
        except Exception as e:
            context_text = f"[Policy context unavailable: {e}]"

        # Step 2: Try Gemini LLM for response generation
        response_text = ""
        try:
            if settings.gemini_api_key and settings.gemini_api_key != "dummy_key":
                import google.generativeai as genai
                genai.configure(api_key=settings.gemini_api_key)
                model = genai.GenerativeModel("gemini-2.0-flash")

                prompt = f"""You are RiskSentinel, an enterprise risk intelligence assistant.
Answer the user's question using the provided policy context. Be specific, cite policies,
and provide actionable recommendations. Format with risk scores, exposure amounts, and
concrete next steps.

POLICY CONTEXT:
{context_text}

USER QUERY: {query}
ENTITY: {entity_id or 'General inquiry'}

Provide a structured, evidence-based response."""

                response = model.generate_content(prompt)
                response_text = response.text
            else:
                raise ValueError("No API key")
        except Exception:
            # Fallback: Generate structured template response
            response_text = _generate_template_response(query, entity_id, context_text, sources)

        # Step 3: Stream response word by word via SSE
        # Send metadata first
        meta_event = json.dumps({"type": "meta", "sources": sources})
        yield f"data: {meta_event}\n\n"

        for word in response_text.split():
            yield f"data: {word} \n\n"
            await asyncio.sleep(0.03)

        yield f"data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


def _generate_template_response(query: str, entity_id: str, context: str, sources: list) -> str:
    """Generate a structured template response when Gemini is unavailable."""
    query_lower = query.lower()

    if "risk" in query_lower and ("score" in query_lower or "level" in query_lower):
        return (
            f"📊 **Risk Assessment Summary for {entity_id or 'Enterprise'}**\n\n"
            f"Based on our analysis:\n"
            f"- The composite risk score is computed using our weighted formula: "
            f"30% ML Probability + 20% Anomaly + 15% Trend + 15% Exposure + "
            f"10% Business Criticality + 10% Correlation Score\n"
            f"- Risk levels are categorized as: LOW (0-29), MODERATE (30-49), "
            f"HIGH (50-69), VERY HIGH (70-84), CRITICAL (85-100)\n\n"
            f"📋 **Policy Reference**: Per our Enterprise Risk Management Policy, "
            f"risks above score 50 require weekly reporting to the Risk Committee, "
            f"and scores above 75 trigger immediate mitigation plans.\n\n"
            f"💡 **Recommended Action**: Run a full assessment via the pipeline to get "
            f"real-time scores across all risk domains."
        )
    elif "fraud" in query_lower:
        return (
            f"🔍 **Fraud Risk Analysis**\n\n"
            f"Our dual-model fraud detection system uses:\n"
            f"1. **IsolationForest** for anomaly scoring (unsupervised)\n"
            f"2. **XGBoost** for fraud probability (supervised)\n\n"
            f"Key fraud indicators monitored:\n"
            f"- Transaction velocity spikes\n"
            f"- Unusual geographic patterns\n"
            f"- High-value anomalies\n"
            f"- Off-hours activity\n\n"
            f"📋 **Per Fraud Policy**: Suspected fraud requires immediate account freeze "
            f"and SAR filing within 24 hours."
        )
    elif "supplier" in query_lower or "operational" in query_lower:
        return (
            f"🏭 **Operational Risk Assessment**\n\n"
            f"Our supply chain risk model monitors:\n"
            f"- Supplier reliability scores\n"
            f"- Delivery delay predictions (XGBoost regressor)\n"
            f"- SLA breach probability\n"
            f"- Cascading impact through the risk graph\n\n"
            f"📋 **Per Supplier Risk Policy**: Critical suppliers with reliability "
            f"below 50% trigger automatic backup supplier activation."
        )
    else:
        return (
            f"🛡️ **RiskSentinel Analysis**\n\n"
            f"I can help you understand risk across 5 domains:\n"
            f"- **Financial**: Credit default risk (XGBoost)\n"
            f"- **Customer**: Churn prediction (LightGBM)\n"
            f"- **Fraud**: Anomaly + classification (IsolationForest + XGBoost)\n"
            f"- **Operational**: Supply chain risk (XGBoost)\n"
            f"- **Cyber**: Threat detection (RandomForest)\n\n"
            f"Try asking about specific risk domains, entity risk scores, "
            f"or policy recommendations."
        )
