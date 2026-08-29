import { RiskLevel, Alert, ApprovalAction } from '../types/risk';

export const mockDashboardOverview = {
  score: 82,
  level: 'CRITICAL' as RiskLevel,
  velocity: 14.7,
  momentum: 18,
  exposure: 1240000,
  confidence: 93,
  domains: {
    financial: 85,
    customer: 72,
    fraud: 45,
    operational: 91,
    cyber: 38
  }
};

export const mockTimelineData = Array.from({ length: 90 }).map((_, i) => {
  const base = 40 + (i * 0.5);
  const random = Math.sin(i / 5) * 10 + Math.random() * 5;
  return {
    day: i - 90,
    score: Math.min(100, Math.max(0, base + random))
  };
});

export const mockAlerts: Alert[] = [
  { id: '1', severity: 'CRITICAL', title: 'Supplier Disruption', description: 'Major outage detected at primary supplier S-104', timestamp: '2 mins ago', entity: 'Supplier S-104' },
  { id: '2', severity: 'HIGH', title: 'Unusual Transaction Volume', description: 'Spike in high-value transfers from restricted region', timestamp: '15 mins ago', entity: 'Payment Gateway' },
  { id: '3', severity: 'MODERATE', title: 'API Latency', description: 'Authentication API response time increased by 400ms', timestamp: '1 hour ago', entity: 'Auth Service' },
];

export const mockApprovals: ApprovalAction[] = [
  {
    id: 'a1',
    level: 'HIGH',
    recommendedAction: 'Block Transactions > ₹5L from Region X',
    expectedImpact: 'Reduce exposure by ₹45L/day. False positive rate ~2%.',
    confidence: 89,
    reasoning: 'Anomalous velocity detected in Region X aligning with known fraud patterns.'
  },
  {
    id: 'a2',
    level: 'MODERATE',
    recommendedAction: 'Route traffic to Backup Gateway',
    expectedImpact: 'Restore API latency to normal. Cost increase ₹12k/day.',
    confidence: 95,
    reasoning: 'Primary gateway is experiencing persistent degradation over last 4 hours.'
  }
];

export const mockCascade = {
  id: 'root',
  type: 'Root Cause',
  description: 'Supplier Disruption (S-104)',
  impact: 100,
  exposure: 0,
  level: 'CRITICAL' as RiskLevel,
  children: [
    {
      id: 'n1',
      type: 'Operational',
      description: 'Inventory Shortage',
      impact: -18,
      exposure: 0,
      level: 'HIGH' as RiskLevel,
      children: [
        {
          id: 'n1-1',
          type: 'Customer',
          description: 'Order Fulfillment Delay',
          impact: -12,
          exposure: 0,
          level: 'HIGH' as RiskLevel,
          children: [
            {
              id: 'n1-1-1',
              type: 'Financial',
              description: 'Revenue Impact',
              impact: -4.2,
              exposure: 780000,
              level: 'CRITICAL' as RiskLevel
            }
          ]
        }
      ]
    }
  ]
};
