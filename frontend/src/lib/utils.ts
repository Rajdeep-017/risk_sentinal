import { RiskLevel } from '../types/risk';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 1,
    notation: "compact",
    compactDisplay: "short"
  }).format(value);
};

export const formatPercentage = (value: number | undefined | null) => {
  if (value == null || isNaN(value)) return '0.0%';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const getRiskColor = (level: RiskLevel | string) => {
  switch (level) {
    case 'LOW': return 'var(--risk-low)';
    case 'MODERATE': return 'var(--risk-moderate)';
    case 'HIGH': return 'var(--risk-high)';
    case 'VERY HIGH': return 'var(--risk-very-high)';
    case 'CRITICAL': return 'var(--risk-critical)';
    default: return 'var(--color-text-muted)';
  }
};

export const getRiskColorHex = (level: RiskLevel | string) => {
  switch (level) {
    case 'LOW': return '#10b981';
    case 'MODERATE': return '#f59e0b';
    case 'HIGH': return '#f97316';
    case 'VERY HIGH': return '#ef4444';
    case 'CRITICAL': return '#dc2626';
    default: return '#6b7280';
  }
};
