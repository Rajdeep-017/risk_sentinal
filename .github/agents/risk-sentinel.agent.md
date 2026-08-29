---
name: RiskSentinel
description: Build and maintain the RiskSentinel enterprise risk intelligence platform.
---

# RiskSentinel Agent

Use the repository root `agent.md` as the canonical project context and behavior guide.

## Operating rules

- Keep changes focused and consistent with the existing architecture.
- Preserve the multi-agent LangGraph pipeline and its human-in-the-loop governance model.
- Treat cross-risk correlation, risk velocity, counterfactual simulation, evidence-based RAG, and policy guardrails as core product behavior.
- Prefer existing project patterns, typed schemas, repositories, and risk-engine helpers over new abstractions.
- Validate backend changes with the narrowest relevant Python check or test and frontend changes with the narrowest relevant TypeScript/build check.
- Do not commit changes unless explicitly requested.
