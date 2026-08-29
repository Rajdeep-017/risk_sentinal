import React, { useState } from 'react';
import { api } from '../../lib/api';

interface AgentNode {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  group: 'input' | 'specialist' | 'analysis' | 'output';
}

const PIPELINE_NODES: AgentNode[] = [
  { id: 'data_quality', name: 'Data Quality', status: 'idle', group: 'input' },
  { id: 'financial_risk', name: 'Financial Risk', status: 'idle', group: 'specialist' },
  { id: 'customer_risk', name: 'Customer Risk', status: 'idle', group: 'specialist' },
  { id: 'fraud_risk', name: 'Fraud Detection', status: 'idle', group: 'specialist' },
  { id: 'operational_risk', name: 'Operational Risk', status: 'idle', group: 'specialist' },
  { id: 'cyber_risk', name: 'Cyber Risk', status: 'idle', group: 'specialist' },
  { id: 'risk_correlation', name: 'Correlation', status: 'idle', group: 'analysis' },
  { id: 'risk_scoring', name: 'Risk Scoring', status: 'idle', group: 'analysis' },
  { id: 'risk_prediction', name: 'Prediction', status: 'idle', group: 'analysis' },
  { id: 'root_cause', name: 'Root Cause', status: 'idle', group: 'analysis' },
  { id: 'impact_simulator', name: 'Impact Sim', status: 'idle', group: 'analysis' },
  { id: 'mitigation', name: 'Mitigation', status: 'idle', group: 'output' },
  { id: 'policy_guardrail', name: 'Policy Guard', status: 'idle', group: 'output' },
  { id: 'outcome_monitor', name: 'Monitor', status: 'idle', group: 'output' },
];

const AgentStatus: React.FC = () => {
  const [nodes, setNodes] = useState(PIPELINE_NODES);
  const [running, setRunning] = useState(false);
  const [entityId, setEntityId] = useState('C-0001');
  const [result, setResult] = useState<any>(null);

  const runPipeline = async () => {
    setRunning(true);
    setResult(null);

    // Animate nodes sequentially
    const groups = ['input', 'specialist', 'analysis', 'output'];
    for (const group of groups) {
      setNodes(prev => prev.map(n => n.group === group ? { ...n, status: 'running' } : n));
      await new Promise(r => setTimeout(r, 800));
      setNodes(prev => prev.map(n => n.group === group ? { ...n, status: 'complete' } : n));
    }

    try {
      const res = await api.triggerAssessment(entityId, 'customer');
      setResult(res);
    } catch (e) {
      setNodes(prev => prev.map(n => ({ ...n, status: n.status === 'complete' ? 'complete' : 'error' })));
    }
    setRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#3b82f6';
      case 'complete': return '#10b981';
      case 'error': return '#ef4444';
      default: return 'rgba(255,255,255,0.15)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '⟳';
      case 'complete': return '✓';
      case 'error': return '✕';
      default: return '○';
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Agent Pipeline Status
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={entityId}
            onChange={e => setEntityId(e.target.value)}
            placeholder="Entity ID"
            style={{
              padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text-primary)',
              fontSize: '13px', width: '120px',
            }}
          />
          <button
            onClick={runPipeline}
            disabled={running}
            style={{
              padding: '6px 16px', borderRadius: '6px', border: 'none',
              background: running ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', fontSize: '13px', fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            {running ? 'Running...' : 'Run Assessment'}
          </button>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {nodes.map((node, _i) => (
          <div
            key={node.id}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              backgroundColor: `${getStatusColor(node.status)}15`,
              border: `1px solid ${getStatusColor(node.status)}40`,
              textAlign: 'center',
              transition: 'all 0.3s ease',
              animation: node.status === 'running' ? 'pulse-critical 1.5s infinite' : 'none',
            }}
          >
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>{getStatusIcon(node.status)}</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 500, lineHeight: 1.2 }}>
              {node.name}
            </div>
          </div>
        ))}
      </div>

      {/* Result summary */}
      {result && (
        <div style={{
          marginTop: '16px', padding: '16px', borderRadius: '8px',
          backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--risk-low)', marginBottom: '8px' }}>
            Assessment Complete
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Score: </span>
              <span style={{ fontWeight: 600 }}>{result.composite_score?.toFixed(1) || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Level: </span>
              <span style={{ fontWeight: 600 }}>{result.risk_level || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Status: </span>
              <span style={{ fontWeight: 600 }}>{result.approval_status || '—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentStatus;
