import React from 'react';
import { getRiskColorHex } from '../../lib/utils';

export interface ActionCardProps {
  id: string;
  action: string;
  expectedImpact: string;
  confidence: number;
  reasoning?: string;
  level: string;
  category?: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onModify?: (id: string) => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  id, action, expectedImpact, confidence, reasoning, level, category,
  onApprove, onReject, onModify,
}) => {
  const levelColor = getRiskColorHex(level);
  const confWidth = `${Math.min(100, confidence)}%`;

  return (
    <div className="glass-card animate-slide-up" style={{ padding: '20px', borderLeft: `4px solid ${levelColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
              backgroundColor: levelColor + '20', color: levelColor, textTransform: 'uppercase',
            }}>
              {level}
            </span>
            {category && (
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                {category}
              </span>
            )}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
            {action}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
        💡 {expectedImpact}
      </div>

      {reasoning && (
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px', fontStyle: 'italic' }}>
          📋 {reasoning}
        </div>
      )}

      {/* Confidence bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
          <span>Confidence</span>
          <span style={{ color: confidence > 85 ? 'var(--risk-low)' : 'var(--color-text-secondary)', fontWeight: 600 }}>
            {confidence}%
          </span>
        </div>
        <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
          <div style={{
            height: '100%', width: confWidth, borderRadius: '2px',
            background: `linear-gradient(90deg, var(--accent-primary), ${confidence > 85 ? 'var(--risk-low)' : 'var(--risk-moderate)'})`,
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onApprove?.(id)}
          style={{
            flex: 1, padding: '8px 16px', border: 'none', borderRadius: '6px',
            background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          ✓ Approve
        </button>
        <button
          onClick={() => onModify?.(id)}
          style={{
            flex: 1, padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
            background: 'transparent', color: 'var(--color-text-secondary)',
            fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          ✎ Modify
        </button>
        <button
          onClick={() => onReject?.(id)}
          style={{
            flex: 1, padding: '8px 16px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
            background: 'transparent', color: 'var(--risk-very-high)',
            fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          ✕ Reject
        </button>
      </div>
    </div>
  );
};

export default ActionCard;
