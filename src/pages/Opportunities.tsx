import React, { useState, useEffect } from "react";
import { AppLayout } from "@/src/components/layout/AppLayout";
import { 
  Briefcase, 
  Zap, 
  Globe, 
  ExternalLink,
  CheckCircle2,
  Loader2,
  X,
  Plus,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

const DEFAULT_OPPORTUNITIES = [
  {
    id: 'fedd5163-9cf1-4781-975c-7c60a41acf16',
    title: 'Software Engineering Intern',
    company: 'Google',
    location: 'Global / Remote',
    deadline: '2026-05-25T09:20:00Z',
    tags: [ 'Internship', 'Engineering' ],
    logo: 'G',
    description: 'Discover high-impact systems engineering and frontend software engineering work at scale.',
    external_url: 'https://careers.google.com'
  },
  {
    id: '594c06a9-cb6e-4780-8235-ea482a90d19c',
    title: 'Product Design Fellow',
    company: 'Figma',
    location: 'San Francisco',
    deadline: '2026-05-28T09:20:00Z',
    tags: [ 'Fellowship', 'Design' ],
    logo: 'F',
    description: 'Work closely with core product teams to craft the future of interactive visual environments.',
    external_url: 'https://figma.com/careers'
  },
  {
    id: 'fd9376ed-ec01-4d29-adf5-c2643cc56bb9',
    title: 'Open Source Contributor',
    company: 'Linux Foundation',
    location: 'Remote',
    deadline: '2026-06-10T09:20:00Z',
    tags: [ 'Grant', 'Open Source' ],
    logo: 'L',
    description: 'Get funded grants to contribute to system-level open-source foundations.',
    external_url: 'https://linuxfoundation.org'
  }
];

export default function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback: If table doesn't exist yet, fetch from localStorage to keep it fully live locally
        const local = localStorage.getItem("studysphere_opportunities");
        if (local) {
          setOpportunities(JSON.parse(local));
        } else {
          setOpportunities(DEFAULT_OPPORTUNITIES);
        }
        return;
      }
      setOpportunities(data && data.length > 0 ? data : DEFAULT_OPPORTUNITIES);
    } catch (err) {
      console.error("Error fetching opportunities:", err);
      const local = localStorage.getItem("studysphere_opportunities");
      if (local) {
        setOpportunities(JSON.parse(local));
      } else {
        setOpportunities(DEFAULT_OPPORTUNITIES);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const failsafe = setTimeout(() => {
      if (active) {
        console.warn("Opportunities failsafe triggered: forcing loading to false.");
        setIsLoading(false);
        if (opportunities.length === 0) setOpportunities(DEFAULT_OPPORTUNITIES);
      }
    }, 2500);

    fetchOpportunities().finally(() => {
      clearTimeout(failsafe);
    });

    return () => {
      active = false;
      clearTimeout(failsafe);
    };
  }, []);

  const handlePostOpportunity = async (title: string, company: string, location: string, tags: string[], deadline: string, link: string) => {
    try {
      // 1. Try saving to Supabase opportunities table
      const { error } = await supabase
        .from("opportunities")
        .insert({
          title,
          company,
          location,
          tags,
          deadline,
          external_url: link,
          created_by: user?.id,
          logo: company.charAt(0).toUpperCase()
        });

      if (error) throw error;
      fetchOpportunities();
      setIsPostModalOpen(false);
    } catch (err) {
      console.warn("Supabase insert failed (opportunities table might not exist yet). Saving locally:", err);
      // Fallback: Save to localStorage so it is fully persistent across page loads!
      const newOpp = {
        id: Date.now().toString(),
        title,
        company,
        location,
        tags,
        deadline,
        link,
        logo: company[0].toUpperCase()
      };
      
      const current = [...opportunities, newOpp];
      localStorage.setItem("studysphere_opportunities", JSON.stringify(current));
      setOpportunities(current);
      setIsPostModalOpen(false);
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    try {
      const { error } = await supabase.from("opportunities").delete().eq("id", id);
      if (error) throw error;
      setOpportunities(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error("Failed to delete opportunity:", err);
      const local = localStorage.getItem("studysphere_opportunities");
      if (local) {
        const parsed = JSON.parse(local).filter((o: any) => o.id !== id);
        localStorage.setItem("studysphere_opportunities", JSON.stringify(parsed));
        setOpportunities(parsed);
      }
    }
  };

  const filteredOpportunities = opportunities.filter(o => 
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-16 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">Opportunities</h1>
            <p className="text-gray-500 text-lg font-light max-w-2xl leading-relaxed">Discover internships, hackathons, fellowships, and opportunities shared across the student network in real time.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative group w-full sm:w-64">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles, companies or tags..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 outline-none focus:border-purple-500/30 text-sm font-medium transition-all"
              />
            </div>
            
            <button 
              onClick={() => setIsPostModalOpen(true)}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 active:scale-95 duration-200"
            >
              <Plus size={18} /> Share Opportunity
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
        ) : filteredOpportunities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOpportunities.map((o) => (
              <OpportunityCard 
                key={o.id} 
                {...o} 
                currentUserId={user?.id}
                onDelete={() => handleDeleteOpportunity(o.id)}
              />
            ))}
          </div>
        ) : (
          <div className="glass py-20 rounded-[3rem] border border-white/5 text-center space-y-6">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-2">
              <Briefcase className="text-gray-500" size={32} />
            </div>
            <h3 className="text-2xl text-white font-bold tracking-tight">No Opportunities Found</h3>
            <p className="text-gray-500 font-light max-w-md mx-auto leading-relaxed">
              {searchQuery ? `We couldn't find any opportunities matching "${searchQuery}".` : "Be the first to share an internship, fellowship, or hackathon opportunity with your peers!"}
            </p>
            <button 
              onClick={() => {
                if (searchQuery) setSearchQuery("");
                else setIsPostModalOpen(true);
              }} 
              className="btn-primary mt-4 inline-flex py-3 px-8 rounded-xl text-[10px] uppercase tracking-widest font-bold"
            >
              {searchQuery ? "Clear Search" : "Share Opportunity"}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPostModalOpen && (
          <PostOpportunityModal 
            onClose={() => setIsPostModalOpen(false)}
            onSave={handlePostOpportunity}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function OpportunityCard({ id, title, company, location, tags, deadline, logo, link, external_url, created_by, currentUserId, onDelete }: any) {
  const [showDetails, setShowDetails] = useState(false);
  const visualLogo = logo || company[0].toUpperCase();
  const targetLink = external_url || link || "https://example.com";

  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <>
      <motion.div 
        whileHover={{ y: -8 }}
        onClick={() => setShowDetails(true)}
        className="glass p-10 rounded-[3rem] border border-white/5 space-y-8 group hover:border-purple-500/30 transition-all relative overflow-hidden bg-circuit h-fit cursor-pointer"
      >
        <div className="flex justify-between items-start relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#03030b] border border-white/10 flex items-center justify-center font-bold text-3xl group-hover:scale-110 transition-transform shadow-2xl group-hover:shadow-purple-500/20">
            <span className="glow-text text-white">{visualLogo}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentUserId === created_by && created_by && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2.5 rounded-xl border bg-white/5 border-white/5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all active:scale-90"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="relative z-10 space-y-2">
          <h3 className="text-xl font-bold group-hover:text-purple-400 transition-colors tracking-tight leading-tight truncate">{title}</h3>
          <p className="text-sm text-gray-500 font-medium flex items-center gap-3">
            <span className="text-gray-300 font-bold">{company}</span>
            <span className="opacity-10 font-black">|</span>
            <span className="flex items-center gap-1.5"><Globe size={12} className="text-purple-500/50" /> {location}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 relative z-10">
          {tags.map((t: string) => (
            <span key={t} className="px-3 py-1 rounded-lg bg-white/5 text-[9px] text-gray-500 font-bold uppercase tracking-widest border border-white/5 group-hover:border-purple-500/20 transition-colors">#{t}</span>
          ))}
        </div>

        <div className="space-y-4 pt-8 border-t border-white/5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={12} className="fill-blue-400 animate-pulse shadow-glow" /> {formatDeadline(deadline)}
            </div>
            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
              Source: <span className="text-gray-400">Student</span>
            </div>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(true);
            }}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 hover:text-purple-400 transition-all active:scale-[0.98]"
          >
            Explore Program <ExternalLink size={14} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <OpportunityDetailsModal 
            title={title}
            company={company}
            tags={tags}
            deadline={deadline}
            logo={visualLogo}
            link={link}
            onClose={() => setShowDetails(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

function OpportunityDetailsModal({ title, company, tags, deadline, logo, link, external_url, onClose }: any) {
  const targetLink = external_url || link || "https://example.com";
  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl glass rounded-[3.5rem] border border-white/10 overflow-hidden shadow-2xl bg-[#03030b]"
      >
        <div className="p-12 space-y-10 max-h-[90vh] overflow-y-auto scrollbar-hide">
          <header className="flex justify-between items-start">
            <div className="flex gap-6 items-center">
              <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-bold shadow-2xl">
                <span className="glow-text text-white">{logo}</span>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.4em]">{company}</div>
                <h2 className="text-3xl font-bold tracking-tight text-white">{title}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors">
              <X size={28} className="text-gray-500" />
            </button>
          </header>

          <div className="flex flex-wrap gap-3">
            {tags.map((t: string) => (
              <span key={t} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-bold text-gray-400 tracking-widest uppercase">#{t}</span>
            ))}
            <div className="px-5 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-400 tracking-widest uppercase flex items-center gap-2">
              <Zap size={14} className="fill-blue-400" /> {formatDeadline(deadline)}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Program Overview</h4>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                This student-shared opportunity from {company} is open for applications. Ensure you review the official prerequisites and deadlines before submitting your registration.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Highlights</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5 space-y-2">
                  <div className="text-purple-400 font-bold text-sm tracking-tight">Open Application</div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Direct links to official career pages or portals.</p>
                </div>
                <div className="p-5 rounded-[1.5rem] bg-white/5 border border-white/5 space-y-2">
                  <div className="text-blue-400 font-bold text-sm tracking-tight">Verified Source</div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Shared and verified within our academic community.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-5 rounded-[2rem] border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all shadow-xl"
            >
              Go Back
            </button>
            <button 
              onClick={() => window.open(targetLink.startsWith("http") ? targetLink : `https://${targetLink}`, '_blank')}
              className="flex-[2] btn-primary py-5 rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border-none"
            >
              Visit Official Source <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PostOpportunityModal({ onClose, onSave }: { onClose: () => void; onSave: (title: string, company: string, location: string, tags: string[], deadline: string, link: string) => void }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [deadline, setDeadline] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !location.trim() || !deadline.trim() || !link.trim()) {
      setError("Please fill out all mandatory fields.");
      return;
    }
    const tags = tagsInput
      ? tagsInput.split(",").map(t => t.trim()).filter(Boolean)
      : ["Career", "Opportunity"];
    onSave(title.trim(), company.trim(), location.trim(), tags, deadline.trim(), link.trim());
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl bg-[#03030b]"
      >
        <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
          <header className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">Share <span className="text-purple-400">Opportunity</span></h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Opportunity Title</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Frontend Engineer Intern"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-purple-500/30 transition-all placeholder:text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Company</label>
                <input 
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Google"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-purple-500/30 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Location</label>
                <input 
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote, SF, Bangalore"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-purple-500/30 transition-all placeholder:text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Deadline</label>
                <input 
                  type="text"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="e.g. Apply by May 25, 3d left"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-purple-500/30 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Tags (Comma-separated)</label>
              <input 
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Internship, Remote, React"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-purple-500/30 transition-all placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Official Application Link</label>
              <input 
                type="text"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="e.g. https://careers.company.com/job/123"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-purple-500/30 transition-all placeholder:text-gray-700"
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
              className="flex-[2] btn-primary py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.25)] border-none"
            >
              Share Opportunity
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
