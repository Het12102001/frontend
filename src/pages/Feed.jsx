import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, Heart, MessageCircle, Share2, 
  Image as ImageIcon, Send, X, Trash2, UserPlus, Search, Hash, ShieldCheck
} from 'lucide-react';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  
  // 🚀 ADMIN DETECTION
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  // Comment states
  const [expandedComments, setExpandedComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});

  // Search Bar States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchPosts, setSearchPosts] = useState([]); 
  const [trendingTags, setTrendingTags] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchDropdownRef = useRef(null);

  const fileInputRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchFeedData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Get Me (Returns role for Admin detection)
      const meRes = await api.get('/users/me/details');
      setCurrentUser(meRes.data);

      // 2. Get Feed 
      // NOTE: Backend handles the "Show All" logic if the role is ADMIN
      const postsRes = await api.get('/posts?page=0&size=10'); 
      setPosts(postsRes.data.content || []);

      const suggestedRes = await api.get('/discovery/suggested');
      setSuggestedUsers(suggestedRes.data || []);

      const trendsRes = await api.get('/discovery/trending');
      setTrendingTags(trendsRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedData();
  }, []);

  // Smart Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchPosts([]);
      return;
    }
    const delaySearch = setTimeout(async () => {
      try {
        if (searchQuery.startsWith('#')) {
          const res = await api.get(`/discovery/search/posts?query=${encodeURIComponent(searchQuery)}`);
          setSearchPosts(res.data || []);
          setSearchResults([]);
        } else {
          const res = await api.get(`/discovery/search?query=${searchQuery}`);
          setSearchResults(res.data || []);
          setSearchPosts([]);
        }
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !selectedFile) return;
    setIsPosting(true);
    const formData = new FormData();
    formData.append('content', newPostContent);
    if (selectedFile) formData.append('file', selectedFile);
    try {
      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPosts([response.data, ...posts]);
      setNewPostContent('');
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (err) {
      alert("Post failed. and please don't use bad language");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`);
      const postsRes = await api.get('/posts?page=0&size=10'); 
      setPosts(postsRes.data.content || []);
    } catch (err) { console.error("Like failed", err); }
  };

  // 🚀 UPDATED: Admin-Aware Post Deletion
  const handleDelete = async (postId) => {
    const msg = isAdmin ? "🛡️ ADMIN ACTION: Delete this post permanently?" : "Delete this post?";
    if (!window.confirm(msg)) return;
    
    try {
      if (isAdmin) {
        // Use the Admin Controller path
        await api.delete(`/admin/posts/${postId}`);
      } else {
        // Use standard Post Controller path
        await api.delete(`/posts/${postId}`);
      }
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      alert("Delete failed. Check console for details.");
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentTexts[postId];
    if (!text || !text.trim()) return;
    try {
      await api.post(`/posts/${postId}/comments`, { text: text });
      const postsRes = await api.get('/posts?page=0&size=10'); 
      setPosts(postsRes.data.content || []);
      setCommentTexts(prev => ({ ...prev, [postId]: '' })); 
    } catch (err) { alert("Failed to add comment."); }
  };

  // 🚀 UPDATED: Admin-Aware Comment Deletion
  const handleDeleteComment = async (commentId) => {
    const msg = isAdmin ? "🛡️ ADMIN ACTION: Delete this comment?" : "Delete this comment?";
    if (!window.confirm(msg)) return;
    try {
      if (isAdmin) {
        await api.delete(`/admin/comments/${commentId}`);
      } else {
        await api.delete(`/posts/comments/${commentId}`);
      }
      // Refresh to update comments list
      const postsRes = await api.get('/posts?page=0&size=10'); 
      setPosts(postsRes.data.content || []);
    } catch (err) { alert("Failed to delete comment."); }
  };

  const handleFollowSuggested = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
      fetchFeedData();
    } catch (err) { alert("Failed to follow."); }
  };

  const isOwnerCheck = (itemUser) => {
    if (!currentUser || !itemUser) return false;
    return itemUser.id === currentUser.id || 
           itemUser.email?.toLowerCase() === currentUser.email?.toLowerCase();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-blue-600 tracking-tight hidden sm:block">SocialHub</h2>
            {isAdmin && (
              <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={12} /> God Mode
              </span>
            )}
          </div>
          
          <div className="flex-1 max-w-md relative" ref={searchDropdownRef}>
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search users or #hashtags..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-slate-100/80 border border-transparent focus:border-blue-300 focus:bg-white rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all"
              />
            </div>
            {isSearchFocused && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                {!searchQuery.trim() ? (
                  <div className="p-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 pt-2">Trending</p>
                    {trendingTags.map((tag, idx) => (
                      <div key={idx} onClick={() => setSearchQuery(tag)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-all">
                        <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center"><Hash size={16} /></div>
                        <p className="font-bold text-slate-800 text-sm">{tag}</p>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.startsWith('#') ? (
                  <div className="p-2 max-h-96 overflow-y-auto">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 pt-2">Posts</p>
                    {searchPosts.map(post => (
                      <div key={post.id} onClick={() => { setIsSearchFocused(false); navigate(`/profile/${post.user.username}`); }} className="px-4 py-3 hover:bg-slate-50 cursor-pointer rounded-xl border-b border-slate-50 last:border-0">
                        <p className="text-xs font-bold text-blue-600">@{post.user.username}</p>
                        <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 pt-2">People</p>
                    {searchResults.map(user => (
                      <div key={user.id} onClick={() => { setIsSearchFocused(false); setSearchQuery(''); navigate(`/profile/${user.username}`); }} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer rounded-xl transition-all">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                          {user.profileImageUrl ? <img src={`http://localhost:8080/uploads/${user.profileImageUrl}`} alt="Pic" className="w-full h-full object-cover" /> : user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{user.username}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* 🚀 CHAT BUTTON */}
            <button onClick={() => navigate('/chat')} className="p-2 text-slate-400 hover:text-blue-600 transition-all" title="Messages">
              <MessageCircle size={22} />
            </button>

            {currentUser && (
              <div onClick={() => navigate(`/profile/${currentUser.username}`)} className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg cursor-pointer hover:ring-4 ring-blue-100 transition-all shadow-sm overflow-hidden">
                {currentUser.profileImageUrl ? <img src={`http://localhost:8080/uploads/${currentUser.profileImageUrl}`} alt="Me" className="w-full h-full object-cover" /> : currentUser.username.charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={() => { logout(); navigate('/login'); }} className="p-2 text-slate-400 hover:text-red-600 transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-lg overflow-hidden">
                {currentUser?.profileImageUrl ? <img src={`http://localhost:8080/uploads/${currentUser.profileImageUrl}`} alt="Me" className="w-full h-full object-cover" /> : 'U'}
              </div>
              <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="What's happening?" className="w-full bg-transparent border-none outline-none text-lg resize-none py-2" rows="2" />
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <button onClick={() => fileInputRef.current.click()} className="text-slate-400 hover:text-blue-600 p-2 rounded-xl"><ImageIcon size={24} /></button>
              <button onClick={handlePostSubmit} disabled={isPosting || (!newPostContent.trim() && !selectedFile)} className="bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50">{isPosting ? '...' : 'Post'}</button>
            </div>
            {previewUrl && <div className="mt-4 relative"><img src={previewUrl} className="rounded-2xl w-full aspect-video object-cover" /><X onClick={() => { setSelectedFile(null); setPreviewUrl(''); }} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white cursor-pointer" /></div>}
          </div>

          {/* Feed List */}
          <div className="space-y-6">
            {posts.map((post) => {
              const isOwner = isOwnerCheck(post.user);
              const hasLiked = post.likes?.some(l => isOwnerCheck(l.user));

              return (
                <div key={post.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <div className="px-6 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-400 overflow-hidden cursor-pointer" onClick={() => navigate(`/profile/${post.user?.username}`)}>
                        {post.user?.profileImageUrl ? <img src={`http://localhost:8080/uploads/${post.user.profileImageUrl}`} alt="Pic" className="w-full h-full object-cover" /> : post.user?.username?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p onClick={() => navigate(`/profile/${post.user?.username}`)} className="font-bold text-slate-900 text-sm cursor-pointer hover:text-blue-600 underline-offset-2 hover:underline">{post.user?.username}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {/* 🚀 ADMIN POWER: Owner OR Admin can delete any post */}
                    {(isOwner || isAdmin) && (
                      <button onClick={() => handleDelete(post.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl" title={isAdmin && !isOwner ? "🛡️ Admin: Force Delete" : "Delete"}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="px-8 pb-4 text-slate-700 leading-relaxed">{post.content}</div>
                  {post.imageUrl && <div className="px-4 pb-4"><img src={`http://localhost:8080/uploads/${post.imageUrl}`} alt="Post" className="w-full aspect-video object-cover rounded-[1.5rem]" /></div>}

                  <div className="px-6 py-4 bg-slate-50/50 flex gap-6 border-t border-slate-100">
                    <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 font-bold p-2 rounded-lg ${hasLiked ? 'text-red-500 bg-red-50' : 'text-slate-500 hover:text-red-500'}`}>
                      <Heart size={20} fill={hasLiked ? "currentColor" : "none"} /> <span>{post.likes?.length || 0}</span>
                    </button>
                    <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold p-2 rounded-lg">
                      <MessageCircle size={20} /> <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>

                  {expandedComments[post.id] && (
                    <div className="px-6 pb-6 bg-slate-50/50 border-t border-slate-200/60">
                      <div className="space-y-3 pt-4">
                        {post.comments.map(comment => {
                          const isCommentOwner = isOwnerCheck(comment.user);
                          return (
                            <div key={comment.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                              <div>
                                <span className="font-bold text-slate-800 text-sm mr-2">{comment.user?.username}</span>
                                <span className="text-slate-600 text-sm">{comment.text}</span>
                              </div>
                              {/* 🚀 ADMIN POWER: Owner OR Admin can delete any comment */}
                              {(isCommentOwner || isAdmin) && (
                                <button onClick={() => handleDeleteComment(comment.id)} className="text-slate-300 hover:text-red-500" title={isAdmin && !isCommentOwner ? "🛡️ Admin: Remove" : "Delete"}>
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <input type="text" value={commentTexts[post.id] || ''} onChange={(e) => setCommentTexts({...commentTexts, [post.id]: e.target.value})} placeholder="Add a comment..." className="flex-1 bg-white border rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-400" />
                        <button onClick={() => handleCommentSubmit(post.id)} disabled={!commentTexts[post.id]?.trim()} className="bg-blue-600 text-white p-2 rounded-xl"><Send size={18} /></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block space-y-6 sticky top-24 h-fit">
          
          {/* 🚀 TRENDING TAGS WIDGET (POWERED BY REDIS) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <span>🔥</span> Trending Now
            </h3>
            {trendingTags.length === 0 ? (
              <p className="text-sm text-slate-500">No trending topics yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                    onClick={() => {
                      setSearchQuery(tag);
                      setIsSearchFocused(true);
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Discover Network */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 mb-6">Discover Network</h3>
            <div className="space-y-5">
              {suggestedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${user.username}`)}>
                    <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden border">
                      {user.profileImageUrl ? <img src={`http://localhost:8080/uploads/${user.profileImageUrl}`} className="w-full h-full object-cover" /> : user.username.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-all">{user.username}</p>
                  </div>
                  <button onClick={() => handleFollowSuggested(user.id)} className="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-4 py-1.5 rounded-full text-sm font-bold transition-all">Follow</button>
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