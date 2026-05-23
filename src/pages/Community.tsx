import React, { useState, useEffect } from "react";
import { AppLayout } from "@/src/components/layout/AppLayout";
import { 
  MessageSquare, 
  ThumbsUp, 
  Tag, 
  Plus, 
  Search,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  Users,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Code,
  Rocket,
  Flame
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthContext";

const mockProjects: any[] = [];
const mockTeams: any[] = [];

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "m ago";
  return "just now";
}

export default function Community() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Project Feed");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select(`
          id,
          title,
          content,
          post_type,
          tags,
          tech_stack,
          roles_needed,
          created_at,
          author_id,
          profiles (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (postsError || !postsData || postsData.length === 0) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      const enrichedPosts = await Promise.all(postsData.map(async (post: any) => {
        const { count: likesCount } = await supabase
          .from("post_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { data: repliesData } = await supabase
          .from("post_replies")
          .select(`
            id,
            content,
            created_at,
            author_id,
            profiles (
              full_name
            )
          `)
          .eq("post_id", post.id)
          .order("created_at", { ascending: true });

        const mappedReplies = (repliesData || []).map((r: any) => ({
          author: r.profiles?.full_name || "Community Member",
          text: r.content,
          time: formatTimeAgo(new Date(r.created_at))
        }));

        return {
          id: post.id,
          author: post.profiles?.full_name || "Community Builder",
          time: formatTimeAgo(new Date(post.created_at)),
          title: post.title,
          content: post.content,
          tags: post.tags || [],
          stack: post.tech_stack || [],
          roles: post.roles_needed || [],
          likes: likesCount || 0,
          comments: mappedReplies.length,
          replies: mappedReplies
        };
      }));

      setProjects(enrichedPosts);

      if (user) {
        const { data: userLikes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id);
        
        if (userLikes) {
          setLikedPosts(new Set(userLikes.map((l: any) => l.post_id)));
        }
      }

    } catch (err) {
      console.error("Failed to load community feed from Supabase:", err);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user, activeTab]);

  const handleToggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);

    setLikedPosts(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    setProjects(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));

    try {
      if (isLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
      } else {
        await supabase
          .from("post_likes")
          .insert({ user_id: user.id, post_id: postId });
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (isLiked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
      setProjects(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, likes: isLiked ? p.likes + 1 : p.likes - 1 };
        }
        return p;
      }));
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Co-lab <span className="text-purple-400">Projects</span></h1>
            <p className="text-gray-400 font-light">Find teams, start unofficial projects, and build together.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary p-4 px-8 flex items-center gap-3 active:scale-95 transition-all text-[10px] font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-600/20"
          >
            <Plus size={18} /> Launch Project
          </button>
        </header>

        <div className="flex items-center gap-4 border-b border-white/5 pb-4 overflow-x-auto scrollbar-hide">
          <Tab label="Project Feed" active={activeTab === "Project Feed"} onClick={() => setActiveTab("Project Feed")} />
          <Tab label="Active Teams" active={activeTab === "Active Teams"} onClick={() => setActiveTab("Active Teams")} />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "Project Feed" ? (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {isLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
              ) : projects.length > 0 ? (
                projects.map(project => (
                  <PostCard 
                    key={project.id}
                    {...project}
                    hasLiked={likedPosts.has(project.id)}
                    onToggleLike={() => handleToggleLike(project.id)}
                    onClick={() => setSelectedPost(project)}
                  />
                ))
              ) : (
                <div className="glass py-20 rounded-[3rem] border border-white/5 text-center space-y-6">
                   <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-2">
                     <MessageSquare className="text-gray-500" size={32} />
                   </div>
                   <h3 className="text-2xl text-white font-bold tracking-tight">No Projects Yet</h3>
                   <p className="text-gray-500 font-light max-w-md mx-auto leading-relaxed">There are currently no active projects. Be the first to launch a co-lab project!</p>
                   <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-4 inline-flex py-3 px-8 rounded-xl text-[10px] uppercase tracking-widest font-bold">Launch Project</button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="teams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={isLoading || (projects.filter(p => p.roles && p.roles.length > 0).length === 0) ? "block" : "grid md:grid-cols-2 gap-8"}
            >
              {isLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
              ) : (projects.filter(p => p.roles && p.roles.length > 0).length > 0) ? (
                projects.filter(p => p.roles && p.roles.length > 0).map((p, idx) => (
                   <ProjectGroupCard 
                     key={p.id}
                     name={`${p.title} Lab`} 
                     members={p.comments + 1} 
                     difficulty={p.tags.includes("Advanced") || p.stack.length > 2 ? "Advanced" : "Intermediate"}
                     stack={p.stack.join(", ")}
                     onOpenFeed={() => setActiveTab("Project Feed")}
                     desc={p.content}
                   />
                ))
              ) : (
                <div className="glass py-20 rounded-[3rem] border border-white/5 text-center space-y-6">
                   <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-2">
                     <Users className="text-gray-500" size={32} />
                   </div>
                   <h3 className="text-2xl text-white font-bold tracking-tight">No Active Teams</h3>
                   <p className="text-gray-500 font-light max-w-md mx-auto leading-relaxed">No teams have been formed yet. Launch a project with open roles to form an active team lab dynamically!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreatePostModal onClose={() => setIsModalOpen(false)} onPostCreated={fetchPosts} />
        )}
        {selectedPost && (
          <DiscussionModal post={selectedPost} onClose={() => setSelectedPost(null)} onReplyAdded={fetchPosts} />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function DiscussionModal({ post, onClose, onReplyAdded }: { post: any, onClose: () => void, onReplyAdded?: () => void }) {
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleReply = async () => {
    if (!reply.trim()) return;
    if (!user) return;
    
    setIsPosting(true);
    try {
      const { error } = await supabase
        .from("post_replies")
        .insert({
          post_id: post.id,
          author_id: user.id,
          content: reply
        });

      if (error) throw error;
      
      setIsPosting(false);
      setShowSuccess(true);
      setReply("");
      if (onReplyAdded) onReplyAdded();
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      console.error("Error adding reply:", err);
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-3xl glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl bg-[#03030b] flex flex-col max-h-[85vh]"
      >
        <div className="p-10 overflow-y-auto custom-scrollbar">
           <header className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 border border-white/10" />
                 <div>
                    <div className="text-sm font-bold text-white">{post.author}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{post.time}</div>
                 </div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
                 <X size={24} />
              </button>
           </header>

           <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">{post.title}</h2>
              <p className="text-base text-gray-300 leading-relaxed font-light">{post.content}</p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                 {post.tags.map((t: string) => (
                   <span key={t} className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-purple-400 font-bold uppercase tracking-widest border border-purple-500/10">#{t}</span>
                 ))}
              </div>
           </div>

           <div className="mt-12 space-y-8 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Discussion ({post.replies?.length || 0})</h3>
                 <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                       <ThumbsUp size={14} className="fill-purple-400/20" /> {post.likes} Likes
                    </span>
                 </div>
              </div>

              <div className="space-y-6">
                 {post.replies && post.replies.length > 0 ? (
                   post.replies.map((r: any, i: number) => (
                     <motion.div 
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.1 }}
                       key={i} 
                       className="p-6 rounded-2.5xl bg-white/5 border border-white/5 space-y-2"
                     >
                        <div className="flex items-center justify-between">
                           <span className="text-xs font-bold text-purple-400">{r.author}</span>
                           <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{r.time}</span>
                        </div>
                        <p className="text-sm text-gray-400 font-light leading-relaxed">{r.text}</p>
                     </motion.div>
                   ))
                 ) : (
                   <p className="text-xs text-gray-500 italic">No replies yet. Be the first to join the co-lab!</p>
                 )}
              </div>
           </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-white/2 backdrop-blur-md">
           <div className="relative group">
              <textarea 
                 value={reply}
                 onChange={(e) => setReply(e.target.value)}
                 placeholder="Join the discussion..." 
                 rows={1}
                 className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pr-32 text-sm font-light outline-none focus:border-purple-500/30 transition-all resize-none overflow-hidden"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <AnimatePresence>
                    {showSuccess && (
                       <motion.span 
                         initial={{ opacity: 0, x: 10 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0 }}
                         className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest"
                       >
                          Reply Added
                       </motion.span>
                    )}
                 </AnimatePresence>
                 <button 
                   onClick={handleReply}
                   disabled={isPosting || !reply.trim()}
                   className="p-3 px-6 rounded-xl bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-purple-500 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                 >
                    {isPosting ? <Loader2 size={14} className="animate-spin" /> : "Post"}
                 </button>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function PostCard({ author, time, title, content, tags, stack, roles, likes, comments, onClick, hasLiked, onToggleLike }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="glass p-10 rounded-[2.5rem] border border-white/5 space-y-8 group hover:border-purple-500/30 transition-all bg-circuit relative overflow-hidden cursor-pointer"
    >
       <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10" />
             <div>
                <div className="text-sm font-bold">{author}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{time}</div>
             </div>
          </div>
          {roles && roles.length > 0 && (
             <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[9px] font-bold text-purple-400 uppercase tracking-widest">
                Team Roles Open
             </div>
          )}
       </div>
       
       <div className="space-y-4 relative z-10">
          <h2 className="text-2xl font-bold group-hover:text-purple-400 transition-colors tracking-tight leading-tight">{title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed font-light line-clamp-2">{content}</p>
       </div>

       <div className="grid grid-cols-2 gap-4 relative z-10">
          {stack && stack.length > 0 && (
            <div className="space-y-2">
              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Tech Stack</div>
              <div className="flex flex-wrap gap-1.5">
                 {stack.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-gray-400 border border-white/5">{s}</span>
                 ))}
              </div>
            </div>
          )}
          {roles && roles.length > 0 && (
            <div className="space-y-2">
              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Roles Needed</div>
              <div className="flex flex-wrap gap-1.5">
                 {roles.map((r: string) => (
                    <span key={r} className="px-2 py-0.5 rounded-md bg-purple-500/5 text-[9px] text-purple-400 border border-purple-500/10 font-medium">{r}</span>
                 ))}
              </div>
            </div>
          )}
       </div>

       <div className="flex items-center gap-8 pt-8 border-t border-white/5 relative z-10">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike();
            }}
            className={cn(
              "flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-90",
              hasLiked ? "text-purple-400" : "text-gray-500 hover:text-purple-400"
            )}
          >
             <ThumbsUp size={18} className={hasLiked ? "fill-purple-400" : ""} /> {likes}
          </button>
          <button className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-blue-400 transition-all active:scale-90">
             <MessageSquare size={18} /> {comments}
          </button>
          <button className="ml-auto px-6 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all group-hover:border-purple-500/20">
             Join Team
          </button>
       </div>
    </motion.div>
  );
}

function CreatePostModal({ onClose, onPostCreated }: any) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [techStack, setTechStack] = useState("");
  const [rolesNeeded, setRolesNeeded] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "posting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Please fill in both the project title and description.");
      return;
    }
    if (!user) return;
    
    setStatus("posting");
    setError(null);

    try {
      const tagsArray = Array.from(new Set([
        ...techStack.split(",").map(s => s.trim()).filter(Boolean),
        "Co-lab"
      ]));
      const techArray = techStack.split(",").map(s => s.trim()).filter(Boolean);
      const rolesArray = rolesNeeded.split(",").map(s => s.trim()).filter(Boolean);

      const { error: insertError } = await supabase
        .from("community_posts")
        .insert({
          author_id: user.id,
          title,
          content,
          post_type: "feed",
          tags: tagsArray,
          tech_stack: techArray,
          roles_needed: rolesArray
        });

      if (insertError) throw insertError;
      
      setStatus("success");
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      console.error("Error creating project post:", err);
      setError(err.message || "Failed to create post. Check your schema.");
      setStatus("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl bg-[#03030b]"
      >
        <div className="p-10 space-y-8">
           {status !== "success" ? (
             <>
                <header className="flex justify-between items-center">
                   <h2 className="text-2xl font-bold tracking-tight">Launch <span className="text-purple-400">Co-lab Project</span></h2>
                   <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                      <X size={24} />
                   </button>
                </header>

                <div className="space-y-4">
                   <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Project Name..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-lg font-bold outline-none focus:border-purple-500/30 transition-all font-sans"
                   />
                   <div className="grid grid-cols-2 gap-4">
                      <input 
                         type="text" 
                         value={techStack}
                         onChange={(e) => setTechStack(e.target.value)}
                         placeholder="Tech Stack (comma separated: React, Rust)" 
                         className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-medium outline-none focus:border-purple-500/30 transition-all"
                      />
                      <input 
                         type="text" 
                         value={rolesNeeded}
                         onChange={(e) => setRolesNeeded(e.target.value)}
                         placeholder="Roles Needed (comma separated: Designer, Lead)" 
                         className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-medium outline-none focus:border-purple-500/30 transition-all"
                      />
                   </div>
                   <textarea 
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Describe your vision and who you're looking for..." 
                      className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-sm font-light outline-none focus:border-purple-500/30 transition-all resize-none"
                   />
                </div>

                {error && (
                  <p className="text-xs text-red-400 font-bold px-2">{error}</p>
                )}

                <div className="flex items-center justify-between border-t border-white/5 pt-8">
                   <div className="flex gap-4 text-gray-500 text-[10px] font-bold uppercase tracking-widest italic opacity-50">
                      Collaborative & Unofficial
                   </div>
                   <button 
                     onClick={handlePost}
                     disabled={status === "posting"}
                     className="btn-primary px-12 py-4 rounded-[1.5rem] flex items-center gap-3 disabled:opacity-50"
                   >
                      {status === "posting" ? (
                        <><Loader2 size={18} className="animate-spin" /> Launching...</>
                      ) : (
                        <><Rocket size={18} /> Launch Project</>
                      )}
                   </button>
                </div>
             </>
           ) : (
             <div className="py-12 flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                   <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl font-bold tracking-tight">Project Launched!</h2>
                   <p className="text-gray-400 font-light max-w-sm mx-auto leading-relaxed">
                     Your co-lab project is now live. People can now see your stack and request to join your team.
                   </p>
                </div>
                <button 
                  onClick={onClose}
                  className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                   Return to Feed
                </button>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}

function ProjectGroupCard({ name, members, desc, stack, difficulty, onOpenFeed }: any) {
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMember) {
      onOpenFeed();
      return;
    }
    
    setIsJoining(true);
    setTimeout(() => {
      setIsJoining(false);
      setIsMember(true);
    }, 1200);
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6 group hover:border-purple-500/30 transition-all bg-circuit h-fit"
    >
       <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
             <Code className="text-purple-400" size={24} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> {members} Working
            </div>
            {difficulty && (
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-md",
                difficulty === "Advanced" ? "text-orange-400 bg-orange-400/10" : "text-blue-400 bg-blue-400/10"
              )}>
                {difficulty}
              </span>
            )}
          </div>
       </div>

       <div className="space-y-3">
          <h3 className="text-lg font-bold tracking-tight group-hover:text-purple-400 transition-colors uppercase tracking-[0.1em]">{name}</h3>
          <p className="text-xs text-gray-400 leading-relaxed font-light line-clamp-2">{desc}</p>
          
          {stack && (
            <div className="pt-2">
              <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-2 opacity-50">Core Lab Stack</div>
              <div className="text-[10px] font-medium text-gray-300 font-mono italic">{stack}</div>
            </div>
          )}
       </div>

       <button 
         onClick={handleJoin}
         disabled={isJoining}
         className={cn(
           "w-full py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] border active:scale-[0.98]",
           isMember 
             ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" 
             : "bg-white/5 border-white/10 hover:bg-white/10"
         )}
       >
          {isJoining ? (
            <span className="flex items-center gap-2">
               <Loader2 size={14} className="animate-spin text-purple-400" />
               Joining Lab...
            </span>
          ) : isMember ? (
            <span className="flex items-center gap-2">
               <CheckCircle2 size={14} className="text-emerald-400" />
               ✓ Joined Team
            </span>
          ) : (
            <>Join Project Lab <ArrowRight size={14} /></>
          )}
       </button>
    </motion.div>
  );
}

function Tab({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-7 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 active:scale-95",
        active ? "bg-purple-500 text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] border-transparent" : "text-gray-500 hover:text-white border border-white/5 hover:border-white/10 bg-white/5"
      )}
    >
      {label}
    </button>
  );
}
