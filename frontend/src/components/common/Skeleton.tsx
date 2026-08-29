import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'chart' | 'table-row' | 'badge';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
  className = '',
  style = {},
  count = 1,
}) => {
  const baseStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--bg-elevated) 25%, rgba(255,255,255,0.05) 50%, var(--bg-elevated) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: variant === 'circular' ? '50%' : variant === 'badge' ? '20px' : '8px',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height || (variant === 'text' ? '16px' : variant === 'badge' ? '24px' : '100%'),
    ...style,
  };

  const variants: Record<string, React.CSSProperties> = {
    text: { height: '16px', borderRadius: '4px' },
    circular: { borderRadius: '50%' },
    rectangular: { borderRadius: '8px' },
    badge: { height: '24px', borderRadius: '20px', minWidth: '60px' },
    chart: { height: '300px', borderRadius: '12px' },
    'table-row': { height: '48px', borderRadius: '0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    card: { height: '200px', borderRadius: '12px' },
  };

  const combinedStyle = { ...baseStyle, ...variants[variant] };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} style={combinedStyle} className={className} />
  ));

  return <>{skeletons}</>;
};

export const SkeletonCard: React.FC<{ titleLines?: number; contentLines?: number; actionCount?: number }> = ({
  titleLines = 2,
  contentLines = 3,
  actionCount = 2,
}) => (
  <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
      <Skeleton variant="text" width="40%" height="24px" count={titleLines} />
      <Skeleton variant="circular" width={40} height={40} />
    </div>
    <Skeleton variant="text" width="100%" height="16px" count={contentLines} />
    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
      <Skeleton variant="rectangular" width="120px" height="40px" count={actionCount} />
    </div>
  </div>
);

export const SkeletonChart: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
    <Skeleton variant="text" width="30%" height="24px" />
    <Skeleton variant="chart" height={height} style={{ marginTop: '16px' }} />
  </div>
);

export const SkeletonTable: React.FC<{ columns?: number; rows?: number }> = ({ columns = 5, rows = 5 }) => (
  <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} variant="text" width="60%" height="14px" />
      ))}
    </div>
    {Array.from({ length: rows }, (_, row) => (
      <div key={row} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, padding: '16px', borderBottom: row < rows - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
        {Array.from({ length: columns }, (_, col) => (
          <Skeleton key={col} variant="text" width="80%" height="16px" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonAlertFeed: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <Skeleton variant="text" width="30%" height="24px" />
    {Array.from({ length: count }, (_, i) => (
      <div key={i} style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Skeleton variant="badge" width="80px" />
          <Skeleton variant="text" width="80px" height="12px" />
        </div>
        <Skeleton variant="text" width="100%" height="16px" />
        <Skeleton variant="text" width="70%" height="14px" />
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
          <Skeleton variant="text" width="50px" height="12px" />
          <Skeleton variant="text" width="100px" height="12px" />
        </div>
      </div>
    ))}
  </div>
);