import React, { useState } from 'react';
import { useRiskCascade } from '../../hooks/useDashboardData';
import { mockCascade } from '../../lib/mockData';
import { RiskBadge, Button, Tabs, TabPanel, EmptyState, Modal } from '../common';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { Activity, ChevronRight, Target, AlertTriangle, Search, Eye, Download } from 'lucide-react';

interface CascadeNode {
  id: string;
  type: string;
  description: string;
  impact: number;
  exposure: number;
  level: string;
  children?: CascadeNode[];
}

const RiskCascade: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tree');
  const [selectedNode, setSelectedNode] = useState<CascadeNode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['root', 'n1']);
  const { data } = useRiskCascade();

  const tabs = [
    { id: 'tree', label: 'Cascade Tree', icon: <Target size={16} /> },
    { id: 'list', label: 'Impact List', icon: <Activity size={16} /> },
    { id: 'analysis', label: 'Root Cause', icon: <AlertTriangle size={16} /> },
  ];

  const cascadeData = data || mockCascade;

  const allNodes: CascadeNode[] = [];
  const collectNodes = (node: CascadeNode) => {
    allNodes.push(node);
    node.children?.forEach(collectNodes);
  };
  collectNodes(cascadeData);

  const filteredNodes = allNodes.filter(node =>
    (node.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (node.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const csv = [
      ['ID', 'Type', 'Description', 'Impact', 'Exposure', 'Level', 'Children'],
      ...allNodes.map(node => [
        node.id,
        node.type,
        node.description,
        formatPercentage(node.impact),
        formatCurrency(node.exposure),
        node.level,
        node.children?.length || 0
      ]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-cascade-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderNode = (node: CascadeNode, depth = 0) => {
    const isExpanded = expandedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;

    const levelColor = `var(--risk-${(node.level || 'LOW').toLowerCase().replace(' ', '-')})`;

    return (
      <div key={node.id} style={{ position: 'relative' }}>
        <div
          className={`glass-card ${isSelected ? 'ring-2' : ''}`}
          style={{
            width: `calc(100% - ${depth * 24}px)`,
            minWidth: '280px',
            marginLeft: `${depth * 24}px`,
            padding: '16px',
            borderLeft: `4px solid ${levelColor}`,
            backgroundColor: isSelected ? 'rgba(59,130,246,0.05)' : 'rgba(17, 24, 39, 0.8)',
            border: isSelected ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.2s',
            position: 'relative',
            zIndex: 1,
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT') {
              setSelectedNode(isSelected ? null : node);
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ padding: '4px', marginTop: '2px', flexShrink: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedNodes(prev => prev.includes(node.id)
                      ? prev.filter(id => id !== node.id)
                      : [...prev, node.id]);
                  }}
                >
                  <ChevronRight size={16} style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                </Button>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    {node.type}
                  </span>
                  <RiskBadge level={node.level as any} />
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {node.description}
                </h4>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                  {node.impact !== 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Impact</span>
                      <span style={{ fontWeight: 600, color: node.impact < 0 ? 'var(--risk-critical)' : 'var(--risk-low)' }}>
                        {formatPercentage(node.impact)}
                      </span>
                    </div>
                  )}
                  {node.exposure !== 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Exposure</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {formatCurrency(node.exposure)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedNode(node); setShowModal(true); }} aria-label="View details">
                <Eye size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }} aria-label="Take action">
                <Target size={14} />
              </Button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={{ marginLeft: '12px', borderLeft: '2px dashed rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Risk Cascade Analysis</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Trace risk propagation from root cause to business impact</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" leftIcon={<Search size={14} />} onClick={() => {}}>Search</Button>
          <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={handleExport}>Export</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => setExpandedNodes(allNodes.map(n => n.id))} leftIcon={<ChevronRight size={14} />}>Expand All</Button>
          <Button variant="ghost" size="sm" onClick={() => setExpandedNodes(['root'])} leftIcon={<ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} />}>Collapse All</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="enclosed" />

      <TabPanel id="tree" active={activeTab === 'tree'}>
        <div style={{ overflowX: 'auto', paddingBottom: '24px' }}>
          {searchQuery ? (
            filteredNodes.length > 0 ? (
              filteredNodes.map(node => renderNode(node))
            ) : (
              <EmptyState illustration="search" title="No matching nodes" description="Try a different search term" />
            )
          ) : (
            renderNode(cascadeData)
          )}
        </div>
      </TabPanel>

      <TabPanel id="list" active={activeTab === 'list'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {allNodes.map(node => {
const levelColor = `var(--risk-${(node.level || 'LOW').toLowerCase().replace(' ', '-')})`;
            return (
              <div
                key={node.id}
                className="glass-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  borderLeft: `4px solid ${levelColor}`,
                  transition: 'all 0.2s',
                  backgroundColor: selectedNode?.id === node.id ? 'rgba(59,130,246,0.05)' : 'transparent',
                }}
                onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
              >
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: levelColor, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                      {node.type}
                    </span>
                    <RiskBadge level={node.level as any} />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Depth: {node.id.split('-').length - 1}</span>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {node.description}
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {node.impact !== 0 && <span>Impact: <span style={{ color: node.impact < 0 ? 'var(--risk-critical)' : 'var(--risk-low)', fontWeight: 600 }}>{formatPercentage(node.impact)}</span></span>}
                    {node.exposure !== 0 && <span>Exposure: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatCurrency(node.exposure)}</span></span>}
                    <span>Children: {node.children?.length || 0}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedNode(node); setShowModal(true); }}>
                  <Eye size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      </TabPanel>

      <TabPanel id="analysis" active={activeTab === 'analysis'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={22} color="var(--risk-critical)" />
              Root Cause Analysis
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { factor: 'Primary Supplier Failure (S-104)', impact: '100%', confidence: 95 },
                { factor: 'Single Source Dependency', impact: '85%', confidence: 90 },
                { factor: 'No Contingency Inventory', impact: '72%', confidence: 88 },
                { factor: 'Extended Lead Times', impact: '58%', confidence: 82 },
              ].map((f, i) => (
                <div key={i} style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: '4px solid var(--risk-critical)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{f.factor}</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--risk-critical)' }}>{f.impact}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginRight: '12px', overflow: 'hidden' }}>
                      <div style={{ width: f.impact, height: '100%', backgroundColor: 'var(--risk-critical)', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Confidence: {f.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={22} color="var(--accent-primary)" />
              Recommended Actions
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { action: 'Activate backup supplier S-202', priority: 'CRITICAL', effort: 'Low', savings: '₹4.2L/day' },
                { action: 'Negotiate emergency shipping', priority: 'HIGH', effort: 'Medium', savings: '₹1.8L/day' },
                { action: 'Redistribute inventory from regional DCs', priority: 'MODERATE', effort: 'Medium', savings: '₹85k/day' },
                { action: 'Implement supplier diversification program', priority: 'MODERATE', effort: 'High', savings: 'Long-term' },
              ].map((a, i) => (
                <Button
                  key={i}
                  variant={a.priority === 'CRITICAL' ? 'danger' : a.priority === 'HIGH' ? 'primary' : 'outline'}
                  onClick={() => { setSelectedNode({ id: `action-${i}`, type: 'Action', description: a.action, impact: 0, exposure: 0, level: a.priority }); setShowModal(true); }}
                  style={{ justifyContent: 'space-between', textAlign: 'left', padding: '16px' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.action}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', gap: '16px' }}>
                      <span>Effort: {a.effort}</span>
                      <span>Impact: {a.savings}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RiskBadge level={a.priority as any} />
                    <ChevronRight size={16} color="var(--color-text-muted)" />
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </TabPanel>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedNode(null); }}
        title={selectedNode?.description || 'Node Details'}
        description={selectedNode ? `${selectedNode.type} • ${selectedNode.level}` : undefined}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
            <Button variant="primary" onClick={() => { setShowModal(false); }}>Take Action</Button>
          </>
        }
      >
        {selectedNode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Type</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedNode.type}</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Severity</div>
                <RiskBadge level={selectedNode.level as any} />
              </div>
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Impact</div>
                <div style={{ fontWeight: 600, color: selectedNode.impact < 0 ? 'var(--risk-critical)' : 'var(--risk-low)' }}>
                  {formatPercentage(selectedNode.impact)}
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Exposure</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {formatCurrency(selectedNode.exposure)}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Description</div>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{selectedNode.description}</p>
            </div>
            {selectedNode.children && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Downstream Effects ({selectedNode.children.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedNode.children.map(child => (
                    <div key={child.id} style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid var(--risk-${child.level.toLowerCase().replace(' ', '-')})` }}>
                      <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{child.description}</div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        <span>Impact: <span style={{ color: child.impact < 0 ? 'var(--risk-critical)' : 'var(--risk-low)', fontWeight: 600 }}>{formatPercentage(child.impact)}</span></span>
                        <span>Exposure: <span style={{ fontWeight: 600 }}>{formatCurrency(child.exposure)}</span></span>
                        <RiskBadge level={child.level as any} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RiskCascade;
