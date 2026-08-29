import React, { useState, useMemo } from 'react';
import { Play, RotateCcw, Download, RefreshCw, AlertTriangle, TrendingUp, DollarSign, Users, Settings, Zap } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell } from 'recharts';
import { Button, Tabs, TabPanel } from '../common';
import { useToast } from '../common/Toast';

interface SimulationParams {
  supplierDelay: number;
  inventoryDrop: number;
  churnIncrease: number;
  demandShock: number;
  fxVolatility: number;
  regulatoryChange: number;
}

interface SimulationResult {
  domain: string;
  before: number;
  after: number;
  change: number;
  exposure: number;
  confidence: number;
}

const CounterfactualPanel: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const [activeTab, setActiveTab] = useState('chart');
  const { toast } = useToast();

  const [params, setParams] = useState<SimulationParams>({
    supplierDelay: 5,
    inventoryDrop: 15,
    churnIncrease: 2,
    demandShock: 0,
    fxVolatility: 0,
    regulatoryChange: 0,
  });

  const parameterGroups = [
    { key: 'supplierDelay' as keyof SimulationParams, label: 'Supplier Delay (Days)', min: 0, max: 30, step: 1, icon: AlertTriangle, color: 'var(--risk-very-high)', description: 'Days of primary supplier disruption' },
    { key: 'inventoryDrop' as keyof SimulationParams, label: 'Inventory Drop (%)', min: 0, max: 50, step: 1, icon: TrendingUp, color: 'var(--risk-high)', description: 'Percentage reduction in available inventory' },
    { key: 'churnIncrease' as keyof SimulationParams, label: 'Customer Churn Increase (%)', min: 0, max: 20, step: 1, icon: Users, color: 'var(--risk-moderate)', description: 'Additional customer churn rate' },
    { key: 'demandShock' as keyof SimulationParams, label: 'Demand Shock (%)', min: -30, max: 30, step: 5, icon: Zap, color: 'var(--accent-primary)', description: 'Sudden demand change (negative = drop)' },
    { key: 'fxVolatility' as keyof SimulationParams, label: 'FX Volatility (%)', min: 0, max: 15, step: 1, icon: DollarSign, color: 'var(--risk-low)', description: 'Currency volatility impact on margins' },
    { key: 'regulatoryChange' as keyof SimulationParams, label: 'Regulatory Impact', min: 0, max: 10, step: 1, icon: Settings, color: 'var(--color-text-muted)', description: 'Regulatory compliance cost increase' },
  ];

  const handleSimulate = async () => {
    setIsSimulating(true);
    
    // Simulate API call
    await new Promise(r => setTimeout(r, 1800));
    
    const simulationResults: SimulationResult[] = [
      { 
        domain: 'Financial', 
        before: 85, 
        after: Math.min(100, 85 + params.churnIncrease * 2 + params.fxVolatility * 1.5 + params.regulatoryChange * 2), 
        change: 0,
        exposure: Math.round((params.churnIncrease * 2 + params.fxVolatility * 1.5) * 50000),
        confidence: 92 
      },
      { 
        domain: 'Customer', 
        before: 72, 
        after: Math.min(100, 72 + params.supplierDelay * 1.5 + params.churnIncrease * 3 + params.demandShock * 0.5), 
        change: 0,
        exposure: Math.round((params.supplierDelay * 1.5 + params.churnIncrease * 3) * 30000),
        confidence: 88 
      },
      { 
        domain: 'Operational', 
        before: 91, 
        after: Math.min(100, 91 + params.inventoryDrop * 0.5 + params.supplierDelay * 0.8 + params.regulatoryChange * 1.2), 
        change: 0,
        exposure: Math.round((params.inventoryDrop * 0.5 + params.supplierDelay * 0.8) * 40000),
        confidence: 95 
      },
      { 
        domain: 'Fraud', 
        before: 45, 
        after: Math.min(100, 45 + params.demandShock * 0.3 + params.fxVolatility * 0.8), 
        change: 0,
        exposure: Math.round((params.demandShock * 0.3 + params.fxVolatility * 0.8) * 20000),
        confidence: 85 
      },
      { 
        domain: 'Cyber', 
        before: 38, 
        after: Math.min(100, 38 + params.regulatoryChange * 1.5), 
        change: 0,
        exposure: Math.round(params.regulatoryChange * 1.5 * 15000),
        confidence: 90 
      },
    ].map(r => ({ ...r, change: r.after - r.before }));

    setResults(simulationResults);
    setIsSimulating(false);
    toast.success('Simulation completed successfully');
  };

  const handleReset = () => {
    setParams({
      supplierDelay: 5,
      inventoryDrop: 15,
      churnIncrease: 2,
      demandShock: 0,
      fxVolatility: 0,
      regulatoryChange: 0,
    });
    setResults(null);
  };

  const totalExposure = useMemo(() => 
    results?.reduce((sum, r) => sum + r.exposure, 0) || 0, [results]
  );

  const avgConfidence = useMemo(() => 
    results ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length) : 0, [results]
  );

  const worstDomain = useMemo(() => 
    results ? results.reduce((max, r) => r.change > max.change ? r : max, results[0]) : null, [results]
  );

  const tabs = [
    { id: 'chart', label: 'Chart View', icon: <TrendingUp size={16} /> },
    { id: 'table', label: 'Data Table', icon: <Settings size={16} /> },
    { id: 'summary', label: 'Summary', icon: <AlertTriangle size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Counterfactual Simulator</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Model risk scenarios and quantify potential business impact</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleReset} disabled={isSimulating}>Reset</Button>
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={() => results && toast.success('Report downloaded')} disabled={!results || isSimulating}>Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ minHeight: '500px' }}>
        {/* Parameters Panel */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={20} color="var(--accent-primary)" />
            Simulation Parameters
          </h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            {parameterGroups.map((group, idx) => (
              <div key={group.key} className="animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <group.icon size={16} color={group.color} />
                    <label style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{group.label}</label>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '16px', color: group.color }}>
                    {params[group.key]}{group.key === 'demandShock' && params[group.key] > 0 ? '+' : ''}{group.step === 1 ? (group.key === 'supplierDelay' ? '' : '%') : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min={group.min}
                  max={group.max}
                  step={group.step}
                  value={params[group.key]}
                  onChange={(e) => setParams(prev => ({ ...prev, [group.key]: Number(e.target.value) }))}
                  style={{ 
                    width: '100%', 
                    accentColor: group.color,
                    height: '6px',
                  }}
                />
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>{group.description}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              onClick={handleSimulate}
              disabled={isSimulating}
              size="lg"
              leftIcon={isSimulating ? <RotateCcw size={18} className="animate-spin" /> : <Play size={18} />}
              style={{ width: '100%' }}
            >
              {isSimulating ? 'Running Simulation...' : 'Run Simulation'}
            </Button>
            {results && (
              <Button variant="outline" size="md" onClick={handleReset} style={{ width: '100%' }}>
                Run New Simulation
              </Button>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Impact Analysis</h3>
            {results && (
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <span>Total Exposure: <span style={{ fontWeight: 600, color: 'var(--risk-critical)' }}>{formatCurrency(totalExposure)}</span></span>
                <span>Avg Confidence: <span style={{ fontWeight: 600, color: avgConfidence > 85 ? 'var(--risk-low)' : 'var(--risk-moderate)' }}>{avgConfidence}%</span></span>
              </div>
            )}
          </div>

          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="soft" />

          <TabPanel id="chart" active={activeTab === 'chart'}>
            {results ? (
              <div style={{ height: '360px' }} className="animate-fade-in">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="domain" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="var(--color-text-muted)" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = { before: 'Before', after: 'After (Simulated)' };
                        return [`${value}`, labels[name] || name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="before" name="Before" fill="var(--color-text-muted)" radius={[4,4,0,0]} />
                    <Bar 
                      dataKey="after" 
                      name="After (Simulated)" 
                      radius={[4,4,0,0]}
                    >
                      {results.map((r, i) => (
                        <Cell key={i} fill={r.change > 0 ? 'var(--risk-critical)' : r.change < 0 ? 'var(--risk-low)' : 'var(--accent-primary)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <Zap size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>No Simulation Results</h4>
                <p style={{ fontSize: '13px', maxWidth: '300px' }}>Adjust parameters and run a simulation to see the impact analysis across all risk domains.</p>
              </div>
            )}
          </TabPanel>

          <TabPanel id="table" active={activeTab === 'table'}>
            {results ? (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Domain</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Before</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>After</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Change</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Exposure</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r.domain} style={{ borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                        <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: r.change > 0 ? 'var(--risk-critical)' : r.change < 0 ? 'var(--risk-low)' : 'var(--accent-primary)' }} />
                          <span style={{ fontWeight: 500 }}>{r.domain}</span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>{r.before}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: r.change > 0 ? 'var(--risk-critical)' : 'var(--color-text-primary)' }}>{r.after}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, color: r.change > 0 ? 'var(--risk-critical)' : r.change < 0 ? 'var(--risk-low)' : 'var(--accent-primary)' }}>
                            {r.change > 0 ? '+' : ''}{r.change}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--risk-critical)' }}>
                          {formatCurrency(r.exposure)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${r.confidence}%`, height: '100%', backgroundColor: r.confidence > 85 ? 'var(--risk-low)' : 'var(--risk-moderate)', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: r.confidence > 85 ? 'var(--risk-low)' : 'var(--risk-moderate)' }}>{r.confidence}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>Run a simulation to see data table</div>
            )}
          </TabPanel>

          <TabPanel id="summary" active={activeTab === 'summary'}>
            {results ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--risk-critical)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Highest Impact Domain</div>
                      <h4 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{worstDomain?.domain || '—'}</h4>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--risk-critical)' }}>{worstDomain ? (worstDomain.change > 0 ? '+' : '') + worstDomain.change : '—'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Risk Score Change</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <span>Exposure: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatCurrency(worstDomain?.exposure || 0)}</span></span>
                    <span>Confidence: <span style={{ fontWeight: 600 }}>{worstDomain?.confidence || 0}%</span></span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {results.map(r => (
                    <div key={r.domain} style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: `3px solid ${r.change > 0 ? 'var(--risk-critical)' : r.change < 0 ? 'var(--risk-low)' : 'var(--accent-primary)'}` }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{r.domain}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: r.change > 0 ? 'var(--risk-critical)' : r.change < 0 ? 'var(--risk-low)' : 'var(--accent-primary)' }}>
                        {r.change > 0 ? '+' : ''}{r.change}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {formatCurrency(r.exposure)} exposure
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Key Insights</div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><TrendingUp size={14} color="var(--risk-critical)" style={{ flexShrink: 0, marginTop: '2px' }} /> {worstDomain?.domain} risk increases by {worstDomain?.change} points, requiring immediate attention</li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><DollarSign size={14} color="var(--risk-moderate)" style={{ flexShrink: 0, marginTop: '2px' }} /> Total projected exposure: {formatCurrency(totalExposure)} across all domains</li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Users size={14} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} /> Average model confidence: {avgConfidence}% - results are reliable for decision making</li>
                    {params.supplierDelay > 10 && (
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <AlertTriangle size={14} color="var(--risk-very-high)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        {'Supplier delay exceeds 10 days - consider activating backup suppliers immediately'}
                      </li>
                    )}
                    {params.churnIncrease > 10 && (
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <AlertTriangle size={14} color="var(--risk-very-high)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        {'Churn increase >10% - launch retention campaigns for at-risk segments'}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>Run a simulation to see summary</div>
            )}
          </TabPanel>
        </div>
      </div>
    </div>
  );
};

export default CounterfactualPanel;
