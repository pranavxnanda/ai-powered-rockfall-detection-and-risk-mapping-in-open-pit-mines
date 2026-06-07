import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import { Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'SYSTEM ONLINE. I am RFD·AI. Query me about safety procedures, risk zones, evacuation routes, or emergency protocols.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/assistant/chat', { message: input });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      toast.error('AI Assistant temporarily unavailable');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'OFFLINE — Contact your safety officer or check the risk map.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await api.post('/assistant/end-conversation');
      setMessages([
        {
          role: 'assistant',
          content:
            'SYSTEM ONLINE. I am RFD·AI. Query me about safety procedures, risk zones, evacuation routes, or emergency protocols.',
        },
      ]);
      toast.success('Chat cleared');
    } catch {
      console.error('Failed to clear');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-card)',
        border: '1px solid var(--cyan-border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'rgba(0,229,255,0.05)',
          borderBottom: '1px solid rgba(0,229,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--cyan)',
              boxShadow: '0 0 8px var(--cyan)',
            }}
            className="pulse-green"
          />
          <span
            style={{
              fontFamily: 'var(--font-head)',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.12em',
              color: 'var(--cyan)',
            }}
          >
            RFD·AI
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
            }}
          >
            POWERED BY GEMINI
          </span>
        </div>
        <button
          onClick={clearChat}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 4,
            borderRadius: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '0.5rem 0.75rem',
                borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                background: msg.role === 'user' ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                fontSize: '0.78rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                fontFamily: msg.role === 'assistant' ? 'var(--font-mono)' : 'var(--font-body)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px 10px 10px 2px',
                display: 'flex',
                gap: '0.3rem',
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((n) => (
                <span
                  key={n}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--cyan)',
                    opacity: 0.6,
                    animation: `bounce 1.2s ${n * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.65rem',
          borderTop: '1px solid rgba(0,229,255,0.1)',
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Query safety systems..."
          disabled={loading}
          className="cyber-input"
          style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn-cyber"
          style={{ padding: '0.5rem 0.7rem', flexShrink: 0 }}
        >
          <Send size={14} />
        </button>
      </div>
      <style>{`@keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }`}</style>
    </div>
  );
};
export default AIAssistant;
