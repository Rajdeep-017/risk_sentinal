import React, { useState } from 'react';
import { useAlerts } from '../../hooks/useDashboardData';
import { mockAlerts } from '../../lib/mockData';
import { RiskBadge, Button, Dropdown, EmptyState } from '../common';
import { BellRing, Filter, Check, X, ChevronDown, RefreshCw, Download } from 'lucide-react';
import { useToast } from '../common/Toast';

const AlertFeed: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'moderate'>('all');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { data: alertsData, isLoading, refetch } = useAlerts();
  const { toast } = useToast();

  const alerts = alertsData || mockAlerts;

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity.toLowerCase() === filter;
  }).sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const handleMarkRead = (id: string) => {
    setSelectedAlerts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    toast.success('Alert marked as read');
  };

  const handleMarkAllRead = () => {
    setSelectedAlerts(alerts.map(a => a.id));
    toast.success('All alerts marked as read');
  };

  const handleDismiss = (_id: string) => {
    toast.info('Alert dismissed');
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    if (!alerts.length) return;
    const csv = [
      ['ID', 'Severity', 'Title', 'Description', 'Timestamp', 'Entity'],
      ...alerts.map(a => [a.id, a.severity, a.title, a.description, a.timestamp, a.entity]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityOptions = [
    { label: 'All Severities', value: 'all' },
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Moderate', value: 'moderate' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BellRing size={20} className="text-risk-critical" />
          Live Alert Feed
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Dropdown
            trigger={({ onClick, ref }) => (
              <Button ref={ref} variant="outline" size="sm" onClick={onClick} leftIcon={<Filter size={14} />} rightIcon={<ChevronDown size={14} />}>
                {severityOptions.find(o => o.value === filter)?.label || 'Filter'}
              </Button>
            )}
            items={severityOptions.map(o => ({ label: o.label, value: o.value }))}
            onSelect={(item) => setFilter(item.value as any)}
            value={filter}
            width={180}
          />
          <Dropdown
            trigger={({ onClick, ref }) => (
              <Button ref={ref} variant="outline" size="sm" onClick={onClick} leftIcon={<ChevronDown size={14} />} rightIcon={<ChevronDown size={14} />}>
                {sortOptions.find(o => o.value === sortOrder)?.label || 'Sort'}
              </Button>
            )}
            items={sortOptions.map(o => ({ label: o.label, value: o.value }))}
            onSelect={(item) => setSortOrder(item.value as any)}
            value={sortOrder}
            width={180}
          />
          {selectedAlerts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} leftIcon={<Check size={14} />}>
              Mark {selectedAlerts.length} Read
            </Button>
          )}
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRefresh} disabled={isLoading} title="Refresh">Refresh</Button>
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={handleExport} title="Export">Export</Button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '8px' }}>
        {filteredAlerts.length === 0 ? (
          <EmptyState
            illustration="filter"
            title="No alerts match your filter"
            description="Try adjusting your filter criteria or check back later for new alerts."
          />
        ) : (
          filteredAlerts.map((alert, idx) => {
            const isRead = selectedAlerts.includes(alert.id);
            return (
              <div 
                key={alert.id} 
                className={`animate-slide-up ${alert.severity === 'CRITICAL' ? 'animate-pulse-critical' : ''} ${isRead ? 'opacity-50' : ''}`}
                style={{
                  padding: '16px',
                  backgroundColor: isRead ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  borderLeft: `4px solid var(--risk-${alert.severity.toLowerCase().replace(' ', '-')})`,
                  animationDelay: `${idx * 0.05}s`,
                  transition: 'all 0.2s',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <div style={{ flexShrink: 0, width: '24px', display: 'flex', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={isRead}
                    onChange={(e) => { e.stopPropagation(); handleMarkRead(alert.id); }}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', marginTop: '2px' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <RiskBadge level={alert.severity as any} />
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{alert.timestamp}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDismiss(alert.id); }} style={{ padding: '4px' }} aria-label="Dismiss alert">
                      <X size={14} color="var(--color-text-muted)" />
                    </Button>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: isRead ? 'var(--color-text-muted)' : 'var(--color-text-primary)', marginBottom: '4px' }}>{alert.title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>{alert.description}</p>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--risk-low)' }} />
                      Entity: <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{alert.entity}</span>
                    </span>
                    <span style={{ color: 'var(--accent-primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>View Details →</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertFeed;
