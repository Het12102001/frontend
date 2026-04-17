import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, Heart, MessageCircle, Share2,
  Image as ImageIcon, Send, X, Trash2, UserPlus, Search, Hash, ShieldCheck
} from 'lucide-react';

// ─── Shared style helpers ──────────────────────────────────────────────────────
const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xl)',
  overflow: 'hidden',
};

const avatarBase = {
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '700',
  overflow: 'hidden',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-2)',
  fontSize: '14px',
};

const iconBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '10px',
  transition: 'all var(--transition)',
  padding: '8px',
  color: 'var(--text-3)',
};

// ─── Feed ──────────────────────────────────────────────────────────────────────
const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchPosts, setSearchPosts] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const fileInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const fetchFeedData = async () => {
    try {
      setIsLoading(true);
      const meRes = await api.get('/users/me/details');
      setCurrentUser(meRes.data);
      const postsRes = await api.get('/posts?page=0&size=10');
      setPosts(postsRes.data.content || []);
      const suggestedRes = await api.get('/discovery/suggested');
      setSuggestedUsers(suggestedRes.data || []);
      const trendsRes = await api.get('/discovery/trending');
      setTrendingTags(trendsRes.data || []);
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFeedData(); }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchPosts([]); return; }
    const t = setTimeout(async () => {
      try {
        if (searchQuery.startsWith('#')) {
          const r = await api.get(`/discovery/search/posts?query=${encodeURIComponent(searchQuery)}`);
          setSearchPosts(r.data || []); setSearchResults([]);
        } else {
          const r = await api.get(`/discovery/search?query=${searchQuery}`);
          setSearchResults(r.data || []); setSearchPosts([]);
        }
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target))
        setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handlePostSubmit = async () => {
    if (!newPostContent.trim() && !selectedFile) return;
    setIsPosting(true);
    const formData = new FormData();
    formData.append('content', newPostContent);
    if (selectedFile) formData.append('file', selectedFile);
    try {
      const r = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosts([r.data, ...posts]);
      setNewPostContent(''); setSelectedFile(null); setPreviewUrl('');
    } catch { alert("Post failed. Avoid prohibited language."); }
    finally { setIsPosting(false); }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`);
      const r = await api.get('/posts?page=0&size=10');
      setPosts(r.data.content || []);
    } catch {}
  };

  const handleDelete = async (postId) => {
    if (!window.confirm(isAdmin ? '🛡️ Admin: Delete this post?' : 'Delete this post?')) return;
    try {
      isAdmin ? await api.delete(`/admin/posts/${postId}`) : await api.delete(`/posts/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
    } catch { alert('Delete failed.'); }
  };

  const toggleComments = (postId) => setExpandedComments(p => ({ ...p, [postId]: !p[postId] }));

  const handleCommentSubmit = async (postId) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;
    try {
      await api.post(`/posts/${postId}/comments`, { text });
      const r = await api.get('/posts?page=0&size=10');
      setPosts(r.data.content || []);
      setCommentTexts(p => ({ ...p, [postId]: '' }));
    } catch { alert('Comment failed.'); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(isAdmin ? '🛡️ Admin: Delete comment?' : 'Delete comment?')) return;
    try {
      isAdmin ? await api.delete(`/admin/comments/${commentId}`) : await api.delete(`/posts/comments/${commentId}`);
      const r = await api.get('/posts?page=0&size=10');
      setPosts(r.data.content || []);
    } catch { alert('Delete failed.'); }
  };

  const handleFollowSuggested = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setSuggestedUsers(p => p.filter(u => u.id !== userId));
      fetchFeedData();
    } catch { alert('Follow failed.'); }
  };

  const isOwnerCheck = (itemUser) => {
    if (!currentUser || !itemUser) return false;
    return itemUser.id === currentUser.id || itemUser.email?.toLowerCase() === currentUser.email?.toLowerCase();
  };

  const Avatar = ({ user, size = 40 }) => (
    <div style={{ ...avatarBase, width: size, height: size, fontSize: size * 0.35 }}>
      {user?.profileImageUrl
        ? <img src={`http://localhost:8080/uploads/${user.profileImageUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (user?.username?.[0] || 'U').toUpperCase()}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,12,20,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <span style={{ fontWeight: '800', fontSize: '17px', color: 'var(--text)', letterSpacing: '-0.02em' }}>Social<span className="gradient-text">Hub</span></span>
            {isAdmin && (
              <span style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={10} /> Admin
              </span>
            )}
          </div>

          {/* Search */}
          <div ref={searchDropdownRef} style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} size={16} />
              <input
                type="text"
                placeholder="Search users or #hashtags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                style={{
                  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '9px 14px 9px 36px', fontSize: '13px',
                  fontFamily: 'var(--font)', color: 'var(--text)', outline: 'none', transition: 'all var(--transition)',
                }}
                onMouseEnter={e => e.target.style.borderColor = 'var(--border-strong)'}
                onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--border)'; }}
              />
            </div>
            {isSearchFocused && (
              <div className="animate-scale-in glass-strong" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden', zIndex: 100, maxHeight: '360px', overflowY: 'auto' }}>
                {!searchQuery.trim() ? (
                  <div style={{ padding: '8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 12px 6px' }}>Trending</p>
                    {trendingTags.map((tag, i) => (
                      <div key={i} onClick={() => setSearchQuery(tag)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderRadius: '10px', transition: 'background var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: '30px', height: '30px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hash size={14} color="var(--accent)" /></div>
                        <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text)' }}>{tag}</span>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.startsWith('#') ? (
                  <div style={{ padding: '8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 12px 6px' }}>Posts</p>
                    {searchPosts.map(post => (
                      <div key={post.id} onClick={() => { setIsSearchFocused(false); navigate(`/profile/${post.user.username}`); }} style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: '10px', borderBottom: '1px solid var(--border)', transition: 'background var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', marginBottom: '3px' }}>@{post.user.username}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '8px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 12px 6px' }}>People</p>
                    {searchResults.map(user => (
                      <div key={user.id} onClick={() => { setIsSearchFocused(false); setSearchQuery(''); navigate(`/profile/${user.username}`); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', borderRadius: '10px', transition: 'background var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Avatar user={user} size={34} />
                        <div>
                          <p style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text)' }}>{user.username}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button onClick={() => navigate('/chat')} style={{ ...iconBtn }} title="Messages"
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
              <MessageCircle size={20} />
            </button>
            {currentUser && (
              <div onClick={() => navigate(`/profile/${currentUser.username}`)} style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--border-strong)', transition: 'border-color var(--transition)', marginLeft: '4px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}>
                {currentUser.profileImageUrl
                  ? <img src={`http://localhost:8080/uploads/${currentUser.profileImageUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', color: 'white' }}>{currentUser.username?.[0].toUpperCase()}</div>}
              </div>
            )}
            <button onClick={() => { logout(); navigate('/login'); }} style={{ ...iconBtn }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div style={{ minWidth: 0 }} className="stagger">

          {/* Create Post */}
          <div style={{ ...card, padding: '20px' }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border-strong)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'white', fontSize: '16px' }}>
                {currentUser?.profileImageUrl
                  ? <img src={`http://localhost:8080/uploads/${currentUser.profileImageUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (currentUser?.username?.[0] || 'U').toUpperCase()}
              </div>
              <textarea
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={2}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '15px', fontFamily: 'var(--font)', resize: 'none', lineHeight: '1.6', paddingTop: '8px' }}
              />
            </div>
            {previewUrl && (
              <div style={{ marginTop: '12px', position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <img src={previewUrl} style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }} />
                <button onClick={() => { setSelectedFile(null); setPreviewUrl(''); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                  <X size={14} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
              <button onClick={() => fileInputRef.current.click()} style={{ ...iconBtn }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
                <ImageIcon size={20} />
              </button>
              <button
                onClick={handlePostSubmit}
                disabled={isPosting || (!newPostContent.trim() && !selectedFile)}
                style={{ background: isPosting || (!newPostContent.trim() && !selectedFile) ? 'rgba(59,130,246,0.3)' : 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 20px', fontWeight: '700', fontSize: '13px', fontFamily: 'var(--font)', cursor: 'pointer', transition: 'all var(--transition)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isPosting ? <><span className="spinner" style={{ width: '14px', height: '14px' }} /> Posting...</> : <><Send size={14} /> Post</>}
              </button>
            </div>
          </div>

          {/* Posts */}
          {isLoading ? (
            [1,2,3].map(i => (
              <div key={i} style={{ ...card, padding: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                  <div className="skeleton" style={{ width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: '14px', width: '30%', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ height: '11px', width: '15%' }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: '14px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '14px', width: '80%' }} />
              </div>
            ))
          ) : posts.map((post) => {
            const isOwner = isOwnerCheck(post.user);
            const hasLiked = post.likes?.some(l => isOwnerCheck(l.user));

            return (
              <div key={post.id} style={{ ...card, transition: 'border-color var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>

                {/* Post header */}
                <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.user?.username}`)}>
                    <Avatar user={post.user} size={40} />
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>{post.user?.username}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontWeight: '500' }}>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  {(isOwner || isAdmin) && (
                    <button onClick={() => handleDelete(post.id)} style={{ ...iconBtn, color: 'var(--text-3)' }} title={isAdmin && !isOwner ? '🛡️ Admin Delete' : 'Delete'}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--danger)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '14px 20px', color: 'var(--text-2)', fontSize: '14px', lineHeight: '1.7' }}>{post.content}</div>
                {post.imageUrl && (
                  <div style={{ padding: '0 20px 16px' }}>
                    <img src={`http://localhost:8080/uploads/${post.imageUrl}`} style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', borderRadius: 'var(--radius)', display: 'block', border: '1px solid var(--border)' }} />
                  </div>
                )}

                {/* Actions */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '4px' }}>
                  <button onClick={() => handleLike(post.id)} style={{ ...iconBtn, color: hasLiked ? '#ef4444' : 'var(--text-3)', background: hasLiked ? 'rgba(239,68,68,0.1)' : 'none', gap: '6px', paddingLeft: '10px', paddingRight: '10px', fontSize: '13px', fontWeight: '600' }}
                    onMouseEnter={e => { if (!hasLiked) { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; } }}
                    onMouseLeave={e => { if (!hasLiked) { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'none'; } }}>
                    <Heart size={17} fill={hasLiked ? 'currentColor' : 'none'} />
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  <button onClick={() => toggleComments(post.id)} style={{ ...iconBtn, color: expandedComments[post.id] ? 'var(--accent)' : 'var(--text-3)', background: expandedComments[post.id] ? 'rgba(59,130,246,0.1)' : 'none', gap: '6px', paddingLeft: '10px', paddingRight: '10px', fontSize: '13px', fontWeight: '600' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; }}
                    onMouseLeave={e => { if (!expandedComments[post.id]) { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'none'; } }}>
                    <MessageCircle size={17} />
                    <span>{post.comments?.length || 0}</span>
                  </button>
                </div>

                {/* Comments */}
                {expandedComments[post.id] && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                    <div style={{ paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {post.comments?.map(comment => {
                        const isCOwner = isOwnerCheck(comment.user);
                        return (
                          <div key={comment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--surface)', borderRadius: '10px', padding: '10px 12px', border: '1px solid var(--border)' }}>
                            <div>
                              <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent)', marginRight: '6px' }}>{comment.user?.username}</span>
                              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{comment.text}</span>
                            </div>
                            {(isCOwner || isAdmin) && (
                              <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', transition: 'color var(--transition)', flexShrink: 0, marginLeft: '8px', paddingTop: '1px' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <input
                        type="text"
                        value={commentTexts[post.id] || ''}
                        onChange={e => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(post.id); } }}
                        placeholder="Write a comment..."
                        style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--font)', color: 'var(--text)', outline: 'none', transition: 'all var(--transition)' }}
                        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button onClick={() => handleCommentSubmit(post.id)} disabled={!commentTexts[post.id]?.trim()} style={{ background: commentTexts[post.id]?.trim() ? 'var(--accent-gradient)' : 'var(--surface)', border: 'none', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', color: commentTexts[post.id]?.trim() ? 'white' : 'var(--text-3)', transition: 'all var(--transition)', display: 'flex', alignItems: 'center' }}>
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '84px', alignSelf: 'flex-start' }}>
          {/* Trending */}
          <div style={{ ...card, padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔥 Trending
            </h3>
            {trendingTags.length === 0
              ? <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>No trends yet.</p>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {trendingTags.map((tag, i) => (
                  <span key={i} onClick={() => { setSearchQuery(tag); setIsSearchFocused(true); }} style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all var(--transition)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = 'var(--accent)'; }}>
                    {tag}
                  </span>
                ))}
              </div>}
          </div>

          {/* Suggested */}
          <div style={{ ...card, padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Discover
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {suggestedUsers.map(user => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${user.username}`)}>
                    <Avatar user={user} size={36} />
                    <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text)' }}>{user.username}</span>
                  </div>
                  <button onClick={() => handleFollowSuggested(user.id)} style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all var(--transition)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = 'var(--accent)'; }}>
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feed;
