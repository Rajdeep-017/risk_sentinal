"""Data Quality Agent Node — Validates input data completeness and schema conformance."""
from app.agents.state import RiskAssessmentState


def data_quality_node(state: RiskAssessmentState):
    """Validate incoming entity data for quality issues before processing."""
    input_data = state.get("input_data", {})
    entity_id = state.get("entity_id", "unknown")
    entity_type = state.get("entity_type", "unknown")

    warnings = []
    checks_passed = 0
    total_checks = 0

    # Check for required fields based on entity type
    required_fields = {
        "customer": ["credit", "customer"],
        "supplier": ["operational"],
        "system": ["cyber"],
        "cluster": ["fraud"],
        "organization": ["credit", "customer"],
    }

    expected_domains = required_fields.get(entity_type, ["credit"])

    for domain in expected_domains:
        total_checks += 1
        if domain in input_data and input_data[domain]:
            checks_passed += 1
            # Check for null/zero values within the domain
            domain_data = input_data[domain]
            null_fields = [k for k, v in domain_data.items() if v is None]
            if null_fields:
                warnings.append(f"{domain}: null values in {null_fields}")
        else:
            warnings.append(f"Missing {domain} data for entity {entity_id}")

    # Check for anomalous values
    for domain, data in input_data.items():
        total_checks += 1
        if isinstance(data, dict):
            checks_passed += 1
            for key, val in data.items():
                if isinstance(val, (int, float)):
                    if val < 0 and key not in ("amount_zscore",):
                        warnings.append(f"{domain}.{key}: unexpected negative value ({val})")
        else:
            warnings.append(f"{domain}: expected dict, got {type(data).__name__}")

    # Calculate quality score
    if total_checks > 0:
        quality_score = round(checks_passed / total_checks, 4)
    else:
        quality_score = 0.5
        warnings.append("No data available for quality assessment")

    return {
        "data_quality": {
            "score": quality_score,
            "checks_passed": checks_passed,
            "total_checks": total_checks,
            "warnings": warnings,
        },
        "audit_trail": [
            f"Data quality check: {quality_score:.0%} ({checks_passed}/{total_checks} checks passed). "
            f"Warnings: {len(warnings)}"
        ],
    }
