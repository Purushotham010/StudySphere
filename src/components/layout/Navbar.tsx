import { 
  Search, 
  Bell, 
  User, 
  ChevronDown, 
  Command, 
  Check, 
  Clock,
  Edit3,
  Github,
  Linkedin,
  Lock,
  Mail,
  Save,
  Loader2,
  LogOut,
  X,
  Globe,
  Menu
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [editName, setEditName] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"student" | "mentor" | "pending">("pending");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      title: "New Session Request",
      desc: "Justin Case wants to study 'Rust Fundamentals' with you.",
      time: "2m ago",
      unread: true,
    },
    {
      id: 2,
      title: "Mentor Update",
      desc: "David Chen approved your session for tomorrow.",
      time: "1h ago",
      unread: true,
    },
    {
      id: 3,
      title: "AI Analysis Ready",
      desc: "Your resume score has been updated. Check the builder.",
      time: "3h ago",
      unread: false,
    }
  ];

  const { profile, user, refreshProfile } = useAuth();

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || "");
      setEditGithub(profile.github_url || "");
      setEditLinkedin(profile.linkedin_url || "");
      setEditRole(profile.role || "pending");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Name is mandatory!");
      return;
    }
    
    console.log("handleSaveProfile initiated.", {
      name: editName.trim(),
      github: editGithub.trim(),
      linkedin: editLinkedin.trim(),
      role: editRole,
      userId: user?.id
    });

    setSaving(true);
    setSavedSuccess(false);

    // Timeout failsafe helper
    const timeout = (ms: number, msg: string) => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout: ${msg}`)), ms)
      );

    try {
      console.log("Step 1: Attempting to update 'profiles' table in database...");
      
      const updatePayload: any = {
        full_name: editName.trim(),
        github_url: editGithub.trim() || null,
        linkedin_url: editLinkedin.trim() || null,
      };

      if (editRole !== "pending" && editRole !== profile?.role) {
        updatePayload.role = editRole;
      }

      console.log("Database update payload:", updatePayload);

      const updatePromise = supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user?.id);

      const updateResult: any = await Promise.race([
        updatePromise,
        timeout(6000, "Database update took too long. Check your internet connection or table permissions.")
      ]);

      console.log("Database update promise returned. Result:", updateResult);
      if (updateResult?.error) {
        throw updateResult.error;
      }

      // 2. Update Password if provided
      if (editPassword.trim()) {
        console.log("Step 2: Attempting to update password in auth system...");
        const passwordPromise = supabase.auth.updateUser({
          password: editPassword.trim()
        });

        const passwordResult: any = await Promise.race([
          passwordPromise,
          timeout(6000, "Auth password update took too long.")
        ]);

        console.log("Auth password update returned. Result:", passwordResult);
        if (passwordResult?.error) {
          throw passwordResult.error;
        }
        setEditPassword(""); // Reset password field
      }

      console.log("Step 3: Refreshing local profile from database...");
      await Promise.race([
        refreshProfile(),
        timeout(6000, "Refreshing local profile timed out.")
      ]);
      console.log("Profile refresh finished successfully!");

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setIsEditModalOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error("CRITICAL ERROR inside handleSaveProfile:", err);
      alert(err.message || "An error occurred while updating your profile. Check the browser developer console for technical logs.");
    } finally {
      console.log("handleSaveProfile finally block: resetting saving state.");
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      supabase.auth.signOut().catch(err => console.error("Signout error:", err));
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  const userName = profile?.full_name || "New Builder";
  const userRole = profile?.role === "mentor" ? "Mentor" : profile?.role === "student" ? "Learner" : "Pending";

  return (
    <nav className="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#03030b]/20 backdrop-blur-3xl sticky top-0 z-[100] gap-4">
      <div className="flex items-center flex-1 max-w-xl gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="relative group flex-1 hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search StudySphere... (CMD+K)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/30 focus:bg-white/10 transition-all text-sm font-medium placeholder:text-gray-600"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-30 group-focus-within:opacity-80 transition-opacity">
             <Command size={12} /> <span className="text-xs font-bold">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8 shrink-0">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5 hover:border-white/10 active:scale-95 duration-200"
          >
             <Bell size={20} />
             <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-[#03030b]" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute right-0 mt-4 w-96 bg-[#07070c]/98 backdrop-blur-3xl rounded-[2rem] border border-white/10 overflow-hidden z-50 shadow-2xl"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Notifications</h3>
                  <button className="text-[10px] text-purple-400 font-bold uppercase tracking-widest hover:text-white transition-colors">Mark all read</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-6 hover:bg-white/5 transition-colors border-b border-white/5 group cursor-pointer">
                      <div className="flex justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{n.title}</h4>
                          {n.unread && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />}
                        </div>
                        <span className="text-[10px] text-gray-600 flex items-center gap-1">
                          <Clock size={10} /> {n.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-light">{n.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-white/5 border-t border-white/5 flex justify-center">
                  <button className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hover:text-purple-400 transition-colors">View All Activity</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={profileMenuRef}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-4 pl-4 md:pl-8 border-l border-white/10 cursor-pointer group select-none"
          >
             <div className="text-right hidden sm:block">
                <div className="text-sm font-bold tracking-tight text-white group-hover:text-purple-400 transition-colors">{userName}</div>
                <div className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">{userRole}</div>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-500 border border-white/10 relative overflow-hidden">
                <User className="text-white" size={24} />
             </div>
             <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
          </div>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute right-0 mt-4 w-[calc(100vw-32px)] sm:w-96 max-w-sm bg-[#07070c]/98 backdrop-blur-3xl rounded-[2rem] border border-white/10 overflow-hidden z-50 shadow-2xl p-6"
              >
                {/* VIEW STATE - ALWAYS SHORT AND CLEAN */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center border border-white/10 shadow-lg shadow-purple-500/10">
                      <User className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{userName}</h3>
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">{userRole}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-gray-400 bg-white/2 p-3.5 rounded-xl border border-white/5">
                      <Mail size={16} className="text-gray-500" />
                      <span className="font-mono text-gray-300 truncate">{profile?.email || user?.email || "No email registered"}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 bg-white/2 p-3.5 rounded-xl border border-white/5">
                      <Github size={16} className="text-gray-500" />
                      {profile?.github_url ? (
                        <a 
                          href={profile.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-purple-400 hover:text-purple-300 underline font-light truncate"
                        >
                          {profile.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
                        </a>
                      ) : (
                        <span className="text-gray-600 font-light italic">GitHub Optional</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 bg-white/2 p-3.5 rounded-xl border border-white/5">
                      <Linkedin size={16} className="text-gray-500" />
                      {profile?.linkedin_url ? (
                        <a 
                          href={profile.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-purple-400 hover:text-purple-300 underline font-light truncate"
                        >
                          {profile.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}
                        </a>
                      ) : (
                        <span className="text-gray-600 font-light italic">LinkedIn Optional</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false);
                        setIsEditModalOpen(true);
                      }}
                      className="py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Edit3 size={14} /> Edit Profile
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
                    >
                      <LogOut size={14} /> Log Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* GORGEOUS CENTERED POPUP WINDOW MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center bg-[#03030b]/80 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg glass-glow rounded-[2.5rem] border border-white/10 p-8 md:p-10 relative space-y-6 shadow-2xl overflow-hidden bg-[#03030b]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Edit3 size={20} className="text-purple-400" /> Edit Profile Details
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="text-gray-400 hover:text-white p-1.5 hover:bg-white/5 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Full Legal Name *</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                      <input 
                        type="text" 
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all text-gray-200 font-light"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Primary Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setEditRole("student")}
                        className={`py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                          editRole === "student"
                            ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                            : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-400"
                        }`}
                      >
                        Learner (Student)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditRole("mentor")}
                        className={`py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                          editRole === "mentor"
                            ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                            : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-400"
                        }`}
                      >
                        Mentor
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Registered Email</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                      <input 
                        type="text" 
                        disabled
                        value={profile?.email || user?.email || ""}
                        className="w-full bg-white/2 border border-white/5 rounded-xl py-3 pl-12 pr-4 outline-none text-sm font-mono text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">New Password (Optional)</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                      <input 
                        type="password" 
                        placeholder="Leave blank to keep current"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all text-gray-200 font-light"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">GitHub URL (Optional)</label>
                    <div className="relative group">
                      <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                      <input 
                        type="url" 
                        placeholder="https://github.com/username"
                        value={editGithub}
                        onChange={(e) => setEditGithub(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all text-gray-200 font-light"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">LinkedIn URL (Optional)</label>
                    <div className="relative group">
                      <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                      <input 
                        type="url" 
                        placeholder="https://linkedin.com/in/username"
                        value={editLinkedin}
                        onChange={(e) => setEditLinkedin(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all text-gray-200 font-light"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      if (profile) {
                        setEditName(profile.full_name || "");
                        setEditGithub(profile.github_url || "");
                        setEditLinkedin(profile.linkedin_url || "");
                        setEditRole(profile.role || "pending");
                      }
                      setEditPassword("");
                    }}
                    className="py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white text-center active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all text-xs font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : savedSuccess ? (
                      <Check size={14} className="text-emerald-300 animate-pulse" />
                    ) : (
                      <><Save size={14} /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
