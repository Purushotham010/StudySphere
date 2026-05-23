import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AppLayout } from "@/src/components/layout/AppLayout";
import { 
  Zap, 
  Users, 
  Brain, 
  Rocket, 
  ArrowRight, 
  Calendar,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  X,
  Loader2,
  Video
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [showLearningToast, setShowLearningToast] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const navigate = useNavigate();

  const [growthPoints, setGrowthPoints] = useState(0);
  const [activeConnections, setActiveConnections] = useState(0);
  const [recommendedCount, setRecommendedCount] = useState(0);
  const [learningStreak, setLearningStreak] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const userName = profile?.full_name && profile.full_name !== "New Builder" 
    ? profile.full_name 
    : user?.email 
      ? user.email.split("@")[0] 
      : "Builder";

  const fetchSessions = async () => {
    if (!user) return;
    try {
      const localBookedStr = localStorage.getItem("studysphere_bookings");
      const localBooked = localBookedStr ? JSON.parse(localBookedStr) : [];

      const { data, error } = await supabase
        .from("mentor_sessions")
        .select(`
          id,
          title,
          session_time,
          session_type,
          status,
          mentor_id,
          student_id
        `)
        .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
        .order("session_time", { ascending: true });

      if (error) {
        console.warn("Using fallback empty array for sessions:", error);
        setSessions(localBooked);
      } else {
        // Resolve the OTHER person's name
        const sessionWithNames = await Promise.all((data || []).map(async (s: any) => {
          let displayName = "Student/Mentor";
          const otherId = s.mentor_id === user.id ? s.student_id : s.mentor_id;

          if (otherId === "fedd5163-9cf1-4781-975c-7c60a41acf16") {
            displayName = "David Chen";
          } else if (otherId) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", otherId)
              .single();
            if (prof?.full_name) {
              displayName = prof.full_name;
            }
          }

          return {
            id: s.id,
            title: s.title,
            time: s.session_time,
            mentor: displayName,
            type: s.session_type,
            color: s.session_type === "Review" ? "purple" : s.session_type === "Practice" ? "blue" : "indigo"
          };
        }));
        setSessions([...localBooked, ...sessionWithNames]);
      }
    } catch (err) {
      console.error("Error loading dashboard sessions:", err);
      try {
        const localBookedStr = localStorage.getItem("studysphere_bookings");
        setSessions(localBookedStr ? JSON.parse(localBookedStr) : []);
      } catch (e) {
        setSessions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2);

      if (error) throw error;
      setOpportunities(data || []);
    } catch (err) {
      try {
        const local = localStorage.getItem("studysphere_opportunities");
        if (local) {
          setOpportunities(JSON.parse(local).slice(0, 2));
        } else {
          setOpportunities([]);
        }
      } catch (e) {
        setOpportunities([]);
      }
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      // 1. Get growth points and streak from user profile
      const { data: prof, error: profError } = await supabase
        .from("profiles")
        .select("growth_points, streak_days")
        .eq("id", user.id)
        .single();

      if (!profError && prof) {
        setGrowthPoints(prof.growth_points || 0);
        setLearningStreak(prof.streak_days || 0);
      }

      // 2. Count active accepted connections
      const { count: connCount, error: connError } = await supabase
        .from("connections")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (!connError && connCount !== null) {
        setActiveConnections(connCount);
      }

      // 3. Count total opportunities
      const { count: oppCount, error: oppError } = await supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true });

      if (!oppError && oppCount !== null) {
        setRecommendedCount(oppCount);
      }
    } catch (err) {
      console.error("Failed to load real-time statistics:", err);
    }
  };

  const fetchPendingRequests = async () => {
    if (!user) return;
    try {
      // Need to join with profiles to get the requester's name
      // If profiles!connections_requester_id_fkey doesn't work, we'll fetch manually
      const { data, error } = await supabase
        .from("connections")
        .select(`id, requester_id, status`)
        .eq("recipient_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      
      if (data && data.length > 0) {
        const requesterIds = data.map(r => r.requester_id).filter(id => id && id.length > 20); // Ensure valid UUIDs only
        
        if (requesterIds.length > 0) {
          const { data: profs } = await supabase.from("profiles").select("id, full_name, role").in("id", requesterIds);
          
          const richData = data.map(req => {
            const prof = profs?.find(p => p.id === req.requester_id);
            return {
              id: req.id,
              requester_id: req.requester_id,
              name: prof?.full_name || "A Student",
              role: prof?.role || "learner"
            };
          });
          setPendingRequests(richData);
        } else {
          setPendingRequests([]);
        }
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    }
  };

  const handleConnectionResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status })
        .eq("id", connectionId);
        
      if (error) throw error;
      
      // Remove from pending UI
      setPendingRequests(prev => prev.filter(r => r.id !== connectionId));
      
      // If accepted, increment active connections
      if (status === 'accepted') {
        setActiveConnections(prev => prev + 1);
      }
    } catch (err) {
      console.error(`Failed to ${status} connection:`, err);
    }
  };

  React.useEffect(() => {
    let active = true;
    const failsafe = setTimeout(() => {
      if (active) {
        console.warn("Dashboard failsafe triggered: forcing loading to false.");
        setIsLoading(false);
      }
    }, 2500);

    if (user) {
      Promise.all([
        fetchSessions(),
        fetchDashboardOpportunities(),
        fetchStats(),
        fetchPendingRequests()
      ]).finally(() => {
        clearTimeout(failsafe);
        if (active) {
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
      clearTimeout(failsafe);
    }

    return () => {
      active = false;
      clearTimeout(failsafe);
    };
  }, [user]);

  const toggleSession = async (sessionId: string) => {
    if (completedSessions.includes(sessionId)) {
      setCompletedSessions(completedSessions.filter(i => i !== sessionId));
    } else {
      setCompletedSessions([...completedSessions, sessionId]);
      try {
        await supabase
          .from("mentor_sessions")
          .update({ status: 'completed' })
          .eq("id", sessionId);
      } catch (err) {
        console.error("Failed to complete session:", err);
      }
    }
  };

  const nextSession = sessions[0];
  const welcomeSub = nextSession 
    ? `Your next study session (${nextSession.title}) with ${nextSession.mentor} is scheduled for ${new Date(nextSession.time).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} at ${new Date(nextSession.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
    : "Ready to accelerate your learning? Book a 1-on-1 collaborative session with one of our expert mentors today!";

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Welcome Banner */}
        <header className="relative p-12 rounded-[3rem] overflow-hidden glass-glow border border-white/5 bg-circuit group">
            <div className="relative z-10 space-y-6">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-5xl font-bold tracking-tight"
              >
                Welcome back, <span className="glow-text">{userName}</span>
              </motion.h1>
              <p className="text-gray-400 max-w-xl text-lg font-light leading-relaxed">
                {welcomeSub}
              </p>
              <div className="flex items-center gap-6 pt-2">
                <button 
                  onClick={() => navigate("/chat?peer=ai-mentor")}
                  className="btn-primary flex items-center gap-3 px-8 text-white border-none active:scale-[0.98] duration-200"
                >
                    Continue Learning <ArrowRight size={18} />
                </button>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/5 bg-white/5 backdrop-blur-md">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" /> Online
                </div>
              </div>
            </div>
        </header>

        {/* Incoming Connection Requests */}
        {pendingRequests.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[2.5rem] glass border border-purple-500/20 bg-purple-500/5 shadow-[0_0_30px_rgba(168,85,247,0.1)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20"><Users size={120} className="text-purple-400" /></div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                Connection Requests ({pendingRequests.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#03030b]/60 border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                        {req.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{req.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{req.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleConnectionResponse(req.id, 'rejected')}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                      <button 
                        onClick={() => handleConnectionResponse(req.id, 'accepted')}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 hover:bg-purple-500 hover:text-white text-purple-400 transition-colors"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={<Users className="text-blue-400" />} label="Active Connections" value={activeConnections.toString()} change="Peers in your network" />
            <StatCard icon={<Calendar className="text-purple-400" />} label="Upcoming Sessions" value={sessions.length.toString()} change="Mentorship calls booked" />
            <StatCard icon={<Briefcase className="text-indigo-400" />} label="Live Opportunities" value={recommendedCount.toString()} change="Hackathons & roles available" />
        </div>

        <div className="max-w-5xl mx-auto space-y-16">
            {/* Main Content Area */}
            <div className="space-y-16">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold flex items-center gap-4">
                        <Calendar className="text-purple-400" size={28} /> Upcoming Sessions
                      </h2>
                      <Link to="/roadmap" className="text-xs text-purple-400 font-bold uppercase tracking-widest hover:text-purple-300 transition-colors">Learning Roadmap</Link>
                  </div>
                  <div className="space-y-4">
                      {isLoading ? (
                        <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-purple-500" size={32} /></div>
                      ) : sessions.length > 0 ? (
                        sessions.map(s => (
                          <SessionItem 
                            key={s.id}
                            id={s.id}
                            title={s.title} 
                            time={s.time} 
                            mentor={s.mentor} 
                            type={s.type}
                            color={s.color}
                            isCompleted={completedSessions.includes(s.id)}
                            onComplete={() => toggleSession(s.id)}
                          />
                        ))
                      ) : (
                        <div className="glass p-10 rounded-3xl border border-white/5 text-center space-y-4">
                           <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2">
                             <Calendar className="text-gray-500" size={28} />
                           </div>
                           <h3 className="text-lg text-white font-bold tracking-tight">No Upcoming Sessions</h3>
                           <p className="text-sm text-gray-500 font-light max-w-xs mx-auto leading-relaxed">You have no study sessions scheduled. Book a mentor to get started.</p>
                           <Link to="/mentors" className="btn-primary mt-4 inline-flex py-3 px-8 rounded-xl text-[10px] uppercase tracking-widest font-bold">Find a Mentor</Link>
                        </div>
                      )}
                  </div>
                </div>
 
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold flex items-center gap-4">
                        <Rocket className="text-blue-400" size={28} /> Recommended Opportunities
                      </h2>
                      <Link to="/opportunities" className="text-xs text-purple-400 font-bold uppercase tracking-widest hover:text-purple-300 transition-colors">View All Opportunities</Link>
                  </div>
                  <div className={isLoading || opportunities.length === 0 ? "block" : "grid md:grid-cols-2 gap-8"}>
                      {isLoading ? (
                         <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
                      ) : opportunities.length > 0 ? (
                        opportunities.map((o, i) => (
                          <OpportunityCard 
                            key={i}
                            title={o.title} 
                            company={o.company} 
                            tags={o.tags} 
                            deadline={o.deadline} 
                          />
                        ))
                      ) : (
                        <div className="glass p-10 rounded-3xl border border-white/5 text-center space-y-4">
                           <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2">
                             <Rocket className="text-gray-500" size={28} />
                           </div>
                           <h3 className="text-lg text-white font-bold tracking-tight">No Recommendations Yet</h3>
                           <p className="text-sm text-gray-500 font-light max-w-xs mx-auto leading-relaxed">Explore the community to get personalized opportunity matches.</p>
                           <Link to="/opportunities" className="btn-primary mt-4 inline-flex py-3 px-8 rounded-xl text-[10px] uppercase tracking-widest font-bold">Explore Opportunities</Link>
                        </div>
                      )}
                  </div>
                </div>
            </div>
        </div>
      </div>
 
       {/* Interactive Toast */}
      <AnimatePresence>
        {showLearningToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 glass-glow p-4 rounded-2xl border border-purple-500/30 flex items-center gap-4 shadow-2xl backdrop-blur-3xl"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
               <Brain size={20} className="text-purple-400 animate-pulse" />
            </div>
            <div className="pr-12">
               <div className="text-sm font-bold text-white">Resuming 'Advanced React Patterns'</div>
               <div className="text-[10px] text-gray-400 uppercase tracking-widest">Redirecting to your workspace...</div>
            </div>
            <button 
              onClick={() => setShowLearningToast(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, change }: { icon: React.ReactNode, label: string, value: string, change: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass p-8 rounded-[2rem] border border-white/5 space-y-3 relative overflow-hidden group"
    >
       <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500">
         {icon}
       </div>
       <div className="p-3 bg-white/5 rounded-2xl w-fit group-hover:bg-purple-500/10 transition-colors">
         {icon}
       </div>
       <div className="space-y-1">
         <div className="text-3xl font-bold tracking-tight">{value}</div>
         <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">{label}</div>
         <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{change}</div>
       </div>
    </motion.div>
  );
}

function SessionItem({ id, title, time, mentor, type, color, isCompleted, onComplete }: any) {
  const navigate = useNavigate();
  const colorMap: any = {
    purple: "border-purple-500/30 text-purple-400 bg-purple-400/5 shadow-[0_0_10px_rgba(139,92,246,0.1)]",
    blue: "border-blue-500/30 text-blue-400 bg-blue-400/5 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
    indigo: "border-indigo-500/30 text-indigo-400 bg-indigo-400/5 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
  };

  const dateObj = new Date(time);
  const isInvalidDate = isNaN(dateObj.getTime());
  const month = isInvalidDate ? "MAY" : dateObj.toLocaleString([], { month: "short" }).toUpperCase();
  const day = isInvalidDate ? "18" : dateObj.getDate();
  let formattedTime = isInvalidDate ? time : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (formattedTime === "12:00 PM") formattedTime = "Time TBD in Chat";

  return (
    <div className={cn(
      "glass p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all cursor-pointer",
      isCompleted && "opacity-50 grayscale scale-[0.98]"
    )}>
       <div className="flex items-center gap-6">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className={cn(
              "w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-xs uppercase border border-white/5 transition-all",
              isCompleted ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5"
            )}
          >
             {isCompleted ? (
               <CheckCircle2 className="text-emerald-400" size={24} />
             ) : (
               <>
                 <span className="text-gray-500 text-[8px] tracking-widest">{month}</span>
                 <span className="text-white text-lg">{day}</span>
               </>
             )}
          </button>
          <div>
            <h4 className={cn(
              "font-bold transition-all",
              isCompleted ? "text-gray-500 line-through" : "group-hover:text-purple-400"
            )}>{title}</h4>
            <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-1">
               <span className="font-medium">{formattedTime}</span>
               <span className="opacity-30">•</span>
               <span className="text-gray-400 font-bold uppercase tracking-widest">{mentor}</span>
            </div>
          </div>
       </div>
       <div className="flex items-center gap-3">
         {!isCompleted && type === "Live Call" && (
           <button 
             onClick={(e) => {
               e.stopPropagation();
               navigate(`/call/${id}`);
             }}
             className="px-4 py-1.5 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold uppercase tracking-widest hover:bg-purple-600/40 transition-all flex items-center gap-2"
           >
             <Video size={12} /> Join Call
           </button>
         )}
         <div className={cn(
           `px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all`,
           isCompleted ? "border-white/10 text-gray-600 bg-transparent shadow-none" : colorMap[color]
         )}>
            {isCompleted ? "Completed" : type}
         </div>
       </div>
    </div>
  );
}

function OpportunityCard({ title, company, tags, deadline }: { key?: React.Key, title: string, company: string, tags: string[], deadline: string }) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <>
      <div 
        onClick={() => setShowDetails(true)}
        className="glass p-8 rounded-3xl border border-white/5 space-y-6 hover:border-purple-500/30 group transition-all relative overflow-hidden bg-circuit cursor-pointer"
      >
         <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-bold group-hover:text-purple-400 transition-colors tracking-tight">{title}</h4>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">{company}</p>
            </div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 px-3 py-1 bg-blue-500/5 rounded-full border border-blue-500/10">
              <Zap size={12} className="fill-blue-400" /> {formatDeadline(deadline)}
            </div>
         </div>
         <div className="flex gap-2">
            {tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 text-[10px] text-gray-400 font-bold uppercase tracking-widest border border-white/5">#{tag}</span>
            ))}
         </div>
         <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
              className="py-3.5 rounded-2xl border border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              Details <ExternalLink size={12} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.open('https://example.com', '_blank');
              }}
              className="py-3.5 rounded-2xl border bg-purple-600/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              Go to Resource <ExternalLink size={12} />
            </button>
         </div>
      </div>

      <AnimatePresence>
        {showDetails && (
          <OpportunityDetailsModal 
            title={title}
            company={company}
            tags={tags}
            deadline={deadline}
            onClose={() => setShowDetails(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

function OpportunityDetailsModal({ title, company, tags, deadline, onClose }: any) {
  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl glass-glow rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl bg-[#03030b]"
      >
        <div className="p-10 space-y-8">
           <header className="flex justify-between items-start">
              <div className="space-y-2">
                 <div className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.3em]">{company}</div>
                 <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X size={24} className="text-gray-500" />
              </button>
           </header>

           <div className="flex flex-wrap gap-3">
              {tags.map((t: string) => (
                <span key={t} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-gray-400 tracking-widest uppercase">#{t}</span>
              ))}
              <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 tracking-widest uppercase flex items-center gap-2">
                <Zap size={12} className="fill-blue-400" /> {formatDeadline(deadline)}
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-3">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Resource Description</h4>
                 <p className="text-sm text-gray-400 leading-relaxed font-light">
                    This program from {company} is a highly recommended resource for students looking to grow their skills in {tags.join(", ")}. It offers mentorship, hands-on experience, and networking opportunities.
                 </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                 <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Eligibility</div>
                 <div className="text-[10px] font-bold text-white uppercase tracking-widest">Active Students</div>
              </div>
           </div>

           <div className="pt-4 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all shadow-xl"
              >
                 Go Back
              </button>
              <button 
                onClick={() => window.open('https://example.com', '_blank')}
                className="flex-[2] btn-primary py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
              >
                Open Official Link <ExternalLink size={16} />
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}




