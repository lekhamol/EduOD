import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I am your Edu OD Assistant. Ask me anything about On-Duty leaves, verification, or check your request status!", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/chatbot', {
        message: userMsg,
        token
      });

      setMessages((prev) => [...prev, { text: response.data.reply, sender: 'bot' }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { text: "Sorry, I couldn't reach the server. Please try again.", sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {!isOpen ? (
        <div className="chatbot-btn" onClick={() => setIsOpen(true)}>
          <MessageSquare size={26} />
        </div>
      ) : (
        <div className="chatbot-window glass-card">
          <div className="chat-header">
            <div className="chat-bot-info">
              <div className="chat-bot-avatar">
                <MessageSquare size={18} color="white" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem' }}>OD Assistant</h4>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Online Help Desk</span>
              </div>
            </div>
            <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-msg ${msg.sender === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}`}>
                {msg.text.split('\n').map((line, idx) => (
                  <p key={idx} style={{ margin: 0, paddingBottom: '0.2rem' }}>{line}</p>
                ))}
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg-bot" style={{ opacity: 0.6 }}>
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="chat-send-btn" type="submit" disabled={loading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
