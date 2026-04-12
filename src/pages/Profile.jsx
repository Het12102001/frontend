import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Heart, MessageCircle, Settings, Camera, 
  X, UserCheck, UserPlus, Grid, Users, Trash2, ShieldAlert 
} from 'lucide-react';

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

  // Tabs and Connection Lists
  const [activeTab, setActiveTab] = useState('posts'); 
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch Profile User Info
      const userRes = await api.get(`/users/username/${username}`);
      setProfileData(userRes.data);
      setEditBio(userRes.data.bio || ""); 
      setIsFollowing(userRes.data.isFollowing);

      // 2. Fetch User's Posts
      const postsRes = await api.get(`/posts/user/${username}?page=0&size=20`);
      setUserPosts(postsRes.data.content || []);

      // 3. Fetch Connection Lists
      const followersRes = await api.get(`/users/${username}/followers`);
      setFollowersList(followersRes.data || []);
      
      const followingRes = await api.get(`/users/${username}/following`);
      setFollowingList(followingRes.data || []);

      // 4. Check Roles and Identity of the LOGGED IN user
      const meRes = await api.get('/users/me/details');
      
      // Check if I am an admin
      if (meRes.data.role === 'ROLE_ADMIN') {
        setIsAdmin(true);
      }

      // Check if I am looking at my own profile
      if (userRes.data.email.toLowerCase() === meRes.data.email.toLowerCase()) {
        setIsMyProfile(true);
      } else {
        setIsMyProfile(false);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab('posts'); 
    fetchProfile();
  }, [username]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFile(file);
      setEditPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData();
    formData.append('bio', editBio);
    if (editFile) formData.append('file', editFile);

    try {
      await api.put('/users/profile/edit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsEditing(false);
      setEditFile(null);
      setEditPreviewUrl("");
      fetchProfile(); 
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      await api.post(`/users/${profileData.id}/follow`);
      setIsFollowing(!isFollowing);
      setProfileData(prev => ({
        ...prev,
        followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
      }));
      // Update followers list after toggle
      const followersRes = await api.get(`/users/${username}/followers`);
      setFollowersList(followersRes.data || []);
    } catch (err) {
      alert("Something went wrong. Try again.");
    }
  };

  // 🚀 LOGIC: User deletes their own account
  const handleDeleteMyAccount = async () => {
    const confirmed = window.confirm(
      "🚨 DANGER: This will permanently delete YOUR profile, posts, comments, and images. This cannot be undone. Proceed?"
    );

    if (confirmed) {
      try {
        await api.delete('/users/me'); 
        alert("Your account has been deleted.");
        logout(); 
        navigate('/login'); 
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  // 🚀 LOGIC: Admin wipes someone else
  const handleAdminDeleteUser = async () => {
    const confirmed = window.confirm(
      `🛡️ ADMIN ACTION: Permanently WIPE "${profileData.username}" and all their content?`
    );

    if (confirmed) {
      try {
        await api.delete(`/admin/users/${profileData.id}`); 
        alert(`User ${profileData.username} wiped successfully.`);
        navigate('/feed'); 
      } catch (err) {
        alert("Admin deletion failed. Check permissions.");
      }
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 italic">Synchronizing Profile...</div>;
  if (!profileData) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">User Not Found</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/feed')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-800">{profileData.username}</h2>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 relative">
        
        {/* --- EDIT MODAL --- */}
        {isEditing && (
           <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
             <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full p-1"><X size={20} /></button>
             <h2 className="text-2xl font-black text-slate-900 mb-6">Edit Profile</h2>
             
             <div className="flex flex-col items-center mb-6">
               <div className="w-24 h-24 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200 mb-4 relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                 {editPreviewUrl ? (
                   <img src={editPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                 ) : profileData.profileImageUrl ? (
                   <img src={`http://localhost:8080/uploads/${profileData.profileImageUrl}`} alt="Current" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center font-black text-3xl text-slate-400">{profileData.username.charAt(0).toUpperCase()}</div>
                 )}
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div>
               </div>
               <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Change Avatar</p>
             </div>

             <div className="mb-6">
               <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
               <textarea 
                 value={editBio} 
                 onChange={(e) => setEditBio(e.target.value)} 
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none" 
                 rows="3" 
                 placeholder="Tell the world about yourself..." 
               />
             </div>
             
             <button 
               onClick={handleEditSubmit} 
               disabled={isSaving} 
               className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
             >
               {isSaving ? "Saving..." : "Save Changes"}
             </button>
           </div>
         </div>
        )}

        {/* --- PROFILE HEADER --- */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-100 opacity-70"></div>
          
          <div className="relative pt-12 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="flex gap-6 items-end">
              <div className="w-32 h-32 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-5xl shadow-xl border-4 border-white overflow-hidden flex-shrink-0">
                {profileData.profileImageUrl ? (
                  <img src={`http://localhost:8080/uploads/${profileData.profileImageUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profileData.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="pb-2">
                <h1 className="text-3xl font-black text-slate-900">{profileData.username}</h1>
                <p className="text-slate-500 font-medium">{profileData.email}</p>
                {profileData.role === 'ROLE_ADMIN' && (
                  <span className="inline-flex items-center gap-1 mt-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-100">
                    <ShieldAlert size={10} /> Official Admin
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              {isMyProfile ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">
                    <Settings size={18} /> Edit Profile
                  </button>
                  <button onClick={handleDeleteMyAccount} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-lg shadow-red-100/30">
                    <Trash2 size={18} /> Delete Account
                  </button>
                </>
              ) : (
                <div className="flex gap-2 w-full md:w-auto">
                   {isAdmin && (
                    <button 
                      onClick={handleAdminDeleteUser} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
                    >
                      <Trash2 size={18} /> Admin Wipe
                    </button>
                   )}

                  <button 
                    onClick={handleFollowToggle}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                      isFollowing ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                    }`}
                  >
                    {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-slate-700 text-lg leading-relaxed max-w-2xl">
              {profileData.bio || "No bio written yet."}
            </p>
            
            <div className="flex gap-8 mt-6">
              <div className="flex gap-2 items-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setActiveTab('posts')}>
                <span className="font-black text-slate-900 text-lg">{userPosts.length}</span>
                <span className="text-slate-500 font-medium">Posts</span>
              </div>
              <div className="flex gap-2 items-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setActiveTab('followers')}>
                <span className="font-black text-slate-900 text-lg">{profileData.followersCount}</span>
                <span className="text-slate-500 font-medium">Followers</span>
              </div>
              <div className="flex gap-2 items-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setActiveTab('following')}>
                <span className="font-black text-slate-900 text-lg">{profileData.followingCount}</span>
                <span className="text-slate-500 font-medium">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex border-b border-slate-200 mb-8">
          <button onClick={() => setActiveTab('posts')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'posts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}><Grid size={20} /> Posts</button>
          <button onClick={() => setActiveTab('followers')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'followers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}><Users size={20} /> Followers</button>
          <button onClick={() => setActiveTab('following')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'following' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}><UserCheck size={20} /> Following</button>
        </div>

        {/* --- TAB CONTENT --- */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userPosts.length === 0 ? <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-300 text-slate-500">No posts shared yet.</div> : (
              userPosts.map(post => (
                <div key={post.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm flex flex-col transition-all hover:shadow-md cursor-pointer">
                  {post.imageUrl && <img src={`http://localhost:8080/uploads/${post.imageUrl}`} alt="Post" className="w-full h-48 object-cover border-b border-slate-50" />}
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-slate-700 line-clamp-3 mb-4 flex-1">{post.content}</p>
                    <div className="flex gap-4 pt-4 border-t border-slate-50 text-slate-400 font-bold text-sm">
                      <span className="flex items-center gap-1.5"><Heart size={16} /> {post.likes?.length || 0}</span>
                      <span className="flex items-center gap-1.5"><MessageCircle size={16} /> {post.comments?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'followers' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {followersList.length === 0 ? <div className="col-span-full text-center py-10 text-slate-400 italic">No followers yet.</div> : followersList.map(user => (
               <div key={user.id} onClick={() => navigate(`/profile/${user.username}`)} className="bg-white p-4 rounded-2xl border flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group">
                 <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-slate-400">
                   {user.profileImageUrl ? <img src={`http://localhost:8080/uploads/${user.profileImageUrl}`} className="w-full h-full object-cover" /> : user.username.charAt(0).toUpperCase()}
                 </div>
                 <h4 className="font-bold text-slate-800 group-hover:text-blue-600">{user.username}</h4>
               </div>
             ))}
           </div>
        )}

        {activeTab === 'following' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {followingList.length === 0 ? <div className="col-span-full text-center py-10 text-slate-400 italic">Not following anyone yet.</div> : followingList.map(user => (
               <div key={user.id} onClick={() => navigate(`/profile/${user.username}`)} className="bg-white p-4 rounded-2xl border flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group">
                 <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-slate-400">
                   {user.profileImageUrl ? <img src={`http://localhost:8080/uploads/${user.profileImageUrl}`} className="w-full h-full object-cover" /> : user.username.charAt(0).toUpperCase()}
                 </div>
                 <h4 className="font-bold text-slate-800 group-hover:text-blue-600">{user.username}</h4>
               </div>
             ))}
           </div>
        )}

      </main>
    </div>
  );
};

export default Profile;