import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Users, BarChart, Zap, ArrowRight, Brain, Code, Rocket, Sparkles, Command, Menu, X } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(() => {
    return localStorage.getItem("hide_mobile_warning") !== "true";
  });

  const handleDismissWarning = () => {
    setShowMobileWarning(false);
    localStorage.setItem("hide_mobile_warning", "true");
  };

  return (
    <div className="h-full w-full bg-[#03030b] text-white selection:bg-purple-500/30 selection:text-purple-200 font-sans relative overflow-x-hidden overflow-y-auto scroll-smooth">
      {/* Immersive Background Layers */}
      <div className="absolute top-0 inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-purple-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[140px] animate-pulse delay-1000" />
        <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[120px] opacity-50" />
      </div>

      {/* Hero Background Image Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 h-screen pointer-events-none"
        style={{
          backgroundImage: `url('/studysphere.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          mixBlendMode: 'plus-lighter',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}
      />

      {/* Dark Overlay for better text readability */}
      <div className="absolute top-0 left-0 right-0 h-screen bg-gradient-to-b from-[#03030b]/60 via-transparent to-transparent pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-circuit opacity-[0.03] pointer-events-none scale-150" />

      {/* Aurora Effect */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 w-full z-50 glass border-b border-white/5 px-6 md:px-12 py-5 flex items-center justify-between backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-xl blur-sm opacity-50 transition-opacity" />
            <div className="relative bg-[#03030b] w-full h-full rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/studysphere-logo.png" alt="StudySphere Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight">StudySphere</span>
        </div>

        <div className="hidden lg:flex items-center gap-10 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors relative group">
            Ecosystem
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-purple-500 transition-all group-hover:w-full" />
          </a>
          <Link to="/mentors" className="hover:text-white transition-colors relative group">
            Mentors
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-purple-500 transition-all group-hover:w-full" />
          </Link>
          <Link to="/community" className="hover:text-white transition-colors relative group">
            Community
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-purple-500 transition-all group-hover:w-full" />
          </Link>

        </div>

        <div className="flex items-center gap-6">
          {isLoading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : user ? (
            <Link to="/dashboard" className="btn-primary group border-none flex items-center gap-2">
              Go to Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block">Login</Link>
              <Link to="/signup" className="btn-primary group border-none hidden sm:flex">
                Join the Community
              </Link>
            </>
          )}
          <button 
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-[#03030b]/98 backdrop-blur-3xl lg:hidden flex flex-col p-6"
          >
            <div className="flex justify-end mb-8">
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-6 text-xl font-medium">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-purple-400 transition-colors">Ecosystem</a>
              <Link to="/mentors" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-purple-400 transition-colors">Mentors</Link>
              <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-purple-400 transition-colors">Community</Link>

              {!user && (
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="mt-4 text-center btn-primary w-full py-4 rounded-xl">
                  Join the Community
                </Link>
              )}
              {!user && (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center text-gray-400 hover:text-white py-4">
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-40 px-6 relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto text-center relative">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-purple-300 text-[10px] font-bold tracking-[0.2em] mb-8 uppercase backdrop-blur-md"
            >
              <Sparkles size={14} className="text-purple-400" /> AI & Peer-to-Peer Learning
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
              className="text-5xl sm:text-7xl md:text-9xl font-bold leading-[1.1] md:leading-[0.9] mb-6 md:mb-8 tracking-tighter"
            >
              Learn <span className="text-gray-500/50 italic">Together.</span><br />
              <span className="glow-text">Build Together.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8, ease: "easeOut" }}
              className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed font-light"
            >
              StudySphere is a collaborative student ecosystem built for growth.
              Accelerate your path through peer sessions, industry mentors, and project groups.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              {isLoading ? (
                <span className="text-gray-500 font-medium">Checking session...</span>
              ) : user ? (
                <Link to="/dashboard" className="btn-primary text-lg px-10 py-4 flex items-center gap-3">
                  Go to Dashboard <ArrowRight size={20} />
                </Link>
              ) : (
                <Link to="/signup" className="btn-primary text-lg px-10 py-4 flex items-center gap-3">
                  Get Started <ArrowRight size={20} />
                </Link>
              )}
              <a href="#features" className="glass px-10 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition-all border border-white/5 inline-flex justify-center items-center">
                Learn More
              </a>
            </motion.div>
          </div>

          {/* Immersive Visual Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
            className="mt-20 md:mt-32 relative group max-w-5xl mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-[3rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-1000" />
            <div className="relative glass-glow rounded-[2.5rem] overflow-hidden aspect-auto sm:aspect-[16/8] border border-white/10 bg-[#03030b]/40 backdrop-blur-3xl shadow-2xl pb-12 sm:pb-0">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
              <div className="absolute inset-0 bg-circuit opacity-5 pointer-events-none" />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
              </div>

              <div className="p-8 md:p-12 h-full flex flex-col lg:flex-row items-center justify-between gap-12 relative z-20">
                <div className="hidden lg:flex flex-col gap-10 text-left max-w-xs">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 p-[1px]">
                      <div className="w-full h-full rounded-2xl bg-[#03030b] flex items-center justify-center">
                        <Users size={20} className="text-purple-400" />
                      </div>
                    </div>
                    <h4 className="text-xl font-bold tracking-tight">Collaborative Learning</h4>
                    <p className="text-sm text-gray-500 leading-relaxed font-light">
                      Instantly match with global peers to swap skills. Teach what you excel in, learn what you seek, and build projects together.
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-12">
                  <div className="relative flex items-center justify-center">
                    {/* Central Logic Simulation */}
                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                      <div className="absolute inset-2 border border-blue-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                      <Brain size={80} className="text-purple-400 drop-shadow-[0_0_20px_rgba(167,139,250,0.5)] animate-bounce" />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-8 md:gap-12">
                    <HeroMetric value="84%" label="Match Accuracy" />
                    <HeroMetric value="1.2k" label="Active Peers" />
                    <HeroMetric value="24/7" label="AI Co-Pilots" />
                  </div>
                </div>

                <div className="hidden lg:flex flex-col gap-10 text-right max-w-xs">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 p-[1px] ml-auto">
                      <div className="w-full h-full rounded-2xl bg-[#03030b] flex items-center justify-center">
                        <Rocket size={20} className="text-blue-400" />
                      </div>
                    </div>
                    <h4 className="text-xl font-bold tracking-tight">1-on-1 Mentorship</h4>
                    <p className="text-sm text-gray-500 leading-relaxed font-light">
                      Stop struggling alone. Book live video sessions with experienced alumni and senior mentors to get personalized project feedback, career guidance, and technical support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Value Proposition */}
        <section id="features" className="py-24 md:py-40 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="space-y-6 md:space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                More than a platform.<br />
                <span className="text-gray-500">A collective evolution.</span>
              </h2>
              <p className="text-gray-400 leading-relaxed lg:text-lg">
                Traditional learning is static. StudySphere is dynamic. By blending AI-driven roadmaps with human-led mentorship, we create a high-affinity growth loop that traditional education can't match.
              </p>
              <div className="space-y-6">
                <CheckItem text="Peer-to-peer mentorship" />
                <CheckItem text="Personalized learning maps" />
                <CheckItem text="Industry expert guidance" />
                <CheckItem text="Project-based communities" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-4 mt-0 sm:mt-12">
                <FeatureCardSmall icon={<Zap />} title="Real-time Support" />
                <FeatureCardSmall icon={<Users />} title="Global Connections" />
              </div>
              <div className="space-y-4">
                <FeatureCardSmall icon={<Brain />} title="Skill Roadmaps" />
                <FeatureCardSmall icon={<Rocket />} title="Project Groups" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Refinement */}
      <footer className="border-t border-white/5 py-24 px-6 relative z-10 glass backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          <div className="md:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <img src="/studysphere-logo.png" alt="StudySphere Logo" className="w-6 h-6 object-contain" />
              <span className="text-xl font-bold tracking-tight">StudySphere</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Empowering students through collaboration, mentorship, and peer-to-peer learning communities.
            </p>
          </div>
          <div className="md:col-span-3 space-y-6">
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-gray-400">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link to="/dashboard" className="hover:text-purple-400 transition-colors">Dashboard</Link></li>
              <li><Link to="/mentors" className="hover:text-purple-400 transition-colors">Find Mentors</Link></li>
              <li><Link to="/skills" className="hover:text-purple-400 transition-colors">Skill Exchange</Link></li>
            </ul>
          </div>
          <div className="md:col-span-3 space-y-6">
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-gray-400">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link to="/chat" className="hover:text-purple-400 transition-colors">AI Assistant</Link></li>
              <li><Link to="/community" className="hover:text-purple-400 transition-colors">Community Forum</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-xs text-gray-600 font-medium tracking-wide">© 2026 StudySphere Student Collective.</div>
          <div className="flex gap-8 text-xs text-gray-500 font-bold uppercase tracking-widest">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors">System Status</span>
          </div>
        </div>
      </footer>

      {/* Mobile Experience Warning */}
      <AnimatePresence>
        {showMobileWarning && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="md:hidden fixed bottom-6 left-4 right-4 z-[999] glass-glow border border-purple-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-[0_0_40px_rgba(168,85,247,0.2)] bg-[#03030b]/95 backdrop-blur-xl"
          >
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30 mt-0.5">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-sm font-bold text-white mb-1">Desktop Recommended</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-light">StudySphere is heavily optimized for larger screens. For the best experience, please use a laptop or system.</p>
            </div>
            <button onClick={handleDismissWarning} className="text-gray-500 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HeroMetric({ value, label }: { value: string, label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold glow-text mb-1">{value}</div>
      <div className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">{label}</div>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
      </div>
      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{text}</span>
    </div>
  );
}

function FeatureCardSmall({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="p-6 rounded-2xl glass border border-white/5 hover:border-purple-500/30 transition-all group scale-100 hover:scale-105">
      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-sm font-bold tracking-tight">{title}</h3>
    </div>
  );
}
