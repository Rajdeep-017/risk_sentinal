import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { useRiskVelocity } from '../../hooks/useDashboardData';
import { DateRangePicker, Button, Tabs, TabPanel, SkeletonChart } from '../common';
import { TrendingUp, AlertTriangle, Clock, Download, RefreshCw } from 'lucide-react';

const RiskVelocity: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const [activeTab, setActiveTab] = useState('velocity');
  const { data, isLoading, refetch } = useRiskVelocity();

  // Ensure data is always an array with fallback
  const velocityData = Array.isArray(data) ? data : [];

  const filteredData = useMemo(() => {
    if (!velocityData.length) return [];
    if (!dateRange.startDate || !dateRange.endDate) return velocityData;
    return velocityData.filter(d => {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() + d.day);
      return dayDate >= dateRange.startDate! && dayDate <= dateRange.endDate!;
    });
  }, [velocityData, dateRange]);

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    if (!velocityData.length) return;
    const csv = [
      ['Day', 'Score', 'Financial', 'Customer', 'Operational'],
      ...velocityData.map(d => [d.day, d.score, d.financial || '', d.customer || '', d.operational || '']),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-velocity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'velocity', label: 'Velocity', icon: <TrendingUp size={16} /> },
    { id: 'acceleration', label: 'Acceleration', icon: <AlertTriangle size={16} /> },
    { id: 'forecast', label: 'Forecast', icon: <Clock size={16} /> },
  ];

  const currentVelocity = filteredData.length > 1
    ? Number(((filteredData[filteredData.length - 1].score - filteredData[0].score) / (filteredData.length / 7)).toFixed(1))
    : 14.7;

  const acceleration = filteredData.length > 2
    ? (filteredData[filteredData.length - 1].score - filteredData[filteredData.length - 2].score > filteredData[1].score - filteredData[0].score ? 'Increasing' : 'Decreasing')
    : 'Increasing rapidly';

  const estimatedDays = currentVelocity > 0 ? Math.round((100 - filteredData[filteredData.length - 1]?.score || 82) / (currentVelocity / 7)) : 12;

  return (
    <div className="glass-card animate-slide-up" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Risk Velocity Timeline</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Track risk score changes over time</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Last 90 days"
            format={(d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRefresh} disabled={isLoading} title="Refresh data">
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} title="Export chart" onClick={handleExport}>Export</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="soft" />

<TabPanel id="velocity" active={activeTab === 'velocity'}>
        <div style={{ display: 'flex', gap: 'clamp(1rem, 3vw, 1.5rem)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', height: '320px', width: '100%' }}>
            {isLoading ? (
              <SkeletonChart height={320} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--risk-critical)" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="day" stroke="var(--color-text-muted)" tickFormatter={(val) => {
                    const date = new Date();
                    date.setDate(date.getDate() + val);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }} interval={Math.max(1, Math.floor(filteredData.length / 10))} />
                  <YAxis stroke="var(--color-text-muted)" domain={[0, 100]} tickFormatter={(v) => `${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-text-primary)' }}
                    labelFormatter={(val: number) => {
                      const date = new Date();
                      date.setDate(date.getDate() + val);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}`, 'Risk Score']}
                  />
                  <ReferenceLine y={70} label={{ value: 'Danger Zone', position: 'right', offset: 10, fill: 'var(--risk-high)', fontSize: 10 }} stroke="var(--risk-high)" strokeDasharray="5 5" />
                  <ReferenceLine y={50} stroke="var(--risk-moderate)" strokeDasharray="5 5" opacity={0.5} />
                  <ReferenceLine y={30} stroke="var(--risk-low)" strokeDasharray="5 5" opacity={0.3} />
                  <Area type="monotone" dataKey="score" stroke="var(--risk-critical)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div style={{ width: '100%', maxWidth: '280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
            <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(220,38,38,0.2)', display: 'flex' }}>
                  <TrendingUp size={20} color="var(--risk-critical)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Velocity</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--risk-critical)' }}>+{currentVelocity}/wk</div>
                </div>
              </div>
              <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.abs(Number(currentVelocity)) * 2)}%`, height: '100%', backgroundColor: 'var(--risk-critical)', borderRadius: '2px' }} />
              </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(249,115,22,0.2)', display: 'flex' }}>
                  <AlertTriangle size={20} color="var(--risk-very-high)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acceleration</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--risk-very-high)' }}>{acceleration}</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {acceleration === 'Increasing' ? 'Risk accumulating faster each week' : 'Risk growth slowing down'}
              </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(245,158,11,0.2)', display: 'flex' }}>
                  <Clock size={20} color="var(--risk-moderate)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Time to Critical</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--risk-critical)' }}>{estimatedDays} Days</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Based on current trajectory
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <TabPanel id="acceleration" active={activeTab === 'acceleration'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Weekly Change Rate</h4>
            <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', paddingBottom: '20px' }}>
              {[-2.1, -1.8, -0.5, 0.3, 1.2, 2.4, 3.1].map((val, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${Math.abs(val) * 15}%`, 
                    minHeight: '8px', 
                    background: val > 0 ? 'linear-gradient(180deg, var(--risk-critical), var(--risk-very-high))' : 'linear-gradient(180deg, var(--risk-low), var(--accent-primary))', 
                    borderRadius: '4px 4px 0 0', 
                    transition: 'height 0.5s ease' 
                  }} />
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Wk ${i + 1}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: val > 0 ? 'var(--risk-critical)' : 'var(--risk-low)' }}>
                    {val > 0 ? '+' : ''}{val}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Contributing Factors</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { factor: 'Supplier Disruption', impact: '+8.2', trend: 'up' },
                { factor: 'Market Volatility', impact: '+3.1', trend: 'up' },
                { factor: 'Regulatory Changes', impact: '+1.8', trend: 'stable' },
                { factor: 'Mitigation Actions', impact: '-2.4', trend: 'down' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{f.factor}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: f.trend === 'up' ? 'var(--risk-critical)' : f.trend === 'down' ? 'var(--risk-low)' : 'var(--risk-moderate)' }}>
                      {f.impact}/wk
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: f.trend === 'up' ? 'rgba(220,38,38,0.2)' : f.trend === 'down' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: f.trend === 'up' ? 'var(--risk-critical)' : f.trend === 'down' ? 'var(--risk-low)' : 'var(--risk-moderate)' }}>
                      {f.trend === 'up' ? '▲' : f.trend === 'down' ? '▼' : '●'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TabPanel>

      <TabPanel id="forecast" active={activeTab === 'forecast'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Projected Trajectory</h4>
            <div style={{ height: '160px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { day: 0, actual: filteredData[filteredData.length - 1]?.score || 82, projected: filteredData[filteredData.length - 1]?.score || 82, upper: 85, lower: 79 },
                  { day: 7, actual: null, projected: 85, upper: 89, lower: 81 },
                  { day: 14, actual: null, projected: 88, upper: 93, lower: 83 },
                  { day: 21, actual: null, projected: 91, upper: 97, lower: 85 },
                  { day: 28, actual: null, projected: 94, upper: 100, lower: 88 },
                  { day: 35, actual: null, projected: 97, upper: 100, lower: 91 },
                ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="day" stroke="var(--color-text-muted)" tickFormatter={(v) => v === 0 ? 'Now' : `+${v}d`} />
                  <YAxis stroke="var(--color-text-muted)" domain={[70, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="projected" stroke="var(--accent-primary)" strokeDasharray="5 5" fill="url(#forecastArea)" strokeWidth={2} />
                  <Area type="monotone" dataKey="upper" stroke="transparent" fill="rgba(59,130,246,0.05)" />
                  <Area type="monotone" dataKey="lower" stroke="transparent" fill="rgba(59,130,246,0.05)" />
                  <Area type="monotone" dataKey="actual" stroke="var(--risk-critical)" fill="url(#colorScore)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '2px', backgroundColor: 'var(--risk-critical)' }} /> Actual</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '2px', backgroundColor: 'var(--accent-primary)', borderTop: '2px dashed var(--accent-primary)' }} /> Projected</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '8px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '2px' }} /> Confidence</div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Scenario Analysis</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'Best Case', score: 72, probability: 15, color: 'var(--risk-low)' },
                { name: 'Base Case', score: 94, probability: 60, color: 'var(--risk-moderate)' },
                { name: 'Worst Case', score: 100, probability: 25, color: 'var(--risk-critical)' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: `4px solid ${s.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{s.probability}% probability</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.score}</div>
                    <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${s.score}%`, height: '100%', backgroundColor: s.color, borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TabPanel>
    </div>
  );
};

export default RiskVelocity;
