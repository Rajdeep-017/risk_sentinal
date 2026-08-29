import React, { useState } from 'react';
import { mockApprovals } from '../../lib/mockData';
import { Button, Modal, Tabs, TabPanel, Dropdown, EmptyState, RiskBadge } from '../common';
import { Check, X, Edit3, ShieldAlert, Filter, ChevronDown, Eye, RefreshCw, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../common/Toast';

interface ApprovalItem {
  id: string;
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH' | 'CRITICAL';
  recommendedAction: string;
  expectedImpact: string;
  confidence: number;
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  createdAt: Date;
  category: string;
}

const mockApprovalsExtended: ApprovalItem[] = [
  ...mockApprovals.map((a, i) => ({
    ...a,
    status: 'pending' as const,
    createdAt: new Date(Date.now() - (i + 1) * 3600000),
    category: i === 0 ? 'Fraud Prevention' : 'Operational',
  })),
  {
    id: 'a3',
    level: 'MODERATE',
    recommendedAction: 'Increase API Rate Limits for Partner API',
    expectedImpact: 'Reduce 429 errors by 90%. Additional infrastructure cost ₹8k/day.',
    confidence: 92,
    reasoning: 'Partner integration traffic has grown 40% over last month, hitting current limits.',
    status: 'approved',
    createdAt: new Date(Date.now() - 2 * 3600000),
    category: 'Operational',
  },
  {
    id: 'a4',
    level: 'HIGH',
    recommendedAction: 'Enable Enhanced Fraud Rules for Region APAC',
    expectedImpact: 'Block 95% of synthetic identity fraud. False positive rate ~3%.',
    confidence: 87,
    reasoning: 'New fraud pattern detected in APAC matching known synthetic identity rings.',
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60000),
    category: 'Fraud Prevention',
  },
];

const ApprovalQueue: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'moderate'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDetail, setShowDetail] = useState<ApprovalItem | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const { toast } = useToast();

  const tabs = [
    { id: 'pending', label: 'Pending', icon: <Clock size={16} /> },
    { id: 'approved', label: 'Approved', icon: <CheckCircle size={16} /> },
    { id: 'rejected', label: 'Rejected', icon: <XCircle size={16} /> },
  ];

  const filteredApprovals = mockApprovalsExtended
    .filter(a => activeTab === 'all' || a.status === activeTab)
    .filter(a => filter === 'all' || a.level.toLowerCase() === filter);

  const handleApprove = (_id: string) => {
    toast.success('Action approved successfully');
    // In real app: update status via API
  };

  const handleReject = (_id: string) => {
    toast.warning('Action rejected');
    // In real app: update status via API
  };

  const handleModify = (_id: string) => {
    toast.info('Opening modification dialog');
    // In real app: open modification modal
  };

  const handleBulkApprove = () => {
    toast.success(`${selectedItems.length} actions approved`);
    setSelectedItems([]);
    setShowBulkModal(false);
  };

  const severityOptions = [
    { label: 'All Severities', value: 'all' },
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Moderate', value: 'moderate' },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Approval Queue</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Review and approve AI-recommended risk mitigation actions</p>
        </div>
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
          <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={14} />}>Refresh</Button>
          {selectedItems.length > 0 && (
            <Button variant="primary" size="sm" leftIcon={<Check size={14} />} onClick={() => setShowBulkModal(true)}>
              Bulk Approve ({selectedItems.length})
            </Button>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab as any} variant="enclosed" />

      <TabPanel id="pending" active={activeTab === 'pending'}>
        {filteredApprovals.length === 0 ? (
          <EmptyState
            illustration="data"
            title="No pending approvals"
            description="All caught up! No actions require your attention at the moment."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredApprovals.map((approval, idx) => {
              const levelColor = `var(--risk-${approval.level.toLowerCase().replace(' ', '-')})`;
              return (
                <div
                  key={approval.id}
                  className="glass-card animate-slide-up"
                  style={{ 
                    padding: '24px', 
                    borderLeft: `4px solid ${levelColor}`,
                    animationDelay: `${idx * 0.05}s`,
                    transition: 'all 0.2s',
                    backgroundColor: selectedItems.includes(approval.id) ? 'rgba(59,130,246,0.03)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(approval.id)}
                        onChange={(e) => { 
                          e.stopPropagation();
                          setSelectedItems(prev => e.target.checked ? [...prev, approval.id] : prev.filter(id => id !== approval.id));
                        }}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', flexShrink: 0 }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldAlert size={24} color={levelColor} />
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{approval.recommendedAction}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <RiskBadge level={approval.level} />
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                              {approval.category}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {approval.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <Button variant="ghost" size="sm" onClick={() => setShowDetail(approval)} leftIcon={<Eye size={14} />}>Details</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>AI Reasoning</div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>{approval.reasoning}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Expected Impact</div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--risk-low)' }}>{approval.expectedImpact}</div>
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '60px', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${approval.confidence}%`, height: '100%', backgroundColor: approval.confidence > 85 ? 'var(--risk-low)' : approval.confidence > 70 ? 'var(--risk-moderate)' : 'var(--risk-high)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: approval.confidence > 85 ? 'var(--risk-low)' : 'var(--color-text-primary)' }}>
                            {approval.confidence}% Confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleReject(approval.id)} leftIcon={<X size={14} />}>Reject</Button>
                    <Button variant="outline" size="sm" onClick={() => handleModify(approval.id)} leftIcon={<Edit3 size={14} />}>Modify</Button>
                    <Button variant="primary" size="sm" onClick={() => handleApprove(approval.id)} leftIcon={<Check size={14} />}>Approve</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabPanel>

      <TabPanel id="approved" active={activeTab === 'approved'}>
        {mockApprovalsExtended.filter(a => a.status === 'approved').map((approval, idx) => (
          <div key={approval.id} className="glass-card animate-slide-up" style={{ padding: '24px', borderLeft: '4px solid var(--risk-low)', animationDelay: `${idx * 0.05}s`, opacity: 0.7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={24} color="var(--risk-low)" />
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{approval.recommendedAction}</h3>
              </div>
              <RiskBadge level={approval.level} />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{approval.reasoning}</div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              <span>Approved at {new Date(approval.createdAt.getTime() + 3600000).toLocaleString()}</span>
              <span>Confidence: {approval.confidence}%</span>
            </div>
          </div>
        ))}
      </TabPanel>

      <TabPanel id="rejected" active={activeTab === 'rejected'}>
        <EmptyState
          illustration="data"
          title="No rejected actions"
          description="All rejected actions would appear here for audit trail."
        />
      </TabPanel>

      <Modal
        isOpen={!!showDetail}
        onClose={() => setShowDetail(null)}
        title={showDetail?.recommendedAction}
        description={`${showDetail?.category} • ${showDetail?.level}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDetail(null)}>Close</Button>
            <Button variant="danger" onClick={() => { handleReject(showDetail!.id); setShowDetail(null); }} leftIcon={<X size={14} />}>Reject</Button>
            <Button variant="primary" onClick={() => { handleApprove(showDetail!.id); setShowDetail(null); }} leftIcon={<Check size={14} />}>Approve</Button>
          </>
        }
      >
        {showDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Severity</div>
                <RiskBadge level={showDetail.level} />
              </div>
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Category</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{showDetail.category}</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Confidence</div>
                <div style={{ fontWeight: 600, color: showDetail.confidence > 85 ? 'var(--risk-low)' : 'var(--color-text-primary)' }}>
                  {showDetail.confidence}%
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>AI Reasoning</div>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{showDetail.reasoning}</p>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Expected Impact</div>
              <p style={{ color: 'var(--risk-low)', lineHeight: 1.6 }}>{showDetail.expectedImpact}</p>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Audit Trail</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Created</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{showDetail.createdAt.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Submitted by</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>RiskSentinel AI</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Model Version</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>v2.4.1</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Approve Actions"
        description={`Approve ${selectedItems.length} selected actions at once`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleBulkApprove} leftIcon={<Check size={14} />}>Confirm Bulk Approve</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              You are about to approve {selectedItems.length} actions:
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {selectedItems.map(id => {
                const item = mockApprovalsExtended.find(a => a.id === id);
                return item ? (
                  <li key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: `var(--risk-${item.level.toLowerCase().replace(' ', '-')})` }} />
                    <span>{item.recommendedAction}</span>
                    <RiskBadge level={item.level} style={{ marginLeft: 'auto' }} />
                  </li>
                ) : null;
              })}
            </ul>
          </div>
          <div style={{ padding: '16px', backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: '10px', borderLeft: '4px solid var(--risk-high)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--risk-high)' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>This action cannot be undone</div>
                <div style={{ fontSize: '13px' }}>Approved actions will be executed immediately by the risk engine. Ensure you have reviewed each item carefully.</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApprovalQueue;
