# Cyber Incident Response Policy

**Policy ID:** CIR-2023-01  
**Version:** 2.2  
**Effective Date:** 2023-01-10  
**Owner:** Chief Information Security Officer (CISO)

## 1. Scope
This policy outlines the response procedures for any suspected or confirmed cybersecurity incident affecting RiskSentinel's infrastructure, data, or personnel.

## 2. Incident Classification

### 2.1 Low Severity (Tier 1)
- **Examples:** Isolated malware on a single endpoint, unsuccessful phishing attempts, anomalous but non-malicious network traffic.
- **Response:** Handled by Security Operations Center (SOC) standard procedures. Endpoint isolation and re-imaging if necessary.
- **SLA:** Triage within 4 hours. Containment within 24 hours.

### 2.2 Moderate Severity (Tier 2)
- **Examples:** Compromised employee credentials (non-admin), minor DDoS attack degrading service, unusual port scanning across internal subnets.
- **Response:** Mandatory password resets. Network segmentation rules updated. 
- **SLA:** Triage within 1 hour. Containment within 8 hours.

### 2.3 High Severity (Tier 3)
- **Examples:** Confirmed data exfiltration (non-PII), lateral movement detected in internal network, compromised admin credentials.
- **Response:** Activation of Incident Response Team (IRT). Immediate isolation of affected subnets. Executive notification required.
- **SLA:** Immediate triage. Containment within 4 hours.

### 2.4 Critical Severity (Tier 4)
- **Examples:** Active ransomware deployment, breach of PII/financial data, loss of core infrastructure control.
- **Response:** Full IRT mobilization. Authority to sever external internet connections. Notification of legal, PR, and law enforcement.
- **SLA:** Immediate.

## 3. Containment and Eradication Authorities
- **Tier 1 & 2:** SOC Analysts may isolate individual workstations.
- **Tier 3:** IRT Lead may isolate subnets or disable active directory accounts.
- **Tier 4:** Only the CISO or CIO may authorize a complete network shutdown or severing of main external links.

## 4. Reporting and Disclosure
- **Internal:** CISO must brief the Executive Board within 12 hours of a Tier 3 or Tier 4 incident declaration.
- **External/Regulatory:** Legal counsel must review all external communications. If PII is compromised, regulatory bodies (e.g., GDPR, CCPA regulators) must be notified within 72 hours of confirmation.
- **Customers:** If customer data is compromised, affected customers must be notified within 14 days, pending law enforcement clearance.

## 5. Post-Incident Review
A formal post-incident report (PIR) must be completed within 14 days of incident closure for all Tier 2+ incidents. This report must detail the root cause, timeline of events, and specific remediation steps to prevent recurrence.
