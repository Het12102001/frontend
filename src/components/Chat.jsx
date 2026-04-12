import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import api from '../api/axios';
import { Send, MessageCircle, Trash2 } from 'lucide-react'; // 🚀 Added Trash2

const Chat = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  
  const stompClient = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const me = await api.get('/users/me/details');
        setCurrentUser(me.data);
        const res = await api.get('/chat/friends');
        setFriends(res.data);
      } catch (err) {
        console.error("Failed to load chat data", err);
      }
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
        const receivedMsg = JSON.parse(payload.body);
        setMessages((prev) => {
          if (prev.some(m => m.id === receivedMsg.id)) return prev;
          return [...prev, receivedMsg];
        });
      });
    }, (err) => console.error("STOMP Connection Error:", err));

    stompClient.current = client;
    return () => {
      try {
        if (client && client.connected) client.disconnect();
      } catch (error) {
        console.warn("WebSocket cleanup ignored a state error.", error.message);
      }
    };
  }, [currentUser]);

  useEffect(() => {
    if (selectedFriend) {
      api.get(`/chat/history/${selectedFriend.username}`)
        .then(res => setMessages(res.data))
        .catch(err => console.error("Failed to load history", err));
    }
  }, [selectedFriend]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    const messageContent = newMessage;
    setNewMessage("");

    const localMsg = {
      id: Math.random() * -1000, 
      sender: { username: currentUser.username },
      content: messageContent,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, localMsg]);

    try {
      await api.post('/chat/send', {
        recipientId: selectedFriend.id,
        content: messageContent
      });
    } catch (err) {
      console.error("Send failed", err);
      alert("Message failed to send.");
    }
  };

  // 🚀 NEW: Delete a single message
  const handleDeleteMessage = async (messageId) => {
    if (messageId < 0) {
      alert("Please wait a second for the message to sync before deleting.");
      return;
    }
    if (!window.confirm("Delete this message?")) return;
    
    try {
      await api.delete(`/chat/messages/${messageId}`);
      setMessages(messages.filter(m => m.id !== messageId));
    } catch (err) {
      alert("Failed to delete message.");
    }
  };

  // 🚀 NEW: Clear entire chat
  const handleClearChat = async () => {
    if (!window.confirm(`Are you sure you want to delete all messages with ${selectedFriend.username}? This cannot be undone.`)) return;
    
    try {
      await api.delete(`/chat/clear/${selectedFriend.username}`);
      setMessages([]); // Instantly clear the screen
    } catch (err) {
      alert("Failed to clear chat.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 mx-4 my-4">
      {/* Sidebar: Friends List */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <MessageCircle className="text-blue-600" /> Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {friends.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10 px-4">No mutual friends yet.</p>
          ) : (
            friends.map(friend => (
              <div 
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${selectedFriend?.id === friend.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'hover:bg-white text-slate-600'}`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-400">
                  {friend.profileImageUrl ? <img src={`http://localhost:8080/uploads/${friend.profileImageUrl}`} className="w-full h-full object-cover" /> : friend.username[0].toUpperCase()}
                </div>
                <p className="font-bold text-sm truncate">{friend.username}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedFriend ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-400">
                  {selectedFriend.profileImageUrl ? <img src={`http://localhost:8080/uploads/${selectedFriend.profileImageUrl}`} className="w-full h-full object-cover" /> : selectedFriend.username[0].toUpperCase()}
                </div>
                <p className="font-black text-slate-800">{selectedFriend.username}</p>
              </div>
              
              {/* 🚀 NEW: Clear Chat Button */}
              <button 
                onClick={handleClearChat}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1"
              >
                <Trash2 size={16} /> Clear Chat
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <p className="font-bold">Say hi to {selectedFriend.username}! 👋</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender.username === currentUser.username;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                      
                      {/* 🚀 NEW: Delete Single Message Icon (Appears on Hover) */}
                      {isMe && msg.id > 0 && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 mr-2 p-2 transition-all"
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..." 
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-100 transition-all"
              />
              <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
              <MessageCircle size={40} className="text-blue-300" />
            </div>
            <p className="font-bold text-slate-400">Select a mutual friend to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;