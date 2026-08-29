import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'outline' };
  secondaryAction?: { label: string; onClick: () => void };
  illustration?: 'search' | 'filter' | 'data' | 'connection' | 'permission' | 'custom';
  className?: string;
  style?: React.CSSProperties;
}

const illustrations: Record<string, React.ReactNode> = {
  search: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
      <circle cx="28" cy="28" r="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 48 L62 62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  filter: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
      <path d="M14 20 L40 8 L66 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 40 L40 28 L66 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 60 L40 48 L66 60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  data: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
      <rect x="12" y="16" width="56" height="48" rx="4" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M12 32 L68 32" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 50 L34 40 L42 44 L56 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  connection: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
      <circle cx="20" cy="40" r="10" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="60" cy="40" r="10" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M30 40 L50 40" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4"/>
      <path d="M20 30 L20 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5"/>
      <path d="M60 30 L60 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5"/>
    </svg>
  ),
  permission: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
      <rect x="15" y="20" width="50" height="40" rx="4" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M25 35 L35 45 L55 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration = 'data',
  className = '',
  style = {},
}) => {
  const illustrationNode = typeof illustration === 'string' ? illustrations[illustration] : illustration;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        ...style,
      }}
    >
      <div style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
        {icon || illustrationNode}
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '14px', lineHeight: 1.6, maxWidth: '320px', marginBottom: '24px' }}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {secondaryAction && (
            <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button variant={action.variant || 'primary'} size="md" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const EmptyStateCard: React.FC<{
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => (
  <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={action}
      illustration="data"
    />
  </div>
);