import React, { useState, useEffect } from "react";
import { AppLayout } from "@/src/components/layout/AppLayout";
import { 
  FileText, 
  Sparkles, 
  Download, 
  Wand2, 
  History, 
  RotateCcw,
  Loader2,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Plus,
  Layout,
  Briefcase,
  Terminal,
  X,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState<"analyzing" | "optimizing" | "building" | "done">("done");
  const [hasResume, setHasResume] = useState(false);
  const [score, setScore] = useState(0);
  const [activeSuggestion, setActiveSuggestion] = useState<any>(null);
  const [activeTemplate, setActiveTemplate] = useState<"modern" | "technical" | "minimal">("modern");
  const [showProfileCheck, setShowProfileCheck] = useState(false);
  
  // Profile State - Central source of truth
  const [userProfile, setUserProfile] = useState({
    name: "Arjun Mehta",
    role: "Sr. Product Designer @ Stripe",
    headline: "Building high-performance design systems and interactive motion experiences for scale.",
    email: "arjun@mehta.dev",
    social: { github: "github.com/arjunmehta", linkedin: "linkedin.com/in/arjunmehta" },
    skills: ["UI Design", "Visual Systems", "Framer Motion", "React", "TypeScript", "Product Discovery", "System Design"],
    experience: [
      {
        id: 1,
        role: "Lead Frontend Engineer",
        company: "Project Vibe",
        period: "2023 – Present",
        desc: "Architected a collaborative motion library used by 500+ developers. Reduced bundle size by 32% using advanced tree-shaking patterns. Implement real-time synchronization using CRDTs."
      },
      {
        id: 2,
        role: "Full Stack Intern",
        company: "StreamLine Inc.",
        period: "2022 – 2023",
        desc: "Built a dashboard for monitoring server health using Next.js and Go. Optimized DB queries resulting in a 40% performance gain."
      }
    ]
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (data && !error) {
        setUserProfile(prev => ({
          ...prev,
          name: data.full_name || prev.name,
          role: data.role === 'mentor' ? 'Senior Industry Expert' : data.role === 'student' ? 'Aspiring Software Engineer' : prev.role,
          email: user.email || prev.email,
        }));
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleGenerate = () => {
    // Check if profile is complete enough (mock check)
    // To demonstrate the requirement, we check if skills exist. 
    // In a real app we'd check if they are newly added or empty.
    if (!userProfile.name || userProfile.experience.length === 0) {
      setShowProfileCheck(true);
      return;
    }

    setIsGenerating(true);
    
    // Step-by-step AI workflow
    setGenPhase("analyzing");
    
    setTimeout(() => {
      setGenPhase("optimizing");
      setTimeout(() => {
        setGenPhase("building");
        setTimeout(() => {
          setHasResume(true);
          setIsGenerating(false);
          setGenPhase("done");
          
          // Animate score
          const interval = setInterval(() => {
            setScore(prev => {
              if (prev >= 92) {
                clearInterval(interval);
                return 92;
              }
              return prev + 4;
            });
          }, 40);
        }, 1500);
      }, 1500);
    }, 1200);
  };

  const handleReset = () => {
    setHasResume(false);
    setScore(0);
    setGenPhase("done");
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 pb-20">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <FileText className="text-purple-400" /> AI Resume <span className="text-purple-400">Architect</span>
                </h1>
                <p className="text-gray-400 font-light">Transforming your profile data into ATS-optimized professional resumes.</p>
              </div>
              
              {hasResume && (
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
                  {(['modern', 'technical', 'minimal'] as const).map(t => (
                    <button 
                      key={t}
                      onClick={() => setActiveTemplate(t)}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        activeTemplate === t ? "bg-purple-600 text-white shadow-xl" : "text-gray-500 hover:text-white"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </header>

            <AnimatePresence mode="wait">
              {!hasResume ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass p-12 rounded-[3rem] border border-white/5 space-y-10 bg-circuit min-h-[650px] flex flex-col items-center justify-center text-center relative overflow-hidden"
                >
                   <AnimatePresence>
                    {isGenerating && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#03030b]/80 backdrop-blur-md z-20 flex flex-col items-center justify-center space-y-8"
                      >
                         <div className="relative">
                           <div className="w-24 h-24 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin" />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className="text-purple-400 animate-pulse" size={32} />
                           </div>
                         </div>
                         <div className="space-y-3">
                           <p className="text-2xl font-bold text-white tracking-tight">
                              {genPhase === "analyzing" && "Analyzing Profile Context..."}
                              {genPhase === "optimizing" && "Optimizing ATS Structure..."}
                              {genPhase === "building" && "Synthesizing Professional Polish..."}
                           </p>
                           <p className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.4em] animate-pulse">
                              Powered by StudySphere Intelligence
                           </p>
                         </div>
                         
                         <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 4 }}
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            />
                         </div>
                      </motion.div>
                    )}
                   </AnimatePresence>

                   <div className="space-y-12 max-w-lg">
                      <div className="relative inline-block">
                        <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-blue-600 rounded-[2.5rem] flex items-center justify-center animate-float shadow-2xl shadow-purple-500/20 border border-white/20">
                          <FileText className="text-white w-12 h-12" />
                        </div>
                        <Sparkles className="absolute -top-4 -right-4 text-purple-400" size={32} />
                      </div>
                      
                      <div className="space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight">Build Your <span className="text-purple-400">Resume</span></h2>
                        <p className="text-gray-400 leading-relaxed font-light">
                          Generate an ATS-optimized resume using your profile data.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 w-full pt-4">
                        <button 
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="btn-primary py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                        >
                          <Wand2 size={16} /> Generate Resume
                        </button>
                        <button className="glass py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all border-white/10 text-gray-400">
                          <History size={16} /> Load Existing
                        </button>
                      </div>
                   </div>

                   {/* Privacy Notice */}
                   <div className="pt-8 border-t border-white/5 w-full max-w-sm flex items-center justify-center gap-4 text-gray-600">
                      <Terminal size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Context Protected by AI Gateway</span>
                   </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="resume-preview"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl transition-all duration-700 bg-white",
                    activeTemplate === 'minimal' ? "p-16" : "p-12"
                  )}
                >
                   <ResumePreview template={activeTemplate} profile={userProfile} />
                   
                   <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-10">
                      <div className="flex gap-4">
                        <button className="px-8 py-4 rounded-2xl bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-purple-500 transition-colors shadow-xl shadow-purple-600/20 active:scale-95">
                          <Download size={16} /> Export as PDF
                        </button>
                        <button className="px-8 py-4 rounded-2xl bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors active:scale-95">
                          <Download size={16} /> Export DOCX
                        </button>
                      </div>
                      
                      <button className="flex items-center gap-2 text-slate-400 hover:text-purple-600 transition-colors font-bold text-[10px] uppercase tracking-widest p-4">
                        <Edit3 size={16} /> Edit Sections
                      </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* Sidebar Controls */}
        <aside className="lg:col-span-4 space-y-8">
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-8">
              <h3 className="font-bold flex items-center gap-3 border-b border-white/5 pb-5 text-xs uppercase tracking-[0.2em] text-purple-400">
                  <Sparkles size={16} /> Optimization Pulse
              </h3>
              
              <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ATS Readiness Score</span>
                      <span className={cn(
                        "text-3xl font-bold tracking-tight",
                        score > 85 ? "text-emerald-400" : score > 60 ? "text-orange-400" : "text-purple-400"
                      )}>{score}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-px">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          score > 85 ? "bg-emerald-500" : score > 60 ? "bg-orange-500" : "bg-purple-500"
                        )} 
                        style={{ boxShadow: `0 0 10px rgba(168,85,247,0.3)` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">AI Suggestions</h4>
                    <div className="space-y-3">
                      {hasResume ? (
                        <>
                          <SuggestionItem 
                            icon={<CheckCircle2 className="text-emerald-400" size={14} />} 
                            text="High skill-key match for Design Roles." 
                          />
                          <SuggestionItem 
                            onClick={() => setActiveSuggestion({
                               title: "Contextual Refinement",
                               text: "Your description for 'StreamLine' could benefit from more impactful verbs. Alex (AI) recommends 'Spearheaded' instead of 'Built'.",
                               actionText: "Apply AI Rewrite"
                            })}
                            icon={<Sparkles className="text-purple-400" size={14} />} 
                            text="Improve verbs in experience section." 
                            isAction
                          />
                        </>
                      ) : (
                        <div className="p-6 bg-white/5 rounded-2xl border border-dashed border-white/10 text-center">
                          <p className="text-[10px] text-gray-600 leading-relaxed italic">
                            Generate your first draft to see actionable AI recommendations.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
              </div>
            </div>

            <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-5">
                <h3 className="font-bold flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-blue-400">
                    <Layout size={16} /> Quick Settings
                </h3>
                <button 
                  onClick={handleReset}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Target Keywords</label>
                   <div className="flex flex-wrap gap-2">
                      {["Stripe", "UX", "React", "Frontend"].map(target => (
                        <button key={target} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 uppercase transition-all hover:border-purple-500/30">
                          {target}
                        </button>
                      ))}
                      <button className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-400 uppercase">
                        + Add
                      </button>
                   </div>
                </div>

                <button className="w-full py-4 rounded-xl bg-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3">
                   <Sparkles size={14} /> Regenerate Summary
                </button>
              </div>
            </div>
        </aside>
      </div>

      <AnimatePresence>
        {activeSuggestion && (
          <SuggestionModal 
            {...activeSuggestion} 
            onClose={() => setActiveSuggestion(null)} 
          />
        )}
        {showProfileCheck && (
          <ProfileCheckModal 
            onClose={() => setShowProfileCheck(false)} 
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function ResumePreview({ template, profile }: { template: string, profile: any }) {
  if (template === 'technical') {
    return (
      <div className="space-y-10 text-slate-900 font-sans">
        <header className="border-l-8 border-purple-600 pl-8 py-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter">{profile.name}</h2>
          <p className="text-slate-500 font-mono text-sm mt-1">{profile.role}</p>
          <div className="flex gap-6 mt-4 text-[10px] font-mono text-slate-400">
             <div className="flex items-center gap-2"><Mail size={12}/> {profile.email}</div>
             <div className="flex items-center gap-2"><Github size={12}/> {profile.social.github}</div>
             <div className="flex items-center gap-2"><Linkedin size={12}/> {profile.social.linkedin}</div>
          </div>
        </header>

        <section className="space-y-6">
           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-purple-600 bg-purple-50 px-4 py-2 w-fit">Experience</h3>
           <div className="space-y-8">
              {profile.experience.map((exp: any) => (
                <div key={exp.id} className="space-y-2 group">
                   <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-lg">{exp.role} @ <span className="text-purple-600">{exp.company}</span></h4>
                      <span className="text-[10px] font-mono text-slate-400">{exp.period}</span>
                   </div>
                   <p className="text-sm text-slate-600 font-light leading-relaxed pr-20">{exp.desc}</p>
                </div>
              ))}
           </div>
        </section>

        <section className="space-y-6">
           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-4 py-2 w-fit">Core Competencies</h3>
           <div className="grid grid-cols-4 gap-2">
              {profile.skills.map((s: string) => (
                <div key={s} className="px-3 py-2 border border-slate-100 text-[10px] font-bold text-slate-600 uppercase text-center rounded-sm">
                   {s}
                </div>
              ))}
           </div>
        </section>
      </div>
    );
  }

  // Modern Template (Default)
  return (
    <div className="space-y-12 text-slate-800">
       <div className="border-b-2 border-slate-200 pb-10 flex justify-between items-end">
          <div className="space-y-4">
            <h2 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">{profile.name}</h2>
            <div className="flex items-center gap-3">
               <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">{profile.role}</span>
               <div className="h-px w-20 bg-slate-200" />
               <p className="text-slate-500 font-medium text-xs">Based in San Francisco</p>
            </div>
          </div>
          <div className="text-right text-[10px] font-bold text-slate-400 space-y-2">
             <div className="flex items-center justify-end gap-2 group hover:text-purple-600 transition-colors cursor-pointer"><Mail size={12} className="text-slate-300 group-hover:text-purple-400 transition-colors" /> {profile.email}</div>
             <div className="flex items-center justify-end gap-2 group hover:text-purple-600 transition-colors cursor-pointer"><Github size={12} className="text-slate-300 group-hover:text-purple-400 transition-colors" /> {profile.social.github}</div>
          </div>
       </div>

       <div className="grid grid-cols-3 gap-12">
          <div className="col-span-2 space-y-10">
             <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Professional Narrative</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-light italic">
                   {profile.headline}
                </p>
             </div>

             <div className="space-y-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Experience</h3>
                <div className="space-y-10">
                   {profile.experience.map((exp: any) => (
                     <div key={exp.id} className="space-y-3 relative pl-8 border-l-2 border-slate-50">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 bg-purple-500 rounded-full" />
                        <div className="flex justify-between font-bold">
                           <span className="text-slate-900">{exp.role}</span>
                           <span className="text-[10px] text-slate-400">{exp.period}</span>
                        </div>
                        <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{exp.company}</div>
                        <p className="text-[13px] text-slate-500 leading-relaxed pr-10">
                           {exp.desc}
                        </p>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="space-y-10">
             <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Hard Skills</h3>
                <div className="flex flex-wrap gap-2">
                   {profile.skills.map(s => (
                     <span key={s} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-widest transition-all hover:bg-slate-900 hover:text-white group">
                       {s}
                     </span>
                   ))}
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Certifications</h3>
                <div className="space-y-4">
                   <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-[10px] font-bold text-slate-900">AWS Certified Developer</div>
                      <div className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">2024</div>
                   </div>
                   <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="text-[10px] font-bold text-slate-900">Google UX Architect</div>
                      <div className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">2023</div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function SuggestionModal({ title, text, actionText, onClose }: any) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl bg-[#03030b]"
      >
        <div className="p-12 space-y-8 text-center">
           {!success ? (
             <>
               <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Sparkles className="text-purple-400" size={32} />
               </div>
               <div className="space-y-4">
                  <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                  <p className="text-sm text-gray-400 leading-relaxed font-light">
                    {text}
                  </p>
               </div>
               <div className="flex gap-4 pt-4">
                  <button onClick={onClose} className="flex-1 py-4 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button 
                    onClick={handleAction}
                    disabled={loading}
                    className="flex-[2] btn-primary py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : actionText}
                  </button>
               </div>
             </>
           ) : (
             <div className="py-10 space-y-6">
                <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                   <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl font-bold tracking-tight">Optimization Applied!</h2>
                   <p className="text-gray-400 font-light max-w-xs mx-auto leading-relaxed">
                     We've successfully reworded your experience with quantified metrics.
                   </p>
                </div>
                <button 
                  onClick={onClose}
                  className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all font-mono"
                >
                  Return to Editor
                </button>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}

function ProfileCheckModal({ onClose }: any) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl bg-[#03030b] p-10 text-center space-y-8"
      >
        <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
           <Edit3 className="text-orange-400" size={32} />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">Incomplete <span className="text-orange-400">Profile</span></h2>
          <p className="text-sm text-gray-400 leading-relaxed font-light">
            Your intelligence blueprint is missing key experience data. Complete your profile sections to enable high-fidelity generation.
          </p>
        </div>
        <div className="space-y-3">
          <button className="w-full py-4 rounded-xl bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all">
            Update Profile Now
          </button>
          <button onClick={onClose} className="w-full py-4 rounded-xl bg-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all">
            Maybe Later
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SuggestionItem({ icon, text, onClick, isAction = false }: { icon: React.ReactNode, text: string, onClick?: () => void, isAction?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border flex items-start gap-3 transition-all",
        isAction ? "bg-purple-500/5 border-purple-500/10 cursor-pointer hover:bg-purple-500/10" : "bg-white/5 border-white/5"
      )}
    >
       <span className="mt-0.5">{icon}</span>
       <span className={cn("text-[10px] leading-relaxed", isAction ? "text-purple-300 font-medium" : "text-gray-400")}>{text}</span>
    </div>
  );
}
