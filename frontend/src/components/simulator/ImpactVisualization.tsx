import React from 'react';

interface ImpactVisualizationProps {
  originalExposure: number;
  simulatedExposure: number;
  impactDiff: number;
  scenario: string;
}

const ImpactVisualization: React.FC<ImpactVisualizationProps> = ({
  originalExposure, simulatedExposure, impactDiff, scenario,
}) => {
  const maxVal = Math.max(originalExposure, simulatedExposure) || 1;
  const origPct = (originalExposure / maxVal) * 100;
  const simPct = (simulatedExposure / maxVal) * 100;
  const isWorse = simulatedExposure > originalExposure;

  const fmt = (v: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1,
  }).format(v);

  return (
    <div className="glass-card animate-slide-up" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-primary)' }}>
        Impact Simulation
      </h3>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
        Scenario: {scenario}
      </div>

      {/* Before/After bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Current Exposure</span>
            <span style={{ fontWeight: 600 }}>{fmt(originalExposure)}</span>
          </div>
          <div style={{ height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${origPct}%`, borderRadius: '6px',
              background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
              transition: 'width 1s ease',
            }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Simulated Exposure</span>
            <span style={{ fontWeight: 600, color: isWorse ? 'var(--risk-critical)' : 'var(--risk-low)' }}>
              {fmt(simulatedExposure)}
            </span>
          </div>
          <div style={{ height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${simPct}%`, borderRadius: '6px',
              background: isWorse
                ? 'linear-gradient(90deg, #f97316, #dc2626)'
                : 'linear-gradient(90deg, #10b981, #059669)',
              transition: 'width 1s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Impact delta */}
      <div style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: isWorse ? 'rgba(220,38,38,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${isWorse ? 'rgba(220,38,38,0.2)' : 'rgba(16,185,129,0.2)'}`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
          Exposure Change
        </div>
        <div style={{
          fontSize: '24px', fontWeight: 700,
          color: isWorse ? 'var(--risk-critical)' : 'var(--risk-low)',
        }}>
          {isWorse ? '+' : ''}{fmt(impactDiff)}
        </div>
        <div style={{
          fontSize: '13px', fontWeight: 600,
          color: isWorse ? 'var(--risk-high)' : 'var(--risk-low)',
          marginTop: '4px',
        }}>
          {isWorse ? '⚠ Risk Increase' : '✓ Risk Reduction'}
          {' '}({((impactDiff / (originalExposure || 1)) * 100).toFixed(0)}%)
        </div>
      </div>
    </div>
  );
};

export default ImpactVisualization;
