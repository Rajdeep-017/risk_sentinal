import React from 'react';

interface CopilotMessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: { filename: string; policy_id: string; risk_type: string }[];
  isStreaming?: boolean;
}

const CopilotMessage: React.FC<CopilotMessageProps> = ({ role, content, sources, isStreaming }) => {
  const isUser = role === 'user';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
      animation: 'slideUp 0.3s ease',
    }}>
      <div style={{
        maxWidth: '80%',
        padding: '14px 18px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        backgroundColor: isUser ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${isUser ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
      }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '12px',
            backgroundColor: isUser ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)',
          }}>
            {isUser ? '👤' : '🛡️'}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            {isUser ? 'You' : 'RiskSentinel'}
          </span>
        </div>

        {/* Content */}
        <div style={{
          fontSize: '14px',
          color: 'var(--color-text-primary)',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {content}
          {isStreaming && (
            <span style={{ display: 'inline-block', animation: 'pulse-critical 1s infinite' }}>▊</span>
          )}
        </div>

        {/* Source citations */}
        {sources && sources.length > 0 && (
          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
              Sources
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {sources.map((s, i) => (
                <span key={i} style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(59,130,246,0.1)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}>
                  📋 {s.filename} ({s.risk_type})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CopilotMessage;
