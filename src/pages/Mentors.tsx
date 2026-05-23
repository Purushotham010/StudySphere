import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/src/components/layout/AppLayout";
import { 
  Search, 
  Filter, 
  Star, 
  MessageSquare, 
  Calendar, 
  ShieldCheck, 
  Users,
  X,
  Clock,
  CheckCircle2,
  Video,
  ArrowRight,
  Send,
  MoreVertical,
  Lock,
  Loader2,
  Github,
  Linkedin,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

const DEFAULT_MENTORS = [
  {
    id: "fedd5163-9cf1-4781-975c-7c60a41acf16",
    name: "David Chen",
    email: "david@studysphere.ai",
    github: "github.com/dchen-dev",
    linkedin: "linkedin.com/in/dchen-dev",
    role: "Senior Engineering Guide @ Google",
    rating: 5.0,
    reviews: 42,
    skills: ["System Design", "Rust", "TypeScript", "React"],
    bio: "Passionate about helping students master robust architecture design, scale systems, and navigate high-caliber career options."
  },
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
    name: "Elena Rostova",
    email: "elena@studysphere.ai",
    github: "github.com/elena-rostova",
    linkedin: "linkedin.com/in/elena-rostova",
    role: "Product Design Principal @ Figma",
    rating: 4.9,
    reviews: 28,
    skills: ["Framer Motion", "UI/UX", "Product Design", "Figma"],
    bio: "Let's craft experiences that wow. I guide aspiring designers on UI architecture, motion frameworks, and interactive portfolio building."
  },
  {
    id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    name: "Marcus Vance",
    email: "marcus@studysphere.ai",
    github: "github.com/mvance-sys",
    linkedin: "linkedin.com/in/mvance-sys",
    role: "Core Developer @ Linux Foundation",
    rating: 5.0,
    reviews: 35,
    skills: ["Linux Kernel", "C++", "Open Source", "Algorithms"],
    bio: "Academic guide specializing in low-level systems programming, operating system kernels, and high-performance computation."
  }
];

export default function Mentors() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [messagingMentor, setMessagingMentor] = useState<any>(null);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, 'none' | 'pending' | 'accepted'>>(() => {
    const saved = localStorage.getItem("studysphere_connections");
    return saved ? JSON.parse(saved) : {};
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Self-healing profile parser for mentors
  const parseMentorProfile = (p: any) => {
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

    // Split skills by commas
    const skillsList = teaches 
      ? teaches.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ["Mentorship", "Academic Support"];

    return {
      id: p.id,
      name: p.full_name || "Expert Mentor",
      email: p.email,
      github: p.github_url,
      linkedin: p.linkedin_url,
      role: displayBio && !p.bio?.startsWith("{") ? displayBio.substring(0, 50) : "Academic Guide & Expert Mentor",
      rating: 5.0,
      reviews: p.growth_points ? Math.floor(p.growth_points / 10) + 1 : 12,
      skills: skillsList,
      bio: displayBio || "Experienced academic and professional guide here to help you reach your learning potential."
    };
  };

  const fetchMentors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, bio, github_url, linkedin_url, growth_points")
        .eq("role", "mentor")
        .eq("onboarded", true);

      if (error) throw error;
      const parsed = (data || []).map(parseMentorProfile);
      setMentors(parsed.length > 0 ? parsed : DEFAULT_MENTORS);
    } catch (err) {
      console.error("Error fetching mentors:", err);
      setMentors(DEFAULT_MENTORS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const failsafe = setTimeout(() => {
      if (active) {
        console.warn("Mentors failsafe triggered: forcing loading to false.");
        setIsLoading(false);
        if (mentors.length === 0) setMentors(DEFAULT_MENTORS);
      }
    }, 2500);

    fetchMentors().finally(() => {
      clearTimeout(failsafe);
    });

    return () => {
      active = false;
      clearTimeout(failsafe);
    };
  }, []);

  // Fetch real database connection statuses when the component mounts
  useEffect(() => {
    if (user) {
      const fetchConnections = async () => {
        try {
          const { data, error } = await supabase
            .from("connections")
            .select("requester_id, recipient_id, status")
            .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
            
          if (!error && data) {
            setConnectionStatuses(prev => {
              const next = { ...prev };
              data.forEach(c => {
                const peerId = c.requester_id === user.id ? c.recipient_id : c.requester_id;
                next[peerId] = c.status as any;
              });
              return next;
            });
          }
        } catch (err) {
          console.error("Failed to load connection statuses:", err);
        }
      };
      fetchConnections();
    }
  }, [user]);

  const filteredMentors = mentors.filter(m => 
    m.id !== user?.id && (
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.bio.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleConnect = async (mentorId: string) => {
    // Optimistic UI update
    setConnectionStatuses(prev => {
      const next = { ...prev, [mentorId]: 'pending' as const };
      localStorage.setItem("studysphere_connections", JSON.stringify(next));
      return next;
    });

    const isSeedPeer = mentorId.length < 10 || mentorId === "fedd5163-9cf1-4781-975c-7c60a41acf16";

    if (isSeedPeer) {
      // Auto-accept after 2 seconds for gorgeous real-time simulation
      setTimeout(() => {
        setConnectionStatuses(prev => {
          const next = { ...prev, [mentorId]: 'accepted' as const };
          localStorage.setItem("studysphere_connections", JSON.stringify(next));
          
          // Find the mentor and add to active chats store
          const mentor = mentors.find(m => m.id === mentorId) || DEFAULT_MENTORS.find(m => m.id === mentorId);
          if (mentor) {
            const activeChats = JSON.parse(localStorage.getItem("studysphere_active_chats") || "[]");
            if (!activeChats.find((c: any) => c.id === mentor.id)) {
              activeChats.push(mentor);
              localStorage.setItem("studysphere_active_chats", JSON.stringify(activeChats));
            }
          }
          
          return next;
        });
      }, 2000);
    } else {
      // REAL DATABASE CONNECTION LOGIC
      if (!user) return;
      try {
        const { error } = await supabase.from('connections').insert({
          requester_id: user.id,
          recipient_id: mentorId,
          status: 'pending'
        });
        
        if (error) {
          console.error("Error creating connection request:", error);
          // Revert optimistic UI
          setConnectionStatuses(prev => {
            const next = { ...prev };
            delete next[mentorId];
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to connect:", err);
      }
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-16 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
              <Users size={12} /> Live Network
            </div>
            <h1 className="text-5xl font-bold tracking-tight">Mentor <span className="glow-text">Discovery</span></h1>
            <p className="text-gray-500 text-lg font-light">Direct connections to registered academic guides and expert mentors in real time.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mentors or skills..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-purple-500/30 text-sm font-medium transition-all"
              />
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
        ) : filteredMentors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredMentors.map((m) => (
              <MentorCard 
                key={m.id} 
                mentor={m}
                connectionStatus={connectionStatuses[m.id] || 'none'}
                onConnect={() => handleConnect(m.id)} 
                onMessage={() => {
                  const activeChats = JSON.parse(localStorage.getItem("studysphere_active_chats") || "[]");
                  if (!activeChats.find((c: any) => c.id === m.id)) {
                    activeChats.push(m);
                    localStorage.setItem("studysphere_active_chats", JSON.stringify(activeChats));
                  }
                  navigate(`/chat?peerId=${m.id}`);
                }}
                onBook={() => setSelectedMentor(m)}
              />
            ))}
          </div>
        ) : (
          <div className="glass py-20 rounded-[3rem] border border-white/5 text-center space-y-6">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-2">
              <Search className="text-gray-500" size={32} />
            </div>
            <h3 className="text-2xl text-white font-bold tracking-tight">No Live Mentors Found</h3>
            <p className="text-gray-500 font-light max-w-md mx-auto leading-relaxed">
              {searchQuery ? `We couldn't find any mentors matching "${searchQuery}".` : "There are currently no users registered as Mentors. To see a mentor appear here, register a new account and select 'I'm a Mentor' in the onboarding screen!"}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="btn-primary mt-4 inline-flex py-3 px-8 rounded-xl text-[10px] uppercase tracking-widest font-bold">Clear Search</button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedMentor && (
          <BookingModal 
            mentor={selectedMentor} 
            onClose={() => setSelectedMentor(null)} 
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

const MentorCard: React.FC<{ mentor: any, onConnect: () => void, onMessage: () => void, onBook: () => void, connectionStatus: string }> = ({ mentor, onConnect, onMessage, onBook, connectionStatus }) => {
  const isAccepted = connectionStatus === 'accepted';
  const isPending = connectionStatus === 'pending';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass p-10 rounded-[2.5rem] border border-white/5 space-y-8 group hover:border-purple-500/30 transition-all relative bg-circuit overflow-hidden h-fit"
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500/10 to-blue-500/10 border border-white/10 flex items-center justify-center relative p-1.5 shadow-2xl">
          <div className="w-full h-full rounded-2xl bg-[#03030b] flex items-center justify-center text-gray-800">
            <span className="text-2xl font-bold text-gray-400 opacity-20">{mentor.name.split(' ').map((n: string) => n[0]).join('')}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-500 rounded-2xl border-2 border-[#03030b] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <ShieldCheck className="text-white w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-orange-400 font-bold mb-1 bg-orange-400/5 px-2 py-1 rounded-lg border border-orange-400/10">
            <Star size={14} className="fill-orange-400" /> {mentor.rating.toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">{mentor.reviews} SESSIONS</div>
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-xl font-bold group-hover:text-purple-400 transition-colors tracking-tight">{mentor.name}</h3>
        <p className="text-xs text-purple-400 font-medium uppercase tracking-widest mt-1.5 truncate max-w-xs">{mentor.role}</p>
      </div>

      <div className="flex flex-wrap gap-2 relative z-10">
        {mentor.skills.map((s: string) => (
          <span key={s} className="px-3 py-1 rounded-lg bg-white/5 text-[10px] text-gray-500 font-bold uppercase tracking-widest border border-white/10 group-hover:border-purple-500/20 transition-colors">#{s}</span>
        ))}
      </div>

      <div className="pt-6 border-t border-white/5 relative z-10 grid grid-cols-2 gap-4">
        <button 
          onClick={onMessage}
          disabled={!isAccepted}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-4 rounded-2xl transition-all text-[10px] font-bold uppercase tracking-widest border",
            isAccepted 
              ? "bg-white/5 hover:bg-white/10 border-white/5 text-white active:scale-95" 
              : "bg-white/2 border-white/5 text-gray-500/40 cursor-not-allowed opacity-60"
          )}
        >
          <MessageSquare size={16} className={cn(isAccepted ? "text-purple-400" : "text-gray-500/30")} /> 
          Message
        </button>
        <button 
          onClick={onConnect}
          disabled={isAccepted || isPending}
          className={cn(
            "flex items-center justify-center gap-2 py-4 rounded-2xl transition-all text-[10px] font-bold uppercase tracking-widest text-white border-none active:scale-95",
            isAccepted 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-none cursor-default" 
              : isPending
                ? "bg-white/10 text-gray-400 shadow-none cursor-default"
                : "bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/20"
          )}
        >
          {isAccepted ? (
            <><CheckCircle2 size={16} /> Connected</>
          ) : isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Pending</>
          ) : (
            <><Calendar size={16} /> Connect</>
          )}
        </button>
      </div>

      {isAccepted && (
        <div className="pt-4 border-t border-white/5 flex flex-col gap-3 relative z-10">
          <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Direct Socials</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-xs text-gray-400">
              <Mail size={12} className="text-gray-500" />
              <a href={`mailto:${mentor.email}`} className="hover:underline hover:text-white truncate">{mentor.email}</a>
            </div>
            {mentor.github && (
              <div className="flex items-center gap-2.5 text-xs text-gray-400">
                <Github size={12} className="text-gray-500" />
                <a href={mentor.github.startsWith("http") ? mentor.github : `https://${mentor.github}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white truncate">{mentor.github}</a>
              </div>
            )}
            {mentor.linkedin && (
              <div className="flex items-center gap-2.5 text-xs text-gray-400">
                <Linkedin size={12} className="text-gray-500" />
                <a href={mentor.linkedin.startsWith("http") ? mentor.linkedin : `https://${mentor.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white truncate">{mentor.linkedin}</a>
              </div>
            )}
          </div>
          
          <button 
            onClick={onBook}
            className="w-full mt-2 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest border border-purple-500/20 transition-all active:scale-95"
          >
            Book Live Call
          </button>
        </div>
      )}
    </motion.div>
  );
}



function BookingModal({ mentor, onClose }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleBook = async () => {
    if (!selectedDate || !user) return;
    setLoading(true);
    
    // Calculate a pseudo-date for the database
    const bookingDate = new Date();
    if (selectedDate === "Tomorrow") bookingDate.setDate(bookingDate.getDate() + 1);
    else if (selectedDate === "In 3 Days") bookingDate.setDate(bookingDate.getDate() + 3);
    else if (selectedDate === "Next Week") bookingDate.setDate(bookingDate.getDate() + 7);
    
    bookingDate.setHours(12, 0, 0, 0); // Noon as a placeholder

    try {
      const { error } = await supabase.from('mentor_sessions').insert({
        student_id: user.id,
        mentor_id: mentor.id,
        title: `1-on-1 Session with ${mentor.name}`,
        session_time: bookingDate.toISOString(),
        session_type: "Live Call",
        status: "accepted"
      });

      if (error) throw error;
      setStep(2);
    } catch (err) {
      console.error("Failed to save real booking (likely fake mentor ID):", err);
      // Fallback for hackathon demo if mentor.id is fake
      const newBooking = {
        id: Date.now().toString(),
        title: `1-on-1 Session with ${mentor.name}`,
        time: bookingDate.toISOString(),
        mentor: mentor.name,
        type: "Live Call",
        color: "purple"
      };
      try {
        const existing = JSON.parse(localStorage.getItem("studysphere_bookings") || "[]");
        localStorage.setItem("studysphere_bookings", JSON.stringify([newBooking, ...existing]));
      } catch (e) {}
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl bg-[#03030b]"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors z-10 p-1.5 hover:bg-white/5 rounded-full"
        >
          <X size={24} />
        </button>

        <div className="p-12 space-y-10">
          {step === 1 ? (
            <>
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Calendar className="text-purple-400" size={32} />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Book Session with <span className="text-purple-400">{mentor.name.split(' ')[0]}</span></h2>
                <p className="text-gray-500 font-light italic leading-relaxed">
                  "{mentor.bio}"
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-2 cursor-default hover:border-purple-500/30 transition-all group">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-purple-400 transition-colors">
                      <Clock size={12} /> Duration
                    </div>
                    <div className="text-lg font-bold text-white">45 Minutes</div>
                  </div>
                  <div className="p-6 bg-purple-500/10 rounded-3xl border border-purple-500/30 space-y-2 cursor-default transition-all group">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                       <Video size={12} /> Format
                    </div>
                    <div className="text-lg font-bold text-white">1-on-1 Call</div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between px-4">
                     <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Target Date</h4>
                     <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Time TBD in Chat</span>
                   </div>
                   <div className="flex flex-wrap gap-3">
                      {["Today", "Tomorrow", "In 3 Days", "Next Week"].map(dateLabel => (
                        <button 
                          key={dateLabel} 
                          onClick={() => setSelectedDate(dateLabel)}
                          className={cn(
                            "px-6 py-3 rounded-xl border text-sm font-bold tracking-tight transition-all active:scale-95",
                            selectedDate === dateLabel 
                              ? "bg-purple-600/20 border-purple-500/50 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.2)]" 
                              : "bg-white/5 border-white/5 text-gray-400 hover:border-white/20"
                          )}
                        >
                          {dateLabel}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <button 
                onClick={handleBook}
                disabled={loading || !selectedDate}
                className={cn(
                  "w-full py-5 rounded-[1.5rem] transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98]",
                  selectedDate 
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-600/20 border-none" 
                    : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Finalizing Connection...
                  </>
                ) : (
                  <>
                    {selectedDate ? `Book Session — ${selectedDate}` : 'Select a Date to Book'} <ArrowRight size={20} />
                  </>
                )}
              </button>
            </>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-10 text-center space-y-6"
            >
               <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={48} className="text-emerald-400" />
               </div>
               <h2 className="text-3xl font-bold tracking-tight text-white">Session Confirmed!</h2>
               <p className="text-gray-400 font-light max-w-sm mx-auto leading-relaxed">
                 Session booked with <span className="text-purple-400 font-medium">{mentor.name}</span> for <span className="text-white font-medium">{selectedDate}</span>. Time will be determined in chat.
               </p>
               <button 
                 onClick={onClose}
                 className="px-12 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-widest transition-colors active:scale-95"
               >
                 Close
               </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
