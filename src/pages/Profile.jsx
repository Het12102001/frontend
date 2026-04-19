import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_BASE } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Heart, MessageCircle, Settings, Camera,
  X, UserCheck, UserPlus, Grid, Users, Trash2, ShieldAlert, ShieldCheck
} from 'lucide-react';

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' };
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', transition: 'all var(--transition)', padding: '8px', color: 'var(--text-3)' };

const Avatar = ({ user, size = 40 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: size * 0.35 }}>
    {user?.profileImageUrl
      ? <img src={user.profileImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : (user?.username?.[0] || '?').toUpperCase()}
  </div>
);

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const userRes = await api.get(`/users/username/${username}`);
      setProfileData(userRes.data);
      setEditBio(userRes.data.bio || '');
      setIsFollowing(userRes.data.isFollowing);
      const postsRes = await api.get(`/posts/user/${username}?page=0&size=20`);
      setUserPosts(postsRes.data.content || []);
      const followersRes = await api.get(`/users/${username}/followers`);
      setFollowersList(followersRes.data || []);
      const followingRes = await api.get(`/users/${username}/following`);
      setFollowingList(followingRes.data || []);
      const meRes = await api.get('/users/me/details');
      setIsAdmin(meRes.data.role === 'ROLE_ADMIN');
      setIsMyProfile(userRes.data.email.toLowerCase() === meRes.data.email.toLowerCase());
    } catch (err) {
      console.error(err);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { setActiveTab('posts'); fetchProfile(); }, [username]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setEditFile(file); setEditPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleEditSubmit = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append('bio', editBio);
    if (editFile) formData.append('file', editFile);
    try {
      await api.put('/users/profile/edit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setIsEditing(false); setEditFile(null); setEditPreviewUrl('');
      fetchProfile();
    } catch { alert('Update failed.'); }
    finally { setIsSaving(false); }
  };

  const handleFollowToggle = async () => {
    try {
      await api.post(`/users/${profileData.id}/follow`);
      setIsFollowing(!isFollowing);
      setProfileData(prev => ({ ...prev, followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1 }));
      const r = await api.get(`/users/${username}/followers`);
      setFollowersList(r.data || []);
    } catch { alert('Action failed.'); }
  };

  const handleDeleteMyAccount = async () => {
    if (!window.confirm('🚨 This will permanently delete your account. This cannot be undone.')) return;
    try {
      await api.delete('/users/me');
      logout(); navigate('/login');
    } catch { alert('Delete failed.'); }
  };

  const handleAdminDeleteUser = async () => {
    if (!window.confirm(`🛡️ Admin: Permanently wipe "${profileData.username}" and all their content?`)) return;
    try {
      await api.delete(`/admin/users/${profileData.id}`);
      navigate('/feed');
    } catch { alert('Admin delete failed.'); }
  };

  const TabBtn = ({ id, icon, label }) => (
    <button onClick={() => setActiveTab(id)} style={{ flex: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', fontSize: '13px', fontFamily: 'var(--font)', border: 'none', background: 'none', cursor: 'pointer', color: activeTab === id ? 'var(--accent)' : 'var(--text-3)', borderBottom: `2px solid ${activeTab === id ? 'var(--accent)' : 'transparent'}`, transition: 'all var(--transition)' }}>
      {icon}{label}
    </button>
  );

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-3)', fontWeight: '500' }}>
      <span className="spinner" /> Loading profile...
    </div>
  );

  if (!profileData) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', fontWeight: '700' }}>
      User Not Found
    </div>
  );

  const avatarSrc = editPreviewUrl || (profileData.profileImageUrl ? profileData.profileImageUrl : null);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/feed')} style={{ ...iconBtn, borderRadius: '50%', width: '36px', height: '36px' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontWeight: '800', fontSize: '17px', color: 'var(--text)' }}>{profileData.username}</span>
        </div>
      </nav>

      {/* Edit Modal */}
      {isEditing && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="animate-scale-in glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '36px', width: '100%', maxWidth: '440px', position: 'relative' }}>
            <button onClick={() => setIsEditing(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--surface-2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)', transition: 'all var(--transition)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-3)'; }}>
              <X size={16} />
            </button>
            <h2 style={{ fontWeight: '800', fontSize: '20px', marginBottom: '28px', color: 'var(--text)' }}>Edit Profile</h2>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
              <div onClick={() => fileInputRef.current.click()} style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-strong)', cursor: 'pointer', position: 'relative', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '28px', color: 'var(--text-2)', marginBottom: '10px' }}>
                {avatarSrc ? <img src={avatarSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profileData.username?.[0]?.toUpperCase()}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <Camera size={22} color="white" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
              <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '500' }}>Click to change photo</span>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Bio</label>
              <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} placeholder="Tell the world about yourself..."
                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: '14px', fontFamily: 'var(--font)', color: 'var(--text)', outline: 'none', resize: 'none', transition: 'all var(--transition)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <button onClick={handleEditSubmit} disabled={isSaving} style={{ width: '100%', background: 'var(--accent-gradient)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '14px', fontWeight: '700', fontSize: '14px', fontFamily: 'var(--font)', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {isSaving ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 24px' }} className="animate-fade-up">
        {/* Profile Header Card */}
        <div style={{ ...card, marginBottom: '20px', position: 'relative' }}>
          {/* Banner */}
          <div style={{ height: '120px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.2) 100%)', borderBottom: '1px solid var(--border)' }} />

          <div style={{ padding: '0 28px 28px' }}>
            {/* Avatar + actions row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--bg)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '32px', color: 'white', marginTop: '-48px', flexShrink: 0, boxShadow: 'var(--shadow)' }}>
                {profileData.profileImageUrl
                  ? <img src={profileData.profileImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : profileData.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {isMyProfile ? (
                  <>
                    <button onClick={() => setIsEditing(true)} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: '9px 16px', fontWeight: '600', fontSize: '13px', fontFamily: 'var(--font)', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all var(--transition)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
                      <Settings size={15} /> Edit Profile
                    </button>
                    <button onClick={handleDeleteMyAccount} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', padding: '9px 16px', fontWeight: '600', fontSize: '13px', fontFamily: 'var(--font)', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all var(--transition)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}>
                      <Trash2 size={15} /> Delete
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isAdmin && (
                      <button onClick={handleAdminDeleteUser} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', padding: '9px 16px', fontWeight: '600', fontSize: '13px', fontFamily: 'var(--font)', cursor: 'pointer', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}>
                        <Trash2 size={15} /> Wipe User
                      </button>
                    )}
                    <button onClick={handleFollowToggle} style={{ background: isFollowing ? 'var(--surface-2)' : 'var(--accent-gradient)', border: isFollowing ? '1px solid var(--border-strong)' : 'none', borderRadius: 'var(--radius)', padding: '9px 20px', fontWeight: '700', fontSize: '13px', fontFamily: 'var(--font)', cursor: 'pointer', color: isFollowing ? 'var(--text)' : 'white', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all var(--transition)', boxShadow: isFollowing ? 'none' : 'var(--shadow-accent)' }}>
                      {isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ fontWeight: '800', fontSize: '22px', color: 'var(--text)', letterSpacing: '-0.01em' }}>{profileData.username}</h1>
                {profileData.role === 'ROLE_ADMIN' && (
                  <span style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={10} /> Admin
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-3)', fontSize: '13px', marginBottom: '12px', fontFamily: 'var(--mono)' }}>{profileData.email}</p>
              {profileData.bio && <p style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: '1.7', maxWidth: '520px' }}>{profileData.bio}</p>}

              {/* Stats */}
              <div style={{ display: 'flex', gap: '28px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                {[
                  { label: 'Posts', value: userPosts.length, tab: 'posts' },
                  { label: 'Followers', value: profileData.followersCount, tab: 'followers' },
                  { label: 'Following', value: profileData.followingCount, tab: 'following' },
                ].map(stat => (
                  <div key={stat.tab} onClick={() => setActiveTab(stat.tab)} style={{ cursor: 'pointer', transition: 'opacity var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text)', display: 'block', letterSpacing: '-0.02em' }}>{stat.value}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ ...card, marginBottom: '20px', display: 'flex', overflow: 'hidden' }}>
          <TabBtn id="posts" icon={<Grid size={16} />} label="Posts" />
          <TabBtn id="followers" icon={<Users size={16} />} label="Followers" />
          <TabBtn id="following" icon={<UserCheck size={16} />} label="Following" />
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }} className="stagger">
            {userPosts.length === 0
              ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', ...card, color: 'var(--text-3)', fontSize: '14px' }}>No posts yet.</div>
              : userPosts.map(post => (
                <div key={post.id} style={{ ...card, cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'border-color var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  {post.imageUrl && <img src={post.imageUrl} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block', borderBottom: '1px solid var(--border)' }} />}
                  <div style={{ padding: '16px', flex: 1 }}>
                    <p style={{ color: 'var(--text-2)', fontSize: '13px', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '12px' }}>{post.content}</p>
                    <div style={{ display: 'flex', gap: '14px', color: 'var(--text-3)', fontSize: '12px', fontWeight: '600', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={13} /> {post.likes?.length || 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={13} /> {post.comments?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {(activeTab === 'followers' || activeTab === 'following') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }} className="stagger">
            {(activeTab === 'followers' ? followersList : followingList).length === 0
              ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-3)', fontSize: '14px' }}>None yet.</div>
              : (activeTab === 'followers' ? followersList : followingList).map(user => (
                <div key={user.id} onClick={() => navigate(`/profile/${user.username}`)} style={{ ...card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'border-color var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <Avatar user={user} size={42} />
                  <div>
                    <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>{user.username}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
