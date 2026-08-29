import React from 'react';
import SparkLine from './SparkLine';
import { getRiskColor } from '../../lib/utils';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  trendData?: number[];
  riskLevel?: string;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  trend,
  trendData,
  riskLevel,
  subtitle,
}) => {
  const trendColor = trend && trend > 0 ? 'var(--risk-high)' : 'var(--risk-low)';
  const borderColor = riskLevel ? getRiskColor(riskLevel) : 'rgba(59, 130, 246, 0.2)';

  return (
    <div
      className="glass-card animate-slide-up"
      style={{
        padding: '20px',
        borderLeft: `3px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: borderColor, opacity: 0.8 }}>{icon}</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </span>
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: '12px', color: trendColor, fontWeight: 600 }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>
        {trendData && trendData.length > 0 && (
          <SparkLine data={trendData} width={80} height={24} color={trendColor || 'var(--accent-primary)'} />
        )}
      </div>
    </div>
  );
};

export default MetricCard;
