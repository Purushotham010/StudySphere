import React, { useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="h-full w-full bg-black text-white flex items-center justify-center p-6 bg-circuit overflow-y-auto">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-glow rounded-3xl p-10 border border-white/10"
      >
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6 font-bold transition-transform hover:scale-110">
            <GraduationCap className="text-white w-9 h-9" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Login</h1>
          <p className="text-gray-400 text-sm">Enter your credentials to continue your learning journey</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="student@studysphere.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
              <Link to="/forgot" className="text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest">Forgot Password?</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-sm"
              />
            </div>
          </div>

          <button disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 group mt-4">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Login <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-500">
            <span className="bg-black px-3 tracking-[0.2em]">OR LOGIN WITH</span>
          </div>
        </div>

        <div className="w-full">
          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full glass flex items-center justify-center gap-3 py-3.5 rounded-xl hover:bg-white/10 transition-all text-sm font-semibold group shadow-lg"
          >
            <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15.02 1 12 1 7.24 1 3.23 3.73 1.25 7.7l3.96 3.07C6.18 7.39 8.84 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.48c-.29 1.48-1.14 2.73-2.42 3.57l3.77 2.92c2.2-2.03 3.46-5.01 3.46-8.65z" />
              <path fill="#FBBC05" d="M5.21 10.77c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27L1.25 3.16C.45 4.77 0 6.58 0 8.5s.45 3.73 1.25 5.34l3.96-3.07z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.77-2.92c-1.12.75-2.54 1.19-4.19 1.19-3.16 0-5.82-2.35-6.79-5.73l-3.96 3.07C3.23 20.27 7.24 23 12 23z" />
            </svg>
            Google
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          New to StudySphere?{" "}
          <Link to="/signup" className="text-purple-400 font-bold hover:text-purple-300">Join Now</Link>
        </p>
      </motion.div>
    </div>
  );
}
