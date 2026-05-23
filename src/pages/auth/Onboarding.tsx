import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";
import { motion } from "motion/react";
import { Sparkles, BookOpen, GraduationCap, ArrowRight, Loader2 } from "lucide-react";

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<"student" | "mentor">("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.onboarded) {
      navigate("/dashboard");
    }
  }, [profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Update only the role on onboarding
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: role,
        })
        .eq("id", user?.id);

      if (profileError) throw profileError;

      await refreshProfile();
      navigate("/settings");
    } catch (err: any) {
      setError(err.message || "An error occurred during onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-6 bg-circuit overflow-y-auto">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl glass-glow rounded-[3rem] p-10 sm:p-12 border border-white/10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6 font-bold">
            <Sparkles className="text-white w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Welcome to StudySphere</h1>
          <p className="text-gray-400 text-sm font-light">Select your primary role in the ecosystem to continue.</p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`p-6 rounded-[2rem] border transition-all text-left flex flex-col justify-between gap-6 active:scale-95 duration-200 ${
                  role === "student" 
                    ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <BookOpen size={24} className={role === "student" ? "text-purple-400" : "text-gray-500"} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">I'm a Learner</h3>
                  <p className="text-xs font-light text-gray-400 leading-relaxed">Exchange skills, join study teams, and find professional opportunities.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("mentor")}
                className={`p-6 rounded-[2rem] border transition-all text-left flex flex-col justify-between gap-6 active:scale-95 duration-200 ${
                  role === "mentor" 
                    ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <GraduationCap size={24} className={role === "mentor" ? "text-purple-400" : "text-gray-500"} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">I'm a Mentor</h3>
                  <p className="text-xs font-light text-gray-400 leading-relaxed">Guide ambitious peers, share industry insights, and build your mentorship streak.</p>
                </div>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 group mt-6"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
