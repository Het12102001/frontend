import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import api from '../api/axios';
import { Send, MessageCircle, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const stompClient = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initChat = async () => {
      try {
        const me = await api.get('/users/me/details');
        setCurrentUser(me.data);
        const res = await api.get('/chat/friends');
        setFriends(res.data);
      } catch (err) { console.error('Chat init failed', err); }
    };
    initChat();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    client.debug = () => {};
    client.connect({}, () => {
      client.subscribe(`/topic/messages/${currentUser.username}`, (payload) => {
        const msg = JSON.parse(payload.body);
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      });
    }, err => console.error('STOMP Error:', err));
    stompClient.current = client;
    return () => { try { if (client?.connected) client.disconnect(); } catch {} };
  }, [currentUser]);

  useEffect(() => {
    if (selectedFriend) {
      api.get(`/chat/history/${selectedFriend.username}`)
        .then(res => setMessages(res.data))
        .catch(err => console.error('History failed', err));
    }
  }, [selectedFriend]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;
    const content = newMessage;
    setNewMessage('');
    const localMsg = { id: Math.random() * -1000, sender: { username: currentUser.username }, content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, localMsg]);
    try {
      await api.post('/chat/send', { recipientId: selectedFriend.id, content });
    } catch { alert('Message failed to send.'); }
  };

  const handleDeleteMessage = async (messageId) => {
    if (messageId < 0) { alert('Wait for message to sync.'); return; }
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/chat/messages/${messageId}`);
      setMessages(messages.filter(m => m.id !== messageId));
    } catch { alert('Delete failed.'); }
  };

  const handleClearChat = async () => {
    if (!window.confirm(`Clear all messages with ${selectedFriend.username}?`)) return;
    try {
      await api.delete(`/chat/clear/${selectedFriend.username}`);
      setMessages([]);
    } catch { alert('Clear failed.'); }
  };

  const Avatar = ({ user, size = 40 }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: size * 0.35 }}>
      {user?.profileImageUrl
        ? <img src={`http://localhost:8080/uploads/${user.profileImageUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (user?.username?.[0] || '?').toUpperCase()}
    </div>
  );

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Topbar */}
      <nav style={{ background: 'rgba(8,12,20,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button onClick={() => navigate('/feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', borderRadius: '10px', padding: '8px', transition: 'all var(--transition)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'none'; }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={18} color="var(--accent)" />
          <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text)' }}>Messages</span>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '280px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--bg-2)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Conversations</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {friends.length === 0
              ? <p style={{ color: 'var(--text-3)', fontSize: '13px', textAlign: 'center', padding: '32px 16px' }}>No mutual friends yet.</p>
              : friends.map(friend => (
                <div key={friend.id} onClick={() => setSelectedFriend(friend)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all var(--transition)', background: selectedFriend?.id === friend.id ? 'rgba(59,130,246,0.12)' : 'transparent', border: selectedFriend?.id === friend.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent', marginBottom: '4px' }}
                  onMouseEnter={e => { if (selectedFriend?.id !== friend.id) e.currentTarget.style.background = 'var(--surface)'; }}
                  onMouseLeave={e => { if (selectedFriend?.id !== friend.id) e.currentTarget.style.background = 'transparent'; }}>
                  <Avatar user={friend} size={40} />
                  <div>
                    <p style={{ fontWeight: '700', fontSize: '14px', color: selectedFriend?.id === friend.id ? 'var(--accent)' : 'var(--text)' }}>{friend.username}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <div className="dot-online" style={{ width: '6px', height: '6px' }} />
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Online</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(8,12,20,0.6)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar user={selectedFriend} size={38} />
                  <div>
                    <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text)' }}>{selectedFriend.username}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div className="dot-online" />
                      <span style={{ fontSize: '11px', color: 'var(--success)' }}>Active now</span>
                    </div>
                  </div>
                </div>
                <button onClick={handleClearChat} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '12px', fontWeight: '600', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all var(--transition)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'none'; }}>
                  <Trash2 size={14} /> Clear
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {messages.length === 0
                  ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexDirection: 'column', gap: '8px' }}>
                    <MessageCircle size={36} color="var(--border-strong)" />
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>Say hi to {selectedFriend.username} 👋</p>
                  </div>
                  : messages.map((msg, idx) => {
                    const isMe = msg.sender.username === currentUser.username;
                    return (
                      <div key={msg.id || idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}
                        className="group">
                        {!isMe && <Avatar user={selectedFriend} size={28} />}

                        <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '6px', maxWidth: '65%' }}>
                          {isMe && msg.id > 0 && (
                            <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--border-strong)', padding: '4px', borderRadius: '6px', opacity: 0, transition: 'all var(--transition)', display: 'flex' }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.parentElement.querySelector('button').style.opacity = 1; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                          <div style={{ background: isMe ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'var(--surface-2)', border: isMe ? 'none' : '1px solid var(--border)', borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px', padding: '10px 14px', position: 'relative' }}>
                            <p style={{ fontSize: '14px', color: isMe ? 'white' : 'var(--text)', lineHeight: '1.5', margin: 0, wordBreak: 'break-word' }}>{msg.content}</p>
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', paddingBottom: '2px' }}>{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    );
                  })}
                <div ref={scrollRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'rgba(8,12,20,0.6)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '14px', padding: '12px 16px', fontSize: '14px', fontFamily: 'var(--font)', color: 'var(--text)', outline: 'none', transition: 'all var(--transition)' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="submit" disabled={!newMessage.trim()} style={{ width: '44px', height: '44px', borderRadius: '14px', border: 'none', background: newMessage.trim() ? 'var(--accent-gradient)' : 'var(--surface)', cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: newMessage.trim() ? 'white' : 'var(--text-3)', transition: 'all var(--transition)', flexShrink: 0, boxShadow: newMessage.trim() ? 'var(--shadow-accent)' : 'none' }}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-3)' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={30} color="var(--text-3)" />
              </div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-2)' }}>Select a conversation</p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>Choose a friend from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
