# Fraud Prevention and Management Policy

**Policy ID:** FRP-2023-04  
**Version:** 3.0  
**Effective Date:** 2023-03-01  
**Owner:** VP of Fraud Operations

## 1. Scope
This policy governs the detection, prevention, and response to fraudulent activities targeting RiskSentinel's financial platforms and customer accounts.

## 2. Transaction Monitoring Thresholds
All transactions are evaluated in real-time by the automated fraud detection engine.

### 2.1 Low Risk (Score < 40)
- **Action:** Auto-approve.
- **Monitoring:** Post-transaction batch analysis.

### 2.2 Moderate Risk (Score 40 - 70)
- **Action:** Flag for review; transaction proceeds.
- **Verification:** Require Step-Up Authentication (e.g., SMS OTP) for transactions over $1,000.
- **SLA:** Review within 24 hours.

### 2.3 High Risk (Score 71 - 89)
- **Action:** Auto-hold transaction.
- **Verification:** Mandatory manual review by Tier 2 Fraud Analyst. Customer outreach required.
- **SLA:** Review within 4 hours.

### 2.4 Critical/Confirmed Fraud (Score 90+)
- **Action:** Auto-block transaction and freeze account.
- **Verification:** Tier 3 Fraud Investigator assigned.
- **Reporting:** Immediate escalation for potential SAR (Suspicious Activity Report) filing.

## 3. Account Takeover (ATO) Prevention
- Multiple failed login attempts (5+) within 15 minutes result in a 30-minute temporary lockout.
- Logins from new devices or high-risk geolocations require mandatory Multi-Factor Authentication (MFA).

## 4. Escalation Chain
1. **Tier 1 (Automated/Basic Review):** Handles scores up to 70.
2. **Tier 2 (Advanced Analysts):** Handles scores 71-89 and complex ATO signals.
3. **Tier 3 (Investigators):** Handles organized fraud rings, insider threats, and law enforcement liaisons.
4. **VP Fraud Ops:** Notified for any single loss event >$50,000.

## 5. Regulatory Reporting
All confirmed fraud incidents exceeding $5,000, or any suspected money laundering activity regardless of amount, must be reported to the Compliance Officer within 24 hours for SAR evaluation. SARs must be filed within 30 days of initial detection.
