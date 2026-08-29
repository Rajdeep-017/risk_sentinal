import React from 'react';

interface RiskBadgeProps {
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'CRITICAL';
  style?: React.CSSProperties;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level, style }) => {
  const getBadgeStyle = () => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      display: 'inline-block'
    };

    switch (level) {
      case 'CRITICAL':
        return { ...baseStyle, backgroundColor: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5', border: '1px solid rgba(220, 38, 38, 0.5)' };
      case 'VERY HIGH':
        return { ...baseStyle, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.5)' };
      case 'HIGH':
        return { ...baseStyle, backgroundColor: 'rgba(249, 115, 22, 0.2)', color: '#fdba74', border: '1px solid rgba(249, 115, 22, 0.5)' };
      case 'MODERATE':
        return { ...baseStyle, backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.5)' };
      case 'LOW':
        return { ...baseStyle, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.5)' };
      default:
        return baseStyle;
    }
  };

  const isCritical = level === 'CRITICAL';

  return (
    <span style={{ ...getBadgeStyle(), ...style }} className={isCritical ? 'animate-pulse-critical' : ''}>
      {isCritical && <span style={{ marginRight: '6px' }}>🔴</span>}
      {level}
    </span>
  );
};

export default RiskBadge;
