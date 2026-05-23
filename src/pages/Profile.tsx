import React from "react";
import { AppLayout } from "@/src/components/layout/AppLayout";
import { 
  User, 
  Github, 
  Linkedin,
  Mail,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";

export default function Profile() {
  const { profile, user } = useAuth();

  const userName = profile?.full_name || "New Builder";
  const userEmail = profile?.email || user?.email || "";
  const userGithub = profile?.github_url || "";
  const userLinkedin = profile?.linkedin_url || "";

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-20">
        
        {/* Profile Card Header */}
        <div className="glass-glow rounded-[3rem] border border-white/10 overflow-hidden bg-circuit relative">
          <div className="h-40 bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-8 flex items-end justify-end pb-6">
            {/* Read-only profile view; edits are made inside Settings */}
          </div>
          <div className="px-12 pb-10 -mt-16 flex flex-col sm:flex-row items-end gap-6 relative z-10">
            <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-purple-400 to-blue-600 border-4 border-[#03030b] flex items-center justify-center shadow-2xl relative overflow-hidden">
              <User size={48} className="text-white" />
            </div>
            <div className="flex-1 pb-2 text-center sm:text-left">
              <h1 className="text-3xl font-black tracking-tight">{userName}</h1>
              <p className="text-purple-400 font-bold text-xs uppercase tracking-[0.3em] mt-2">
                {profile?.role === "mentor" ? "Mentor" : "Learner"} • LEVEL 1
              </p>
            </div>
            <div className="flex gap-3 pb-2">
              {userGithub ? (
                <a 
                  href={userGithub.startsWith("http") ? userGithub : `https://${userGithub}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-purple-500/20 hover:text-purple-400 transition-all active:scale-95 shadow-lg"
                >
                  <Github size={18} />
                </a>
              ) : (
                <span className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 opacity-30 flex items-center justify-center cursor-not-allowed">
                  <Github size={18} />
                </span>
              )}
              {userLinkedin ? (
                <a 
                  href={userLinkedin.startsWith("http") ? userLinkedin : `https://${userLinkedin}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-purple-500/20 hover:text-purple-400 transition-all active:scale-95 shadow-lg"
                >
                  <Linkedin size={18} />
                </a>
              ) : (
                <span className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 opacity-30 flex items-center justify-center cursor-not-allowed">
                  <Linkedin size={18} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Simplified Account Details Grid */}
        <div className="glass rounded-[2rem] p-10 border border-white/5 space-y-8">
          <h2 className="text-lg font-bold border-b border-white/5 pb-4 uppercase tracking-[0.15em] text-gray-400 flex items-center gap-3">
            Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Full Name</span>
              <span className="text-sm font-semibold text-white block bg-white/5 border border-white/5 rounded-2xl px-5 py-4">{userName}</span>
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Email Address</span>
              <span className="text-sm font-semibold text-white block bg-white/5 border border-white/5 rounded-2xl px-5 py-4 flex items-center gap-3">
                <Mail size={16} className="text-gray-500" />
                {userEmail}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">GitHub URL</span>
              {userGithub ? (
                <a 
                  href={userGithub.startsWith("http") ? userGithub : `https://${userGithub}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm font-semibold text-purple-400 hover:text-purple-300 block bg-white/5 border border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    <Github size={16} />
                    {userGithub}
                  </span>
                  <ExternalLink size={14} />
                </a>
              ) : (
                <span className="text-sm font-medium text-gray-600 block bg-white/5 border border-white/5 rounded-2xl px-5 py-4 italic">Not Linked (Optional)</span>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">LinkedIn URL</span>
              {userLinkedin ? (
                <a 
                  href={userLinkedin.startsWith("http") ? userLinkedin : `https://${userLinkedin}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm font-semibold text-purple-400 hover:text-purple-300 block bg-white/5 border border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    <Linkedin size={16} />
                    {userLinkedin}
                  </span>
                  <ExternalLink size={14} />
                </a>
              ) : (
                <span className="text-sm font-medium text-gray-600 block bg-white/5 border border-white/5 rounded-2xl px-5 py-4 italic">Not Linked (Optional)</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
