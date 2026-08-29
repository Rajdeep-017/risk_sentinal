import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useRiskRadar } from '../../hooks/useDashboardData';
import { Button, Tabs, TabPanel, SkeletonChart } from '../common';
import { RefreshCw, Download, AlertTriangle, TrendingUp, Target } from 'lucide-react';

interface RiskRadarProps {
  scores?: Record<string, number>;
  predictedScores?: Record<string, number>;
}

const RiskRadar: React.FC<RiskRadarProps> = ({ scores, predictedScores }) => {
  const [activeTab, setActiveTab] = useState('radar');
  const [showPredicted, setShowPredicted] = useState(true);
  const { data: radarData, isLoading, refetch } = useRiskRadar();

  // Use provided scores or fallback to API data
  const scoresData = scores || radarData?.reduce((acc: Record<string, number>, item) => {
    acc[item.domain.toLowerCase()] = item.current;
    return acc;
  }, {}) || {};

  const predictedData = predictedScores || radarData?.reduce((acc: Record<string, number>, item) => {
    acc[item.domain.toLowerCase()] = item.predicted;
    return acc;
  }, {}) || {};

  const data = Object.entries(scoresData).map(([key, value]) => ({
    domain: key.charAt(0).toUpperCase() + key.slice(1),
    current: value,
    predicted: predictedData[key.toLowerCase()] || Math.min(100, Math.round(value * 1.05)),
    threshold: 70
  }));

  const tabs = [
    { id: 'radar', label: 'Radar Chart', icon: <Target size={16} /> },
    { id: 'comparison', label: 'Comparison', icon: <TrendingUp size={16} /> },
  ];

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    if (!data.length) return;
    const csv = [
      ['Domain', 'Current', 'Predicted', 'Threshold', 'Change'],
      ...data.map(d => [d.domain, d.current, d.predicted, d.threshold, d.predicted - d.current]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-radar-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card animate-slide-up" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Risk Domain Radar</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRefresh} title="Refresh">Refresh</Button>
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={handleExport} title="Export">Export</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="soft" />

      <TabPanel id="radar" active={activeTab === 'radar'}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={showPredicted}
              onChange={(e) => setShowPredicted(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
            />
            Show Predicted
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={true}
              onChange={() => {}}
              style={{ width: '16px', height: '16px', accentColor: 'var(--risk-low)' }}
            />
            Show Threshold (70)
          </label>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          {isLoading ? (
            <SkeletonChart height={300} />
          ) : (
            <ResponsiveContainer>
              <RadarChart data={data} outerRadius="75%">
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
                  tickCount={5}
                />
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke="var(--accent-primary)"
                  fill="var(--accent-primary)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={false}
                />
                {showPredicted && (
                  <Radar
                    name="Predicted (30d)"
                    dataKey="predicted"
                    stroke="var(--risk-critical)"
                    fill="var(--risk-critical)"
                    fillOpacity={0.08}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
                <Radar
                  name="Threshold"
                  dataKey="threshold"
                  stroke="var(--risk-moderate)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  fill="none"
                  dot={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '2px', backgroundColor: 'var(--accent-primary)' }} />
            Current
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '2px', backgroundColor: 'var(--risk-critical)', borderTop: '2px dashed var(--risk-critical)' }} />
            Predicted
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '2px', backgroundColor: 'var(--risk-moderate)', borderTop: '2px dashed var(--risk-moderate)' }} />
            Threshold
          </div>
        </div>
      </TabPanel>

      <TabPanel id="comparison" active={activeTab === 'comparison'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {data.map((d, _i) => {
            const change = d.predicted - d.current;
            const isAboveThreshold = d.predicted > 70;
            return (
              <div key={d.domain} className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${isAboveThreshold ? 'var(--risk-critical)' : change > 0 ? 'var(--risk-high)' : 'var(--risk-low)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{d.domain}</span>
{isAboveThreshold && (
                      <AlertTriangle size={16} color="var(--risk-critical)" />
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{d.current}</span>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: change > 0 ? 'var(--risk-critical)' : 'var(--risk-low)' }}>
                    {change > 0 ? '→' : '→'} {d.predicted}
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${d.predicted}%`, height: '100%', backgroundColor: isAboveThreshold ? 'var(--risk-critical)' : change > 0 ? 'var(--risk-high)' : 'var(--risk-low)', borderRadius: '3px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <span>Threshold: 70</span>
                  <span style={{ color: isAboveThreshold ? 'var(--risk-critical)' : 'var(--risk-low)', fontWeight: 600 }}>
                    {isAboveThreshold ? 'EXCEEDS' : 'Within Limit'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </TabPanel>
    </div>
  );
};

export default RiskRadar;
