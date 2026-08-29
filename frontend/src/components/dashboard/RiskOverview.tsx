import React, { useState } from 'react';
import { useRiskOverview } from '../../hooks/useDashboardData';
import { RiskBadge, AnimatedCounter, Button, Tabs, TabPanel } from '../common';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { ArrowUpRight, TrendingUp, ShieldAlert, Activity, RefreshCw, Download, Settings } from 'lucide-react';

const RiskOverview: React.FC = () => {
  const { data, isLoading, error, refetch } = useRiskOverview();
  const [activeTab, setActiveTab] = useState('overview');

  // Use data from API or fallback to mock
  const dashboardData = data || {
    score: 82,
    level: 'CRITICAL',
    velocity: 14.7,
    momentum: 18,
    exposure: 1240000,
    confidence: 93,
    domains: { financial: 85, customer: 72, fraud: 45, operational: 91, cyber: 38 }
  };

  // SVG parameters for circular progress
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (dashboardData.score / 100) * circumference;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
    { id: 'domains', label: 'Domains', icon: <ShieldAlert size={16} /> },
    { id: 'trends', label: 'Trends', icon: <TrendingUp size={16} /> },
  ];

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    if (!dashboardData) return;
    const csv = [
      ['Metric', 'Value'],
      ['Risk Score', dashboardData.score],
      ['Risk Level', dashboardData.level],
      ['Velocity', `${dashboardData.velocity}/wk`],
      ['Momentum', `${dashboardData.momentum}%`],
      ['Exposure', formatCurrency(dashboardData.exposure)],
      ['Confidence', `${dashboardData.confidence}%`],
      ...Object.entries(dashboardData.domains).map(([k, v]) => [`${k} Risk`, v]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-overview-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !data) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          <span style={{ color: 'var(--color-text-muted)' }}>Loading risk overview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px', color: 'var(--risk-critical)' }}>
          <span>Failed to load risk overview</span>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Risk Overview</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Enterprise-wide risk posture summary</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRefresh} title="Refresh data" disabled={isLoading}>Refresh</Button>
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} title="Export report" onClick={handleExport}>Export</Button>
          <Button variant="ghost" size="sm" leftIcon={<Settings size={14} />} title="Configure">Configure</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="enclosed" />

      <TabPanel id="overview" active={activeTab === 'overview'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'clamp(1.5rem, 4vw, 3rem)', flexWrap: 'wrap' }}>
          {/* Left Side: Score & Primary Info */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 'clamp(1.5rem, 4vw, 3rem)', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="80" cy="80" r={radius} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="var(--risk-critical)"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div style={{ textAlign: 'center', zIndex: 1 }}>
                <div style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1, color: 'var(--color-text-primary)' }}>
                  <AnimatedCounter value={dashboardData.score} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>OUT OF 100</div>
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '14px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Enterprise Risk Level</h3>
              <RiskBadge level={dashboardData.level} />
              
              <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
                <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Velocity</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px', fontWeight: 600, color: 'var(--risk-very-high)' }}>
                    <TrendingUp size={18} /> +{dashboardData.velocity}/wk
                  </div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Momentum</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px', fontWeight: 600, color: 'var(--risk-high)' }}>
                    <ArrowUpRight size={18} /> {formatPercentage(dashboardData.momentum)}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
                <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', minWidth: '160px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Exposure</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {formatCurrency(dashboardData.exposure)}
                  </div>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', minWidth: '160px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Confidence Score</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--risk-low)' }}>
                    {dashboardData.confidence}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Mini Cards */}
          <div style={{ width: '100%', maxWidth: '280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
{Object.entries(dashboardData.domains).map(([key, value], idx) => {
              const isHigh = value > 75;
              const isCritical = value > 85;
              return (
                <div key={key} style={{ 
                  padding: '14px 16px', 
                  backgroundColor: 'rgba(255,255,255,0.03)', 
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: `4px solid ${isCritical ? 'var(--risk-critical)' : isHigh ? 'var(--risk-very-high)' : (value > 50 ? 'var(--risk-moderate)' : 'var(--risk-low)')}`,
                  transition: 'all 0.2s',
                  animationDelay: `${idx * 0.05}s`,
                }} className="animate-slide-up">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: isCritical ? 'var(--risk-critical)' : isHigh ? 'var(--risk-very-high)' : (value > 50 ? 'var(--risk-moderate)' : 'var(--risk-low)')
                    }} />
                    <span style={{ textTransform: 'capitalize', fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>{key} Risk</span>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: isCritical ? 'var(--risk-critical)' : isHigh ? 'var(--risk-very-high)' : 'var(--color-text-primary)' }}>{value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </TabPanel>

      <TabPanel id="domains" active={activeTab === 'domains'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {Object.entries(dashboardData.domains).map(([key, value], idx) => {
            const isHigh = value > 75;
            const isCritical = value > 85;
            const riskColor = isCritical ? 'var(--risk-critical)' : isHigh ? 'var(--risk-very-high)' : (value > 50 ? 'var(--risk-moderate)' : 'var(--risk-low)');
            return (
              <div key={key} className="glass-card animate-slide-up" style={{ padding: '24px', animationDelay: `${idx * 0.05}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>{key} Risk</span>
                    <RiskBadge level={isCritical ? 'CRITICAL' : isHigh ? 'VERY HIGH' : value > 50 ? 'HIGH' : value > 30 ? 'MODERATE' : 'LOW'} style={{ marginTop: '8px', display: 'inline-block' }} />
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: riskColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: riskColor }}>{value}</span>
                  </div>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${value}%`, height: '100%', backgroundColor: riskColor, borderRadius: '3px', transition: 'width 1s ease-out' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  <span>Threshold: 70%</span>
                  <span style={{ color: value > 70 ? 'var(--risk-critical)' : 'var(--risk-low)', fontWeight: 600 }}>
                    {value > 70 ? 'Exceeded' : 'Within Limit'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </TabPanel>

      <TabPanel id="trends" active={activeTab === 'trends'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Score Trend (7 Days)</h4>
            <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', paddingBottom: '20px' }}>
              {[82, 79, 81, 83, 80, 82, 82].map((score, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '100%', height: `${score}%`, minHeight: '20px', background: `linear-gradient(180deg, var(--risk-critical), var(--accent-primary))`, borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Day {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Key Metrics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Avg Daily Change', value: '+0.3%', trend: 'up' },
                { label: 'Volatility Index', value: '12.4%', trend: 'down' },
                { label: 'Correlation Score', value: '0.73', trend: 'up' },
                { label: 'Risk Concentration', value: '68%', trend: 'stable' },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{m.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{m.value}</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: m.trend === 'up' ? 'rgba(220,38,38,0.2)' : m.trend === 'down' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: m.trend === 'up' ? 'var(--risk-critical)' : m.trend === 'down' ? 'var(--risk-low)' : 'var(--risk-moderate)' }}>
                      {m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '●'}
                    </span>
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

export default RiskOverview;
