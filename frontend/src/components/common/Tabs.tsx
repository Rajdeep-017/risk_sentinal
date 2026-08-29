import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'line' | 'enclosed' | 'soft';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'line',
  fullWidth = false,
  className = '',
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    line: {
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      backgroundColor: 'transparent',
    },
    enclosed: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: '12px',
      padding: '4px',
    },
    soft: {
      backgroundColor: 'transparent',
    },
  };

  const tabStyles: Record<string, React.CSSProperties> = {
    line: {
      padding: '12px 16px',
      borderBottom: '2px solid transparent',
      marginBottom: '-1px',
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    },
    enclosed: {
      padding: '10px 16px',
      borderRadius: '8px',
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    },
    soft: {
      padding: '10px 16px',
      borderRadius: '8px',
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    },
  };

  const activeTabStyles: Record<string, React.CSSProperties> = {
    line: {
      color: 'var(--accent-primary)',
      borderBottomColor: 'var(--accent-primary)',
      backgroundColor: 'transparent',
    },
    enclosed: {
      color: 'var(--color-text-primary)',
      backgroundColor: 'var(--bg-deepest)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
    soft: {
      color: 'var(--accent-primary)',
      backgroundColor: 'rgba(59,130,246,0.1)',
    },
  };

  const baseTabStyle = tabStyles[variant];
  const baseActiveStyle = activeTabStyles[variant];

  return (
    <div className={className} role="tablist" aria-label="Tabs">
      <div
        style={{
          display: 'flex',
          gap: variant === 'enclosed' ? '4px' : '0',
          ...variantStyles[variant],
          ...(fullWidth ? { width: '100%' } : {}),
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-trigger`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              style={{
                ...baseTabStyle,
                ...(isActive ? baseActiveStyle : {}),
                border: 'none',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                opacity: tab.disabled ? 0.5 : 1,
                flex: fullWidth ? 1 : undefined,
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (!tab.disabled && !isActive) {
                  if (variant === 'line') e.currentTarget.style.color = 'var(--color-text-primary)';
                  if (variant === 'enclosed' || variant === 'soft') e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!tab.disabled && !isActive) {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {tab.icon && <span style={{ display: 'flex' }}>{tab.icon}</span>}
              {tab.label}
              {tab.badge && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.1)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--color-text-muted)',
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface TabPanelProps {
  id: string;
  active: boolean;
  children: React.ReactNode;
  animated?: boolean;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, active, children, animated = true }) => {
  if (!active) return null;

  return (
    <div
      role="tabpanel"
      aria-labelledby={`${id}-trigger`}
      id={`${id}-panel`}
      style={{
        animation: animated ? 'fadeIn 0.3s ease' : 'none',
      }}
    >
      {children}
    </div>
  );
};

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  variant?: 'bordered' | 'divided' | 'clean';
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  variant = 'bordered',
  className = '',
}) => {
  const [openItems, setOpenItems] = React.useState<string[]>(defaultOpen);

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      if (allowMultiple) {
        return prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      }
      return prev.includes(id) ? [] : [id];
    });
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    bordered: {
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      overflow: 'hidden',
    },
    divided: {
      borderTop: '1px solid rgba(255,255,255,0.05)',
    },
    clean: {},
  };

  const itemVariantStyles: Record<string, React.CSSProperties> = {
    bordered: {
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    divided: {
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    clean: {
      marginBottom: '8px',
    },
  };

  return (
    <div className={className} style={variantStyles[variant]}>
      {items.map((item, index) => {
        const isOpen = openItems.includes(item.id);
        const isLast = index === items.length - 1;
        
        return (
          <div key={item.id} style={{ ...itemVariantStyles[variant], ...(isLast && variant !== 'clean' ? { borderBottom: 'none' } : {}) }}>
            <button
              onClick={() => !item.disabled && toggleItem(item.id)}
              disabled={item.disabled}
              style={{
                width: '100%',
                padding: '16px 20px',
                backgroundColor: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent',
                border: 'none',
                color: item.disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                if (!item.disabled && !isOpen) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-expanded={isOpen}
              aria-controls={`${item.id}-content`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                {item.icon && <span style={{ display: 'flex', color: 'var(--color-text-secondary)' }}>{item.icon}</span>}
                {item.title}
              </div>
              <ChevronRight
                size={18}
                color="var(--color-text-muted)"
                style={{
                  transition: 'transform 0.2s ease',
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                  flexShrink: 0,
                }}
              />
            </button>
            <div
              id={`${item.id}-content`}
              role="region"
              aria-labelledby={`${item.id}-trigger`}
              style={{
                overflow: 'hidden',
                maxHeight: isOpen ? '500px' : '0',
                opacity: isOpen ? 1 : 0,
                transition: 'max-height 0.3s ease, opacity 0.2s ease',
              }}
            >
              <div style={{ padding: '0 20px 20px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};