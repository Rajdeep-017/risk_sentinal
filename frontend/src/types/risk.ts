export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'CRITICAL';

export interface RiskScore {
  overall: number;
  financial: number;
  customer: number;
  fraud: number;
  operational: number;
  cyber: number;
  velocity: number;
  momentum: number;
  exposure: number;
  confidence: number;
}

export interface Alert {
  id: string;
  severity: RiskLevel;
  title: string;
  description: string;
  timestamp: string;
  entity: string;
}

export interface EntityRiskProfile {
  id: string;
  name: string;
  riskScore: RiskScore;
  level: RiskLevel;
}

export interface CascadeNode {
  id: string;
  type: string;
  description: string;
  impact: number;
  exposure: number;
  level: RiskLevel;
  children?: CascadeNode[];
}

export interface ApprovalAction {
  id: string;
  level: RiskLevel;
  recommendedAction: string;
  expectedImpact: string;
  confidence: number;
  reasoning: string;
}
