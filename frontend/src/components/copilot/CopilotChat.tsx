import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, ThumbsUp, ThumbsDown, Flag, MoreVertical, Sparkles, FileText, BarChart2, Loader2 } from 'lucide-react';
import { Button } from '../common';
import { useToast } from '../common/Toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'outline' }>;
  citations?: string[];
}

const suggestedPrompts = [
  'Why is financial risk high?',
  'Summarize supplier impact',
  'What if churn increases 5%?',
  'Show me the risk cascade for S-104',
  'Generate mitigation plan for top 3 risks',
  'Compare current vs predicted risk scores',
];

const mockResponses: Record<string, { content: string; actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'outline' }>; citations?: string[] }> = {
  'financial risk': {
    content: 'Financial risk is elevated (85/100) primarily due to three factors: (1) Revenue concentration - top 3 customers represent 42% of AR, (2) FX exposure - 28% of revenue in volatile currencies, (3) Rising debt service costs from floating rate facilities. The supplier disruption at S-104 adds ₹4.2L daily exposure.',
    actions: [
      { label: 'View Financial Dashboard', onClick: () => {}, variant: 'primary' },
      { label: 'Generate Hedging Report', onClick: () => {}, variant: 'secondary' },
    ],
    citations: ['Financial Risk Report Q4', 'AR Aging Analysis', 'FX Exposure Model'],
  },
  'supplier impact': {
    content: 'Supplier S-104 disruption cascades through: Inventory → Order Fulfillment → Revenue. Current impact: 18% inventory shortage, 12% fulfillment delay, ₹7.8L projected revenue loss. Backup supplier S-202 can cover 60% capacity at 15% cost premium.',
    actions: [
      { label: 'Activate S-202', onClick: () => {}, variant: 'primary' },
      { label: 'View Cascade Analysis', onClick: () => {}, variant: 'secondary' },
    ],
    citations: ['Supplier Risk Assessment', 'Inventory Impact Model'],
  },
  'churn increases': {
    content: 'A 5% churn increase would raise Customer Risk from 72 to 84 (VERY HIGH). Revenue impact: ₹12.4M annually. Key drivers: pricing pressure (38%), service quality (29%), competitor offers (22%). Recommended: proactive retention campaign for at-risk segments.',
    actions: [
      { label: 'Run Retention Simulation', onClick: () => {}, variant: 'primary' },
      { label: 'View Churn Model', onClick: () => {}, variant: 'secondary' },
    ],
    citations: ['Churn Prediction Model', 'Customer Health Scores'],
  },
  'cascade': {
    content: 'The S-104 cascade: Root Cause → Inventory Shortage (HIGH, -18%) → Order Fulfillment Delay (HIGH, -12%) → Revenue Impact (CRITICAL, -4.2%, ₹780K exposure). Total path impact: -34.2% cumulative. Critical node: Revenue Impact at 91% probability.',
    actions: [
      { label: 'View Full Cascade', onClick: () => {}, variant: 'primary' },
      { label: 'Export Analysis', onClick: () => {}, variant: 'secondary' },
    ],
    citations: ['Cascade Analysis Engine', 'Impact Propagation Model'],
  },
  'mitigation': {
    content: 'Top 3 risk mitigation plan: 1) Supplier Diversification - onboard 2 alternate suppliers (90 days, ₹45L investment, reduces exposure 65%), 2) Inventory Buffer - increase safety stock 25% (30 days, ₹28L, reduces fulfillment risk 40%), 3) FX Hedging - forward contracts for 80% exposure (14 days, ₹12L, eliminates currency risk). Total investment: ₹85L, estimated risk reduction: 42%.',
    actions: [
      { label: 'Approve Mitigation Plan', onClick: () => {}, variant: 'primary' },
      { label: 'Simulate Impact', onClick: () => {}, variant: 'secondary' },
    ],
    citations: ['Mitigation Planning Framework', 'Cost-Benefit Analysis'],
  },
  'compare': {
    content: 'Current vs Predicted (30-day): Financial 85→91 (+6), Customer 72→78 (+6), Operational 91→94 (+3), Fraud 45→52 (+7), Cyber 38→41 (+3). Overall score: 82→88. Key driver: supplier cascade propagation accelerating. Confidence: 87%.',
    actions: [
      { label: 'View Prediction Model', onClick: () => {}, variant: 'primary' },
      { label: 'Run Scenario Analysis', onClick: () => {}, variant: 'secondary' },
    ],
    citations: ['Predictive Risk Engine', 'Monte Carlo Simulation'],
  },
};

const CopilotChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m the RiskSentinel AI Copilot. I can help you analyze risk posture, run simulations, generate reports, and recommend actions. What would you like to explore today?', timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const findMatchingResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();
    for (const [key, response] of Object.entries(mockResponses)) {
      if (lowerQuery.includes(key)) return response;
    }
    return {
      content: `I understand you're asking about "${query}". Let me analyze this for you. Based on current risk data, I can provide insights on financial risk, supplier cascades, customer churn, operational risk, fraud patterns, or cyber threats. Would you like me to run a specific analysis or simulation?`,
      actions: [
        { label: 'Run Full Risk Assessment', onClick: () => {}, variant: 'primary' },
        { label: 'View Dashboard', onClick: () => {}, variant: 'secondary' },
      ],
      citations: ['Risk Intelligence Engine'],
    };
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);
    setShowSuggestions(false);

    const response = findMatchingResponse(userMessage);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.content,
        timestamp: new Date(),
        actions: response.actions as Message['actions'],
        citations: response.citations,
      }]);
      toast.success('Analysis complete');
    }, 1500);
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    handleSend();
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handleFeedback = (_messageIndex: number, positive: boolean) => {
    toast.success(positive ? 'Thanks for the feedback!' : 'We\'ll improve. Thanks!');
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '900px', margin: '0 auto', padding: 0, overflow: 'hidden' }}>
      
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '10px' }}>
            <Bot size={24} color="var(--accent-primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>RiskSentinel Copilot</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Powered by specialized risk intelligence</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" leftIcon={<FileText size={14} />} title="New chat">New Chat</Button>
          <Button variant="ghost" size="sm" leftIcon={<BarChart2 size={14} />} title="Export chat">Export</Button>
          <Button variant="ghost" size="sm" leftIcon={<MoreVertical size={14} />} title="Settings">Settings</Button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {showSuggestions && messages.length === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '20px' }}>
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '0 40px' }}>
              <Sparkles size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <h4 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>How can I help?</h4>
              <p style={{ fontSize: '14px', lineHeight: 1.6 }}>Ask me about risk trends, run simulations, generate reports, or get action recommendations.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
              {suggestedPrompts.map((prompt, i) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(prompt)}
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px 16px', animationDelay: `${i * 0.05}s` }}
                  className="animate-slide-up"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              backgroundColor: msg.role === 'user' ? 'var(--bg-elevated)' : 'rgba(59, 130, 246, 0.2)' 
            }}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} color="var(--accent-primary)" />}
            </div>
            
            <div style={{ 
              maxWidth: '85%', 
              width: '100%',
            }}>
              <div style={{ 
                padding: '16px 20px', 
                borderRadius: '16px', 
                backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                color: msg.role === 'user' ? '#fff' : 'var(--color-text-primary)',
                fontSize: '14px',
                lineHeight: 1.7,
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '8px', alignSelf: 'center' }}>Sources:</span>
                    {msg.citations.map((c, ci) => (
                      <span key={ci} style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {msg.actions && msg.actions.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {msg.actions.map((action, ai) => (
                      <Button key={ai} variant={action.variant || 'primary'} size="sm" onClick={action.onClick}>
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(msg.content)} leftIcon={<Copy size={12} />} title="Copy">Copy</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleFeedback(i, true)} leftIcon={<ThumbsUp size={12} />} title="Helpful">Helpful</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleFeedback(i, false)} leftIcon={<ThumbsDown size={12} />} title="Not helpful">Not Helpful</Button>
                  <Button variant="ghost" size="sm" onClick={() => {}} leftIcon={<Flag size={12} />} title="Flag">Flag</Button>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px', marginLeft: msg.role === 'user' ? 'auto' : 0 }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', gap: '12px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
              <Bot size={18} color="var(--accent-primary)" />
            </div>
            <div style={{ padding: '16px 20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', gap: '4px', alignItems: 'center', borderBottomLeftRadius: '4px' }}>
              <Loader2 size={16} className="animate-spin" color="var(--accent-primary)" />
              <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px' }}>Analyzing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {suggestedPrompts.slice(0, 4).map(q => (
            <Button key={q} variant="ghost" size="sm" onClick={() => handleSuggestionClick(q)} style={{ fontSize: '12px' }}>
              {q}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(false); }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Ask Copilot anything... (Shift+Enter for new line)"
            style={{ 
              flex: 1, padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--color-text-primary)', outline: 'none', fontSize: '14px',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isTyping}
            size="lg"
            rightIcon={isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            style={{ padding: '0 24px' }}
          >
            {isTyping ? 'Sending...' : 'Send'}
          </Button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px', textAlign: 'center' }}>
          AI responses are generated based on current risk data. Verify critical decisions independently.
        </p>
      </div>
    </div>
  );
};

export default CopilotChat;
