import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line } from 'recharts';
import { DateRangePicker, Button, Tabs, TabPanel, SkeletonChart } from '../common';
import { useRiskTimeline } from '../../hooks/useDashboardData';
import { RefreshCw, Download, TrendingUp, AlertTriangle, Expand, ZoomIn } from 'lucide-react';

const RiskTimeline: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showAnnotations, setShowAnnotations] = useState(true);
  const { data, isLoading, refetch } = useRiskTimeline();

  // Ensure data is always an array with fallback
  const timelineData = Array.isArray(data) ? data : [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={16} /> },
    { id: 'domains', label: 'By Domain', icon: <Expand size={16} /> },
    { id: 'events', label: 'Key Events', icon: <AlertTriangle size={16} /> },
  ];

  const filteredData = useMemo(() => {
    if (!timelineData.length) return [];
    if (!dateRange.startDate || !dateRange.endDate) return timelineData;
    return timelineData.filter(d => {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() + d.day);
      return dayDate >= dateRange.startDate! && dayDate <= dateRange.endDate!;
    });
  }, [data, dateRange]);

  const processedData = useMemo(() => {
    if (!filteredData.length) return [];
    if (granularity === 'daily') return filteredData;
    if (granularity === 'weekly') {
      return filteredData.filter((_, i) => i % 7 === 0).map((d, i) => ({
        ...d,
        day: i * 7,
        score: filteredData.slice(i * 7, (i + 1) * 7).reduce((sum, d) => sum + d.score, 0) / 7,
      }));
    }
    return filteredData.filter((_, i) => i % 30 === 0).map((d, i) => ({
      ...d,
      day: i * 30,
      score: filteredData.slice(i * 30, (i + 1) * 30).reduce((sum, d) => sum + d.score, 0) / 30,
    }));
  }, [filteredData, granularity]);

  const keyEvents = [
    { day: -75, label: 'Supplier S-104 Issue', severity: 'critical' },
    { day: -45, label: 'New Regulation', severity: 'high' },
    { day: -30, label: 'Cyber Incident', severity: 'critical' },
    { day: -15, label: 'Mitigation Deployed', severity: 'low' },
    { day: -5, label: 'Q4 Forecast Update', severity: 'moderate' },
  ];

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    if (!timelineData.length) return;
    const csv = [
      ['Day', 'Score', 'Financial', 'Customer', 'Operational'],
      ...timelineData.map(d => [d.day, d.score, d.financial || '', d.customer || '', d.operational || '']),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-timeline-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card animate-slide-up" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Risk Score Timeline</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Track risk evolution across time horizons</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Last 90 days"
            format={(d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
          />
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRefresh} disabled={isLoading} title="Refresh">Refresh</Button>
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} title="Export" onClick={handleExport}>Export</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="soft" />

      <TabPanel id="overview" active={activeTab === 'overview'}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={showAnnotations}
              onChange={(e) => setShowAnnotations(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
            />
            Show Risk Thresholds
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={true}
              onChange={() => {}}
              style={{ width: '16px', height: '16px', accentColor: 'var(--risk-moderate)' }}
            />
            Show Key Events
          </label>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          {isLoading ? (
            <SkeletonChart height={320} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="riskGradCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--risk-critical)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--risk-critical)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis
                  dataKey="day"
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  tickFormatter={(val: number) => {
                    const date = new Date();
                    date.setDate(date.getDate() + val);
                    if (granularity === 'monthly') return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    if (granularity === 'weekly') return `Wk ${Math.abs(Math.floor(val / 7))}`;
                    return val === 0 ? 'Today' : `${Math.abs(val)}d ago`;
                  }}
                  interval={granularity === 'monthly' ? 1 : granularity === 'weekly' ? 2 : Math.max(1, Math.floor(processedData.length / 10))}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  tickCount={5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}`, 'Risk Score']}
                  labelFormatter={(label: number) => {
                    const date = new Date();
                    date.setDate(date.getDate() + label);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  }}
                />
                {showAnnotations && (
                  <>
                    <ReferenceLine y={85} label={{ value: 'CRITICAL (85)', position: 'right', offset: 10, fill: 'var(--risk-critical)', fontSize: 10 }} stroke="rgba(220,38,38,0.4)" strokeDasharray="5 5" />
                    <ReferenceLine y={70} label={{ value: 'VERY HIGH (70)', position: 'right', offset: 10, fill: 'var(--risk-very-high)', fontSize: 10 }} stroke="rgba(239,68,68,0.3)" strokeDasharray="5 5" />
                    <ReferenceLine y={50} stroke="rgba(249,115,22,0.2)" strokeDasharray="5 5" />
                    <ReferenceLine y={30} stroke="rgba(245,158,11,0.15)" strokeDasharray="5 5" />
                  </>
                )}
                {keyEvents.map((event, i) => (
                  <ReferenceLine
                    key={i}
                    x={event.day}
                    stroke={event.severity === 'critical' ? 'rgba(220,38,38,0.6)' : event.severity === 'high' ? 'rgba(239,68,68,0.5)' : event.severity === 'moderate' ? 'rgba(249,115,22,0.4)' : 'rgba(16,185,129,0.4)'}
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: event.label,
                      position: 'top',
                      offset: -10,
                      fill: event.severity === 'critical' ? 'var(--risk-critical)' : event.severity === 'high' ? 'var(--risk-very-high)' : event.severity === 'moderate' ? 'var(--risk-high)' : 'var(--risk-low)',
                      fontSize: 10,
                      fontWeight: 600,
                      angle: -90,
                      style: { textAnchor: 'start' },
                    }}
                  />
                ))}
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--accent-primary)"
                  fill="url(#riskGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {[
            { label: 'LOW', color: '#10b981', range: '0-29' },
            { label: 'MOD', color: '#f59e0b', range: '30-49' },
            { label: 'HIGH', color: '#f97316', range: '50-69' },
            { label: 'V.HIGH', color: '#ef4444', range: '70-84' },
            { label: 'CRIT', color: '#dc2626', range: '85+' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: l.color }} />
              {l.label} ({l.range})
            </div>
          ))}
        </div>
      </TabPanel>

      <TabPanel id="domains" active={activeTab === 'domains'}>
        <div style={{ width: '100%', height: 320 }}>
          {isLoading ? (
            <SkeletonChart height={320} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--risk-critical)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--risk-critical)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--risk-high)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--risk-high)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="opsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--risk-moderate)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--risk-moderate)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis
                  dataKey="day"
                  stroke="var(--color-text-muted)"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  tickFormatter={(val: number) => val === 0 ? 'Today' : `${Math.abs(val)}d`}
                  interval={Math.max(1, Math.floor(processedData.length / 10))}
                />
                <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickCount={5} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="financial" stroke="var(--risk-critical)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="customer" stroke="var(--risk-high)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="operational" stroke="var(--risk-moderate)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '2px', backgroundColor: 'var(--risk-critical)' }} /> Financial</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '2px', backgroundColor: 'var(--risk-high)' }} /> Customer</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '16px', height: '2px', backgroundColor: 'var(--risk-moderate)' }} /> Operational</div>
        </div>
      </TabPanel>

      <TabPanel id="events" active={activeTab === 'events'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {keyEvents.map((event, i) => (
            <div key={i} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: `4px solid ${event.severity === 'critical' ? 'var(--risk-critical)' : event.severity === 'high' ? 'var(--risk-very-high)' : event.severity === 'moderate' ? 'var(--risk-high)' : 'var(--risk-low)'}` }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: event.severity === 'critical' ? 'var(--risk-critical)' : event.severity === 'high' ? 'var(--risk-very-high)' : event.severity === 'moderate' ? 'var(--risk-high)' : 'var(--risk-low)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{event.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', backgroundColor: event.severity === 'critical' ? 'rgba(220,38,38,0.2)' : event.severity === 'high' ? 'rgba(239,68,68,0.2)' : event.severity === 'moderate' ? 'rgba(249,115,22,0.2)' : 'rgba(16,185,129,0.2)', color: event.severity === 'critical' ? 'var(--risk-critical)' : event.severity === 'high' ? 'var(--risk-very-high)' : event.severity === 'moderate' ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                    {event.severity.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {Math.abs(event.day)} days ago • Impact on risk trajectory
                </div>
              </div>
              <Button variant="ghost" size="sm" leftIcon={<ZoomIn size={14} />}>View Impact</Button>
            </div>
          ))}
        </div>
      </TabPanel>
    </div>
  );
};

export default RiskTimeline;
