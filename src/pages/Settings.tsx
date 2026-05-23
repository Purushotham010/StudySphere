import React, { useState, useEffect } from "react";
import { AppLayout } from "@/src/components/layout/AppLayout";
import { 
  User, 
  Lock, 
  Save, 
  Loader2, 
  CheckCircle2, 
  LogOut,
  Mail,
  Github,
  Linkedin,
  FileText
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

export default function Settings() {
  const { profile: dbProfile, user, refreshProfile } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [bio, setBio] = useState("");
  const [skillsOffered, setSkillsOffered] = useState("");
  const [skillsSeeking, setSkillsSeeking] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (dbProfile) {
      setName(dbProfile.full_name || "");
      setEmail(dbProfile.email || user?.email || "");
      setGithubUrl(dbProfile.github_url || "");
      setLinkedinUrl(dbProfile.linkedin_url || "");
      
      let displayBio = dbProfile.bio || "";
      let teaches = dbProfile.skills_offered || "";
      let wants = dbProfile.skills_seeking || "";

      if (dbProfile.bio && dbProfile.bio.startsWith("{")) {
        try {
          const parsed = JSON.parse(dbProfile.bio);
          teaches = parsed.skills_offered || teaches || "";
          wants = parsed.skills_seeking || wants || "";
          displayBio = parsed.text || "";
        } catch (e) {
          // not JSON
        }
      }

      setBio(displayBio);
      setSkillsOffered(teaches);
      setSkillsSeeking(wants);
    }
  }, [dbProfile, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Name is required!");
      return;
    }
    if (password && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      if (user) {
        // Build database update payload dynamically
        const updatePayload: any = {
          full_name: name.trim(),
          github_url: githubUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          bio: bio.trim() || null,
          skills_offered: skillsOffered.trim() || null,
          skills_seeking: skillsSeeking.trim() || null,
          onboarded: true
        };

        // Self-heal role if missing (defaults to 'student')
        if (!dbProfile?.role) {
          updatePayload.role = 'student';
        }

        // 1. Try updating live profile details including native skills columns
        let profileError;
        try {
          const { error } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("id", user.id);
          profileError = error;
        } catch (err) {
          profileError = err;
        }

        // 2. If native columns are missing or error occurs, fall back to self-healing bio JSON structure
        if (profileError) {
          const bioData = JSON.stringify({
            skills_offered: skillsOffered.trim(),
            skills_seeking: skillsSeeking.trim(),
            text: bio.trim()
          });

          const fallbackPayload: any = {
            full_name: name.trim(),
            github_url: githubUrl.trim() || null,
            linkedin_url: linkedinUrl.trim() || null,
            bio: bioData,
            onboarded: true
          };

          if (!dbProfile?.role) {
            fallbackPayload.role = 'student';
          }

          const { error: fbError } = await supabase
            .from("profiles")
            .update(fallbackPayload)
            .eq("id", user.id);

          if (fbError) throw fbError;
        }

        // 3. Update Password if specified
        if (password.trim()) {
          const { error: passwordError } = await supabase.auth.updateUser({
            password: password.trim()
          });
          if (passwordError) throw passwordError;
          setPassword("");
          setConfirmPassword("");
        }

        await refreshProfile();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      alert(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveListing = async () => {
    const confirm = window.confirm(
      "Are you sure you want to take down your profile card from the Skill Exchange directory? Other students won't be able to find you or request sessions."
    );
    if (!confirm) return;

    setSaving(true);
    try {
      if (user) {
        // 1. Try clearing skills offered and seeking native columns
        let profileError;
        try {
          const { error } = await supabase
            .from("profiles")
            .update({
              skills_offered: null,
              skills_seeking: null
            })
            .eq("id", user.id);
          profileError = error;
        } catch (err) {
          profileError = err;
        }

        // 2. If native columns are missing or error occurs, fall back to clearing bio JSON
        if (profileError || !dbProfile?.hasOwnProperty('skills_offered')) {
          let originalText = bio;
          if (dbProfile?.bio && dbProfile.bio.startsWith("{")) {
            try {
              const parsed = JSON.parse(dbProfile.bio);
              originalText = parsed.text || "";
            } catch (e) {}
          }

          const { error: fbError } = await supabase
            .from("profiles")
            .update({
              bio: originalText.trim() || null
            })
            .eq("id", user.id);

          if (fbError) throw fbError;
        }

        setSkillsOffered("");
        setSkillsSeeking("");
        await refreshProfile();
        alert("Your Skill Exchange listing has been successfully removed!");
      }
    } catch (err: any) {
      console.error("Error removing listing:", err);
      alert(err.message || "Failed to remove listing.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      supabase.auth.signOut().catch(err => console.error("Server signout error:", err));
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-20">
        {/* Header */}
        <header className="mb-10 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-gray-400 font-light text-sm">Manage your profile, socials, and account credentials.</p>
        </header>

        {/* Onboarding Prompt */}
        {dbProfile && !dbProfile.onboarded && (
          <div className="glass bg-purple-500/10 border border-purple-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-[0_0_30px_rgba(139,92,246,0.15)] mb-8 animate-pulse">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 shrink-0">
              <User size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Set Up Your Profile Details</h4>
              <p className="text-xs text-gray-400 font-light">To unlock full access to StudySphere (Dashboard, Mentors, Skill Exchange, and AI Chat), please enter your Full Name and save your details below!</p>
            </div>
          </div>
        )}

        {/* Settings Card */}
        <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-white/5 bg-[#03030b]/20 backdrop-blur-3xl">
          <form onSubmit={handleSave} className="space-y-10">
            
            {/* Section 1: Profile Info */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 border-b border-white/5 pb-3">
                <User size={20} className="text-purple-400" /> Personal Profile
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input 
                      type="email" 
                      disabled
                      value={email}
                      className="w-full bg-white/2 border border-white/5 rounded-xl py-3 pl-12 pr-4 outline-none text-sm text-gray-500 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">GitHub URL (Optional)</label>
                  <div className="relative group">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                    <input 
                      type="url" 
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">LinkedIn URL (Optional)</label>
                  <div className="relative group">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                    <input 
                      type="url" 
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Short Bio</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                  <textarea 
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about your academic interests, skills, or career goals..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section: Skill Exchange Details (Learner/Student specific) */}
            {dbProfile?.role === 'student' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 border-b border-white/5 pb-3">
                  <FileText size={20} className="text-purple-400" /> Skill Exchange Settings
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Skills You Offer</label>
                    <input 
                      type="text" 
                      value={skillsOffered}
                      onChange={(e) => setSkillsOffered(e.target.value)}
                      placeholder="e.g. React, TailwindCSS, Frontend Architecture"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all font-semibold placeholder:text-gray-700"
                    />
                    <p className="text-[10px] text-gray-500 font-light px-1">Comma-separated list of skills you can teach or help other peers with.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Skills You Seek</label>
                    <input 
                      type="text" 
                      value={skillsSeeking}
                      onChange={(e) => setSkillsSeeking(e.target.value)}
                      placeholder="e.g. Rust, Backend Systems, Database Normalization"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all font-semibold placeholder:text-gray-700"
                    />
                    <p className="text-[10px] text-gray-500 font-light px-1">Comma-separated list of skills you want to learn from other peers.</p>
                  </div>
                </div>

                {(skillsOffered || skillsSeeking) && (
                  <div className="flex justify-end pt-2">
                    <button 
                      type="button"
                      onClick={handleRemoveListing}
                      className="px-5 py-2.5 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] duration-200"
                    >
                      Remove Skill Exchange Card
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Section 2: Security & Password */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 border-b border-white/5 pb-3">
                <Lock size={20} className="text-purple-400" /> Security & Credentials
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Row */}
            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button 
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
              >
                <LogOut size={14} /> Log out Session
              </button>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                {saved && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 size={14} /> Settings Saved!
                  </span>
                )}
                
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <><Save size={14} /> Save Changes</>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </AppLayout>
  );
}
