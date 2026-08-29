import React, { useState, useMemo } from 'react';
import { useRiskHeatmap } from '../../hooks/useDashboardData';
import { Button, Tabs, TabPanel } from '../common';
import { RefreshCw, Download, Filter, AlertTriangle, Expand } from 'lucide-react';

const domains = ['Financial', 'Customer', 'Fraud', 'Operational', 'Cyber'];

const RiskHeatMap: React.FC = () => {
  const { data, refetch } = useRiskHeatmap();
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('correlation');
  const [colorScale, setColorScale] = useState<'risk' | 'correlation' | 'diverging'>('risk');
  const [showValues, setShowValues] = useState(true);

  const heatmapData = data || [];

  const tabs = [
    { id: 'correlation', label: 'Correlation', icon: <Filter size={16} /> },
    { id: 'risk', label: 'Risk Scores', icon: <AlertTriangle size={16} /> },
    { id: 'diverging', label: 'Diverging', icon: <Expand size={16} /> },
  ];

  const getValue = (x: string, y: string) => {
    const cell = heatmapData.find(d => d.x === x && d.y === y);
    return cell?.value || 0;
  };

  const getCorrelation = (x: string, y: string) => {
    const cell = heatmapData.find(d => d.x === x && d.y === y);
    return cell?.correlation || 0;
  };

  const getColor = useMemo(() => {
    if (colorScale === 'risk') {
      return (value: number) => {
        if (value > 75) return 'rgba(220, 38, 38, 0.8)';
        if (value > 60) return 'rgba(249, 115, 22, 0.7)';
        if (value > 45) return 'rgba(245, 158, 11, 0.6)';
        if (value > 30) return 'rgba(59, 130, 246, 0.5)';
        return 'rgba(16, 185, 129, 0.4)';
      };
    }
    if (colorScale === 'correlation') {
      return (value: number) => {
        const normalized = (value + 1) / 2;
        if (normalized > 0.75) return 'rgba(220, 38, 38, 0.8)';
        if (normalized > 0.6) return 'rgba(249, 115, 22, 0.7)';
        if (normalized > 0.45) return 'rgba(245, 158, 11, 0.5)';
        if (normalized > 0.3) return 'rgba(59, 130, 246, 0.5)';
        return 'rgba(16, 185, 129, 0.4)';
      };
    }
    return (value: number) => {
      if (value > 0.5) return `rgba(220, 38, 38, ${Math.min(0.8, value)})`;
      if (value > 0.2) return `rgba(249, 115, 22, ${Math.min(0.7, value * 1.5)})`;
      if (value > -0.2) return `rgba(245, 158, 11, ${Math.min(0.5, Math.abs(value) * 2)})`;
      if (value > -0.5) return `rgba(59, 130, 246, ${Math.min(0.6, Math.abs(value) * 1.5)})`;
      return `rgba(16, 185, 129, ${Math.min(0.7, Math.abs(value))})`;
    };
  }, [colorScale]);

  const getDisplayValue = (x: string, y: string) => {
    if (colorScale === 'correlation') return getCorrelation(x, y);
    if (colorScale === 'diverging') return getCorrelation(x, y);
    return getValue(x, y);
  };

  const formatValue = (val: number) => {
    if (colorScale === 'correlation' || colorScale === 'diverging') {
      return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
    }
    return val > 0 ? Math.round(val) : '—';
  };

  const getTextColor = (val: number) => {
    if (colorScale === 'correlation' || colorScale === 'diverging') {
      const normalized = (val + 1) / 2;
      return normalized > 0.6 ? '#fff' : 'var(--color-text-secondary)';
    }
    return val > 60 ? '#fff' : 'var(--color-text-secondary)';
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    if (!data || data.length === 0) return;
    const csv = [
      ['X', 'Y', 'Value', 'Correlation'],
      ...heatmapData.map(d => [d.x, d.y, d.value, d.correlation || '']),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-heatmap-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card animate-slide-up" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Cross-Risk Correlation Matrix
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRefresh} title="Refresh">Refresh</Button>
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={handleExport} title="Export">Export</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setColorScale(id as any); }} variant="soft" />

      <TabPanel id="correlation" active={activeTab === 'correlation'}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={showValues}
              onChange={(e) => setShowValues(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
            />
            Show Values
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['correlation', 'risk', 'diverging'].map(scale => (
              <Button
                key={scale}
                variant={colorScale === scale ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setColorScale(scale as any)}
              >
                {scale.charAt(0).toUpperCase() + scale.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${domains.length}, 1fr)`, gap: '2px' }}>
            <div />
            {domains.map(d => (
              <div key={`h-${d}`} style={{
                fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center',
                padding: '12px 4px', fontWeight: 600, textTransform: 'uppercase',
                backgroundColor: 'rgba(255,255,255,0.02)',
              }}>
                {d}
              </div>
            ))}

            {domains.map(row => (
              <React.Fragment key={row}>
                <div style={{
                  fontSize: '12px', color: 'var(--color-text-secondary)', padding: '8px 4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 500,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}>
                  {row}
                </div>
                {domains.map(col => {
                  const val = getDisplayValue(col, row);
                  const cellId = `${row}-${col}`;
                  const isHovered = hoveredCell === cellId;
                  const isDiagonal = row === col;
                  const displayVal = formatValue(val);
                  const textColor = getTextColor(val);
                  const bgColor = isDiagonal ? 'rgba(255,255,255,0.05)' : getColor(val);

                  return (
                    <div
                      key={cellId}
                      onMouseEnter={() => setHoveredCell(cellId)}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        backgroundColor: bgColor,
                        borderRadius: isDiagonal ? '0' : '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '48px',
                        fontSize: showValues ? '13px' : '0',
                        fontWeight: 600,
                        color: textColor,
                        cursor: row !== col ? 'pointer' : 'default',
                        transition: 'all 0.15s',
                        transform: isHovered && !isDiagonal ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: isHovered && !isDiagonal ? '0 0 15px rgba(59,130,246,0.3)' : 'none',
                        position: 'relative',
                        border: isDiagonal ? 'none' : '1px solid rgba(255,255,255,0.03)',
                      }}
                      title={`${row} × ${col}: ${colorScale === 'correlation' || colorScale === 'diverging' ? `Correlation: ${val.toFixed(3)}` : `Risk Score: ${Math.round(val)}`}${row !== col ? ' - Click for detailed analysis' : ''}`}
                    >
                      {showValues && displayVal}
                      {isDiagonal && !showValues && (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Self</div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          {[
            { label: 'Low', color: 'rgba(16, 185, 129, 0.4)' },
            { label: 'Medium', color: 'rgba(245, 158, 11, 0.5)' },
            { label: 'High', color: 'rgba(249, 115, 22, 0.6)' },
            { label: 'Critical', color: 'rgba(220, 38, 38, 0.8)' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </TabPanel>

      <TabPanel id="risk" active={activeTab === 'risk'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {domains.map((domain, _i) => {
            const domainData = heatmapData.filter(d => d.x === domain || d.y === domain);
            const avgRisk = domainData.reduce((sum, d) => sum + d.value, 0) / domainData.length;
            const maxRisk = Math.max(...domainData.map(d => d.value));
            return (
              <div key={domain} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{domain}</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: avgRisk > 75 ? 'var(--risk-critical)' : avgRisk > 50 ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                    {Math.round(avgRisk)}
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${avgRisk}%`, height: '100%', backgroundColor: avgRisk > 75 ? 'var(--risk-critical)' : avgRisk > 50 ? 'var(--risk-high)' : 'var(--risk-low)', borderRadius: '3px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <span>Avg: {Math.round(avgRisk)}</span>
                  <span>Max: {Math.round(maxRisk)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </TabPanel>

      <TabPanel id="diverging" active={activeTab === 'diverging'}>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          <Expand size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Diverging View</h4>
          <p style={{ fontSize: '13px' }}>Shows positive (red) vs negative (blue) correlations between risk domains</p>
        </div>
      </TabPanel>
    </div>
  );
};

export default RiskHeatMap;
