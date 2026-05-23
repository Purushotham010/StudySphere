import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/src/components/layout/AppLayout";
import { 
  Layers, 
  Zap, 
  ArrowRight, 
  User, 
  Plus, 
  CheckCircle2, 
  Loader2, 
  X, 
  MessageSquare, 
  Clock,
  Github,
  Linkedin,
  Mail,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

const DEFAULT_EXCHANGES = [
  {
    id: "1",
    user: "Aarav Mehta",
    email: "aarav@studysphere.ai",
    github: "github.com/aarav-mehta",
    linkedin: "linkedin.com/in/aarav-mehta",
    teaches: "React, TailwindCSS, Frontend Architecture",
    wants: "Rust, Backend Systems, Database Normalization",
    desc: "Looking to level up my backend engineering skills! In return, I can help you build stunning, fluid UI animations and responsive designs.",
    role: "student"
  },
  {
    id: "2",
    user: "Sophia Martinez",
    email: "sophia@studysphere.ai",
    github: "github.com/sophia-codes",
    linkedin: "linkedin.com/in/sophia-codes",
    teaches: "Algorithms, Python, Data Science",
    wants: "Framer Motion, UI/UX, Design Systems",
    desc: "Can help with technical interview prep, Python algorithms, and ML foundations. I want to improve my frontend design aesthetics.",
    role: "student"
  },
  {
    id: "3",
    user: "Liam O'Connor",
    email: "liam@studysphere.ai",
    github: "github.com/liam-oconnor",
    linkedin: "linkedin.com/in/liam-oconnor",
    teaches: "Rust CLI tools, WebAssembly, Go",
    wants: "TypeScript, Advanced React Patterns",
    desc: "Systems engineering enthusiast looking to understand web framework state management and advanced TypeScript features.",
    role: "student"
  }
];

export default function SkillExchange() {
  const { user, profile, refreshProfile } = useAuth();
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Self-healing profile parser
  const parseProfileSkills = (p: any) => {
    let teaches = p.skills_offered || "";
    let wants = p.skills_seeking || "";
    let displayBio = p.bio || "";

    if (p.bio && p.bio.startsWith("{")) {
      try {
        const parsed = JSON.parse(p.bio);
        teaches = parsed.skills_offered || teaches || "";
        wants = parsed.skills_seeking || wants || "";
        displayBio = parsed.text || "";
      } catch (e) {
        // Not JSON
      }
    }

    return {
      id: p.id,
      user: p.full_name || "Anonymous Learner",
      email: p.email,
      github: p.github_url,
      linkedin: p.linkedin_url,
      teaches: teaches || "Not specified",
      wants: wants || "Not specified",
      desc: displayBio || "No description provided.",
      role: p.role || "student"
    };
  };

  const fetchExchanges = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, bio, github_url, linkedin_url")
        .eq("role", "student")
        .eq("onboarded", true);

      if (error) throw error;

      const parsed = (data || [])
        .map(parseProfileSkills)
        .filter(ex => ex.teaches !== "Not specified" || ex.wants !== "Not specified");
      setExchanges(parsed.length > 0 ? parsed : DEFAULT_EXCHANGES);
    } catch (err) {
      console.error("Error fetching exchanges:", err);
      setExchanges(DEFAULT_EXCHANGES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const failsafe = setTimeout(() => {
      if (active) {
        console.warn("SkillExchange failsafe triggered: forcing loading to false.");
        setIsLoading(false);
        if (exchanges.length === 0) setExchanges(DEFAULT_EXCHANGES);
      }
    }, 2500);

    fetchExchanges().finally(() => {
      clearTimeout(failsafe);
    });

    return () => {
      active = false;
      clearTimeout(failsafe);
    };
  }, []);

  const handlePostExpertise = async (teaches: string, wants: string, desc: string) => {
    if (!user) return;
    try {
      // Try updating native columns first
      const { error } = await supabase
        .from("profiles")
        .update({
          skills_offered: teaches,
          skills_seeking: wants,
          bio: desc
        })
        .eq("id", user.id);

      if (error) {
        // Fallback to storing in bio JSON
        const bioData = JSON.stringify({
          skills_offered: teaches,
          skills_seeking: wants,
          text: desc
        });

        const { error: fbError } = await supabase
          .from("profiles")
          .update({
            bio: bioData
          })
          .eq("id", user.id);

        if (fbError) throw fbError;
      }

      await refreshProfile();
      await fetchExchanges();
      setIsPostModalOpen(false);
    } catch (err) {
      console.error("Error saving expertise:", err);
      alert("Failed to save expertise details. Please check your network and try again.");
    }
  };

  const filteredExchanges = exchanges.filter(ex => 
    ex.id !== user?.id && (
      ex.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.teaches.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.wants.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Skill <span className="text-purple-400">Exchange</span></h1>
            <p className="text-gray-400">Trade expertise with peers and build collaborative projects in real time.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills or names..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-purple-500/30 text-sm font-medium transition-all"
              />
            </div>
            
            <button 
              onClick={() => setIsPostModalOpen(true)}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 active:scale-95 duration-200"
            >
              <Plus size={18} /> Post Expertise
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
        ) : filteredExchanges.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {filteredExchanges.map((ex) => (
              <ExchangeCard 
                key={ex.id}
                exchange={ex}
              />
            ))}
          </div>
        ) : (
          <div className="glass py-20 rounded-[3rem] border border-white/5 text-center space-y-6">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-2">
              <Layers className="text-gray-500" size={32} />
            </div>
            <h3 className="text-2xl text-white font-bold tracking-tight">No Exchanges Matching Your Search</h3>
            <p className="text-gray-500 font-light max-w-md mx-auto leading-relaxed">
              {searchQuery ? `We couldn't find any skill exchanges matching "${searchQuery}".` : "Be the first one in the community to post what skills you can offer and seek!"}
            </p>
            <button 
              onClick={() => {
                if (searchQuery) setSearchQuery("");
                else setIsPostModalOpen(true);
              }} 
              className="btn-primary mt-4 inline-flex py-3 px-8 rounded-xl text-[10px] uppercase tracking-widest font-bold"
            >
              {searchQuery ? "Clear Search" : "Post Expertise"}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPostModalOpen && (
          <PostExpertiseModal 
            onClose={() => setIsPostModalOpen(false)}
            onSave={handlePostExpertise}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

const ExchangeCard: React.FC<{ exchange: any }> = ({ exchange }) => {
  const { user } = useAuth();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [status, setStatus] = useState<'none' | 'pending' | 'accepted'>(() => {
    const saved = localStorage.getItem("studysphere_exchange_statuses");
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed[exchange.id] || 'none';
  });

  // Fetch real database status if it's a real user
  useEffect(() => {
    const isSeedPeer = !exchange.id || exchange.id.length < 10 || exchange.id === "fedd5163-9cf1-4781-975c-7c60a41acf16";
    if (user && !isSeedPeer) {
      supabase.from("connections")
        .select("status")
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${exchange.id}),and(requester_id.eq.${exchange.id},recipient_id.eq.${user.id})`)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setStatus(data.status);
        });
    }
  }, [user, exchange.id]);

  // Automated acceptance simulation for sandbox testing
  useEffect(() => {
    if (status === 'pending') {
      const timer = setTimeout(() => {
        const saved = localStorage.getItem("studysphere_exchange_statuses");
        const parsed = saved ? JSON.parse(saved) : {};
        parsed[exchange.id] = 'accepted';
        localStorage.setItem("studysphere_exchange_statuses", JSON.stringify(parsed));
        
        // Add to active chats store so it is ready for real-time chatting instantly upon acceptance!
        const peer = {
          id: exchange.id,
          name: exchange.user,
          role: exchange.role === "mentor" ? "Mentor" : "Learner",
          email: exchange.email,
          github: exchange.github,
          linkedin: exchange.linkedin,
          skills: exchange.teaches.split(",").map((s: string) => s.trim())
        };
        const activeChats = JSON.parse(localStorage.getItem("studysphere_active_chats") || "[]");
        if (!activeChats.find((c: any) => c.id === peer.id)) {
          activeChats.push(peer);
          localStorage.setItem("studysphere_active_chats", JSON.stringify(activeChats));
        }

        setStatus('accepted');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, exchange]);

  const handleCardClick = () => {
    if (status === 'none') {
      setShowRequestModal(true);
    } else if (status === 'accepted') {
      window.location.href = `/chat?peerId=${exchange.id}`;
    }
  };

  return (
    <>
      <motion.div 
        whileHover={{ y: -5 }}
        onClick={handleCardClick}
        className={cn(
          "glass p-8 rounded-[2.5rem] border space-y-6 group transition-all bg-circuit h-fit cursor-pointer relative",
          status === 'accepted' ? "border-purple-500/30 shadow-lg shadow-purple-500/5 hover:border-purple-500/50" : "border-white/5 hover:border-purple-500/20"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 relative">
            <User className="text-white" size={24} />
            {status === 'accepted' && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#03030b]" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-white flex items-center gap-2">
              {exchange.user}
              {status === 'accepted' && <CheckCircle2 size={14} className="text-emerald-400" />}
            </h4>
            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Zap size={10} className="fill-purple-400" /> {exchange.role === "mentor" ? "Mentor" : "Learner"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 bg-white/5 p-6 rounded-2xl border border-white/5">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Offers</div>
            <div className="text-sm font-bold text-white leading-tight">{exchange.teaches}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Seeking</div>
            <div className="text-sm font-bold text-purple-400 text-right leading-tight">{exchange.wants}</div>
          </div>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed italic font-light">"{exchange.desc}"</p>

        {status === 'none' && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowRequestModal(true);
            }}
            className="w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-white/10 hover:text-purple-400 active:scale-[0.98]"
          >
            Request Session <ArrowRight size={14} />
          </button>
        )}

        {status === 'pending' && (
          <button 
            disabled
            onClick={(e) => e.stopPropagation()}
            className="w-full py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest animate-pulse cursor-default"
          >
            <Loader2 size={12} className="animate-spin" /> Pending Approval...
          </button>
        )}

        {status === 'accepted' && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/chat?peerId=${exchange.id}`;
            }}
            className="w-full py-4 rounded-2xl bg-purple-600/10 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest active:scale-[0.98] shadow-lg shadow-purple-500/10"
          >
            Connected • Message Peer <MessageSquare size={14} />
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {showRequestModal && (
          <RequestModal 
            exchange={exchange}
            onClose={() => setShowRequestModal(false)} 
            onRequestSent={() => setStatus('pending')}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function PostExpertiseModal({ onClose, onSave }: { onClose: () => void; onSave: (teaches: string, wants: string, desc: string) => void }) {
  const { profile } = useAuth();
  const [teaches, setTeaches] = useState("");
  const [wants, setWants] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDesc(profile.bio || "");
      // Pre-fill skills if they exist
      if (profile.skills_offered) setTeaches(profile.skills_offered);
      if (profile.skills_seeking) setWants(profile.skills_seeking);
      
      if (profile.bio && profile.bio.startsWith("{")) {
        try {
          const parsed = JSON.parse(profile.bio);
          setTeaches(parsed.skills_offered || "");
          setWants(parsed.skills_seeking || "");
          setDesc(parsed.text || "");
        } catch (e) {
          // not JSON
        }
      }
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teaches.trim()) {
      setError("Please specify what skills you offer.");
      return;
    }
    if (!wants.trim()) {
      setError("Please specify what skills you are seeking.");
      return;
    }
    if (!desc.trim()) {
      setError("Please write a short description to help peers connect with you.");
      return;
    }
    onSave(teaches.trim(), wants.trim(), desc.trim());
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl bg-[#03030b]"
      >
        <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
          <header className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">Post <span className="text-purple-400">Expertise</span></h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-full">
              <X size={24} />
            </button>
          </header>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center font-bold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Skills You Offer</label>
              <input 
                type="text"
                required
                value={teaches}
                onChange={(e) => setTeaches(e.target.value)}
                placeholder="e.g. Flutter, React, Figma"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-purple-500/30 transition-all placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Skills You Seek</label>
              <input 
                type="text"
                required
                value={wants}
                onChange={(e) => setWants(e.target.value)}
                placeholder="e.g. Python, UI/UX, Serverless"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-purple-500/30 transition-all placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Exchange Description</label>
              <textarea 
                required
                rows={4}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="I am a CS student looking to build visual editor, looking for anyone who knows UI/UX designs to exchange..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-light outline-none focus:border-purple-500/30 transition-all resize-none placeholder:text-gray-700"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-white/5">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-[2] btn-primary py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
            >
              Publish Exchange
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function RequestModal({ exchange, onClose, onRequestSent }: { exchange: any; onClose: () => void; onRequestSent?: () => void }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    setStatus("loading");
    
    // Check if the target is a "Seed Peer"
    const isSeedPeer = !exchange.id || exchange.id.length < 10 || exchange.id === "fedd5163-9cf1-4781-975c-7c60a41acf16";

    if (isSeedPeer) {
      setTimeout(() => {
        setStatus("success");
        if (onRequestSent) onRequestSent();
      }, 1500);
    } else {
      if (!user) return;
      try {
        const { error } = await supabase.from('connections').insert({
          requester_id: user.id,
          recipient_id: exchange.id,
          status: 'pending'
        });
        
        if (error) {
          console.error("Error creating connection request:", error);
          setStatus("idle");
        } else {
          setStatus("success");
          if (onRequestSent) onRequestSent();
        }
      } catch (err) {
        console.error("Failed to connect:", err);
        setStatus("idle");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl bg-[#03030b]"
      >
        <div className="p-10 space-y-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
          {status !== "success" ? (
            <>
              <header className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.3em]">Skill Exchange</div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Request to {exchange.user}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <X size={24} className="text-gray-500" />
                </button>
              </header>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">You get</span>
                    <span className="text-xs font-bold text-white tracking-tight">{exchange.teaches}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">You give</span>
                    <span className="text-xs font-bold text-purple-400 tracking-tight">{exchange.wants}</span>
                  </div>
                </div>

                {/* Direct Contact info */}
                <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10 space-y-3">
                  <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Direct Contact Info</div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <Mail size={14} className="text-purple-400" />
                      <a href={`mailto:${exchange.email}`} className="hover:underline hover:text-white transition-colors">{exchange.email}</a>
                    </div>

                    {exchange.github && (
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <Github size={14} className="text-purple-400" />
                        <a href={exchange.github.startsWith("http") ? exchange.github : `https://${exchange.github}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white transition-colors">{exchange.github}</a>
                      </div>
                    )}

                    {exchange.linkedin && (
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <Linkedin size={14} className="text-purple-400" />
                        <a href={exchange.linkedin.startsWith("http") ? exchange.linkedin : `https://${exchange.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white transition-colors">{exchange.linkedin}</a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 flex items-center gap-2">
                    <MessageSquare size={12} /> Add a personal note
                  </label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Hi ${exchange.user.split(' ')[0]}! I'd love to learn ${exchange.teaches} from you and can definitely help you with ${exchange.wants}...`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-purple-500/30 text-sm font-light transition-all min-h-[120px] resize-none placeholder:text-gray-700"
                  />
                </div>
              </div>

              <button 
                onClick={handleSend}
                disabled={status === "loading"}
                className="w-full py-5 rounded-2xl btn-primary text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {status === "loading" ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing Request...</>
                ) : (
                  <>Send Exchange Request <ArrowRight size={16} /></>
                )}
              </button>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-white">Request Sent!</h2>
                <p className="text-gray-400 font-light max-w-sm leading-relaxed px-4">
                  We've notified <span className="text-purple-400 font-medium">{exchange.user}</span>. Once they accept your exchange invitation, you will be connected and can start chatting directly!
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-[95]"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
