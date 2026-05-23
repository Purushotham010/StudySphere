import React, { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/src/components/layout/AppLayout";
import { Send, Brain, Sparkles, User, Globe, Code, Loader2, ArrowLeft, ShieldCheck, CheckCircle2, MessageSquare, Clock, Check, Video } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { supabase } from "@/src/lib/supabase";
import { useNavigate } from "react-router-dom";

interface Message {
  role: 'user' | 'ai';
  text: string;
  status?: 'sending' | 'sent';
}

interface Peer {
  id: string;
  name: string;
  role: string;
  skills: string[];
  bio: string;
  avatarText?: string;
  initialMsg?: string;
}

const SEED_PEERS: Peer[] = [
  {
    id: "fedd5163-9cf1-4781-975c-7c60a41acf16",
    name: "David Chen",
    role: "Senior Engineering Guide @ Google",
    skills: ["System Design", "Rust", "TypeScript", "React"],
    bio: "Passionate about helping students master robust architecture design, scale systems, and navigate high-caliber career options.",
    avatarText: "DC",
    initialMsg: "Hey there! Happy to help. What specific challenges are you facing with your study roadmap?"
  },
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
    name: "Elena Rostova",
    role: "Product Design Principal @ Figma",
    skills: ["Framer Motion", "UI/UX", "Product Design", "Figma"],
    bio: "Let's craft experiences that wow. I guide aspiring designers on UI architecture, motion frameworks, and interactive portfolio building.",
    avatarText: "ER",
    initialMsg: "Let's design something incredible! Got any UI/UX or motion design questions?"
  },
  {
    id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    name: "Marcus Vance",
    role: "Core Developer @ Linux Foundation",
    skills: ["Linux Kernel", "C++", "Open Source", "Algorithms"],
    bio: "Academic guide specializing in low-level systems programming, operating system kernels, and high-performance computation.",
    avatarText: "MV",
    initialMsg: "Hello! Let's dive deep into systems programming or algorithm optimizations. What are you building?"
  },
  {
    id: "1",
    name: "Aarav Mehta",
    role: "Frontend Engineer & Learner",
    skills: ["React", "TailwindCSS", "Frontend Architecture"],
    bio: "Looking to level up my backend engineering skills! In return, I can help you build stunning, fluid UI animations and responsive designs.",
    avatarText: "AM",
    initialMsg: "Hey there! I saw we connected on the Skill Exchange. I'd love to learn from you and help you with React or Tailwind!"
  },
  {
    id: "2",
    name: "Sophia Martinez",
    role: "Data Scientist & Python Dev",
    skills: ["Algorithms", "Python", "Data Science"],
    bio: "Can help with technical interview prep, Python algorithms, and ML foundations. I want to improve my frontend design aesthetics.",
    avatarText: "SM",
    initialMsg: "Hi! Excited to connect on the Skill Exchange. Let's trade Python/algorithms for Framer Motion or UX designs!"
  },
  {
    id: "3",
    name: "Liam O'Connor",
    role: "Systems Programmer & Learner",
    skills: ["Rust CLI tools", "WebAssembly", "Go"],
    bio: "Systems engineering enthusiast looking to understand web framework state management and advanced TypeScript features.",
    avatarText: "LO",
    initialMsg: "Hello! Let's swap some Rust/Go knowledge for React Patterns or advanced TypeScript!"
  }
];

const SIMULATED_RESPONSES: any = {
  "roadmap": "Based on your current profile, here's a 3-month roadmap for Rust:\n\n1. **Month 1: Fundamentals** - Focus on Ownership, Borrowing, and Enums.\n2. **Month 2: Project Build** - Create a CLI tool utilizing 'clap' and 'serde'.\n3. **Month 3: Advanced** - Dive into Async Rust and Trait Objects.",
  "resume": "I've analyzed your resume manifest. To attract Stripe's recruiters, I recommend emphasizing your 'System Design' experience and adding a quantitative achievement to your 'Framer Motion' project (e.g., 'Optimized render performance by 40%').",
  "groups": "There are 3 high-signal project groups matching your 'Engineering' interests:\n\n* **Rust-Ledger**: An open-source fintech toolkit.\n* **VibeUI**: A collaborative motion library for React.\n* **SkyLink**: A peer-to-peer student networking protocol.",
  "default": "That's a great question! As your StudySphere AI Mentor, I specialize in building learning roadmaps, study plans, coding help, interview prep, and project guidelines. Would you like me to construct a custom roadmap or review a project architecture with you?"
};

const getSystemPrompt = (chatId: string, peer: Peer | null) => {
  if (chatId === "ai-mentor" || !peer) {
    return `You are the StudySphere AI Mentor, a high-caliber collaborative learning and career engineering guide. 
Your core priorities are:
- Roadmap Generation: Formulate detailed, stage-by-stage learning roadmaps for technical and non-technical topics.
- Study Planning: Construct highly effective routines, pomodoro structures, and study schedules.
- Interview Prep: Offer professional mock interview questions, technical debugging exercises, and optimization tips.
- Coding Help: Solve syntax bugs, explain algorithms clearly, and promote system design principles.
- Student Productivity: Inspire focus strategies, streaks, and gamified growth.
- Project Guidance: Consult on database architecture, stack selections, API design, and feature roadmaps.
- Mentor Recommendations: Suggest collaborative peer-matching and network building strategies.
- Resume Improvement: Suggest power-verbs, quantifiable metrics, and impact-driven experience logs.
- General Student Support: Assist with academic motivation, stress reduction, and study tips.

Always remain generally helpful, polite, and encouraging. Structure your responses with clear markdown headers, bold items, code blocks, or markdown tables where suitable.`;
  }

  return `You are ${peer.name}, an expert guide and peer mentor on StudySphere. Your role is ${peer.role}. 
Your expertises and interests include: ${peer.skills?.join(", ") || "Engineering, general study exchange"}.
Your bio: "${peer.bio}".

Guidelines for your response:
1. Speak exactly as ${peer.name}. Keep your tone natural, professional, encouraging, and rich with insights based on your specific background and expertise.
2. Address the user directly, answer their questions or collaborate with them on their projects/learning.
3. Make sure to refer to your own experiences (e.g. at Google, Figma, or Linux Foundation, depending on who you are) when appropriate.
4. Keep your replies concise, interactive, and structured with clear paragraphs and lists. Always sound like a real person chatting back on a platform like LinkedIn.`;
};

export default function Chat() {
  const navigate = useNavigate();
  const [activeChats, setActiveChats] = useState<Peer[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("ai-mentor");
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "typing">("idle");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Responsive sidebar toggle
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [convId, setConvId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync scroll on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistories, selectedChatId, status]);

  const fetchDbConnections = async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from("connections")
        .select(`
          id,
          status,
          requester_id,
          recipient_id
        `)
        .eq("status", "accepted")
        .or(`requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`);

      if (error) throw error;

      const peerIds = (data || []).map(c => 
        c.requester_id === currentUser.id ? c.recipient_id : c.requester_id
      ).filter(id => id && id.length > 20); // Ensure valid UUIDs only to prevent 400 Bad Request

      if (peerIds.length > 0) {
        // Fetch profiles of these peers
        const { data: profiles, error: profError } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .in("id", peerIds);

        if (!profError && profiles) {
          const dbPeers: Peer[] = profiles.map(p => ({
            id: p.id,
            name: p.full_name || "StudySphere Peer",
            role: p.role || "Student & Learner",
            skills: ["StudySphere"],
            bio: "Active study connection on StudySphere.",
            avatarText: (p.full_name || "SP").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
            initialMsg: "Hey! Let's collaborate in real-time."
          }));

          setActiveChats(prev => {
            const merged = [...dbPeers, ...prev];
            const unique = merged.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
            return unique;
          });
        }
      }
    } catch (err) {
      console.error("Error loading DB connections:", err);
    }
  };

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Real-time connections loader
  useEffect(() => {
    if (currentUser) {
      fetchDbConnections();
    }
  }, [currentUser]);

  // Real-time conversation setup and subscription
  useEffect(() => {
    if (!currentUser || selectedChatId === "ai-mentor") {
      setConvId(null);
      return;
    }

    let active = true;
    let activeChannel: any = null;

    const setupConversation = async () => {
      try {
        const { data: myConvs, error: err1 } = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("profile_id", currentUser.id);

        if (err1) throw err1;

        const convIds = (myConvs || []).map(c => c.conversation_id);
        let foundConvId = null;

        if (convIds.length > 0) {
          const { data: peerConvs, error: err2 } = await supabase
            .from("conversation_members")
            .select("conversation_id")
            .in("conversation_id", convIds)
            .eq("profile_id", selectedChatId)
            .limit(1);

          if (!err2 && peerConvs && peerConvs.length > 0) {
            foundConvId = peerConvs[0].conversation_id;
          }
        }

        if (!foundConvId) {
          const newId = crypto.randomUUID();
          const { error: err3 } = await supabase
            .from("conversations")
            .insert({ id: newId });

          if (err3) throw err3;
          
          foundConvId = newId;
          const { error: errMembers } = await supabase.from("conversation_members").insert([
            { conversation_id: foundConvId, profile_id: currentUser.id },
            { conversation_id: foundConvId, profile_id: selectedChatId }
          ]);
          
          if (errMembers) throw errMembers;
        }

        if (!active) return;
        setConvId(foundConvId);

        // Load existing messages
        const { data: msgs, error: err4 } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", foundConvId)
          .order("created_at", { ascending: true });

        if (!err4 && msgs) {
          const loadedMessages = msgs.map(m => ({
            role: m.sender_id === currentUser.id ? 'user' as const : 'ai' as const,
            text: m.text !== undefined ? m.text : m.content || "",
            status: m.sender_id === currentUser.id ? 'sent' as const : undefined
          }));
          setChatHistories(prev => ({
            ...prev,
            [selectedChatId]: loadedMessages.length > 0 ? loadedMessages : [
              { role: 'ai', text: `Hi! Let's collaborate in real-time.` }
            ]
          }));
        }

        // Subscribe to messages in real-time
        activeChannel = supabase
          .channel(`chat_messages:${foundConvId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${foundConvId}`
            },
            (payload) => {
              const newMsg = payload.new;
              if (newMsg.sender_id !== currentUser.id) {
                const text = newMsg.text !== undefined ? newMsg.text : newMsg.content;
                setChatHistories(prev => {
                  const history = prev[selectedChatId] || [];
                  if (history.some(m => m.text === text)) return prev;
                  return {
                    ...prev,
                    [selectedChatId]: [...history, { role: 'ai', text: text || "" }]
                  };
                });
              }
            }
          )
          .subscribe();

      } catch (err: any) {
        console.error("Failed to load real-time conversation:", err);
        alert("Chat setup error: " + (err.message || JSON.stringify(err)));
      }
    };

    setupConversation();

    return () => {
      active = false;
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [selectedChatId, currentUser]);

  // Initial loading & query param routing
  useEffect(() => {
    // 1. Fetch active chats from localStorage
    const savedActive = localStorage.getItem("studysphere_active_chats");
    let loadedChats: Peer[] = savedActive ? JSON.parse(savedActive) : [];

    // Seed defaults if empty so they have gorgeous conversations right out of the box
    if (loadedChats.length === 0) {
      loadedChats = [...SEED_PEERS];
      localStorage.setItem("studysphere_active_chats", JSON.stringify(loadedChats));
    }
    setActiveChats(loadedChats);

    // 2. Load or seed chat histories
    const savedHistories = localStorage.getItem("studysphere_chat_histories");
    let loadedHistories: Record<string, Message[]> = savedHistories ? JSON.parse(savedHistories) : {};

    // Initialize histories if empty
    if (!loadedHistories["ai-mentor"]) {
      loadedHistories["ai-mentor"] = [
        { role: 'ai', text: "Hello! I am your StudySphere AI Mentor. Let me help you guide your learning, build roadmaps, prep for technical interviews, or organize your study schedules today!" }
      ];
    }

    loadedChats.forEach(peer => {
      if (!loadedHistories[peer.id]) {
        loadedHistories[peer.id] = [
          { role: 'ai', text: peer.initialMsg || `Hi! I connected with you on StudySphere. Let's collaborate on skills or work through technical concepts together!` }
        ];
      }
    });

    setChatHistories(loadedHistories);
    localStorage.setItem("studysphere_chat_histories", JSON.stringify(loadedHistories));

    // 3. Check for peerId param (deep-link routing from Mentors / SkillExchange pages)
    const params = new URLSearchParams(window.location.search);
    const peerIdParam = params.get("peerId");
    if (peerIdParam) {
      // Find if we have this peer loaded, else load from seeds or fetch
      let targetPeer = loadedChats.find(p => p.id === peerIdParam);
      if (!targetPeer) {
        // Fallback: look up in seed peers
        targetPeer = SEED_PEERS.find(p => p.id === peerIdParam);
        if (targetPeer) {
          loadedChats = [targetPeer, ...loadedChats];
          setActiveChats(loadedChats);
          localStorage.setItem("studysphere_active_chats", JSON.stringify(loadedChats));
          
          if (!loadedHistories[targetPeer.id]) {
            loadedHistories[targetPeer.id] = [
              { role: 'ai', text: targetPeer.initialMsg || `Hi! I saw your profile and I'm interested in learning from you.` }
            ];
            setChatHistories(loadedHistories);
            localStorage.setItem("studysphere_chat_histories", JSON.stringify(loadedHistories));
          }
        }
      }
      setSelectedChatId(peerIdParam);
      setIsSidebarOpen(false); // Collapses list on mobile to focus chat right away
    }
  }, []);

  const handleSend = async (textOverride?: string) => {
    const userMsg = textOverride || input.trim();
    if (!userMsg || status !== "idle") return;

    // 1. Add user message locally
    const currentHistory = chatHistories[selectedChatId] || [];
    const updatedHistory = [...currentHistory, { role: 'user' as const, text: userMsg, status: 'sending' as const }];
    
    setChatHistories(prev => {
      const next = { ...prev, [selectedChatId]: updatedHistory };
      localStorage.setItem("studysphere_chat_histories", JSON.stringify(next));
      return next;
    });

    // Write message to database in real-time if selected chat is a real user
    if (selectedChatId !== "ai-mentor" && convId && currentUser) {
      try {
        // First try inserting with 'content' column
        const { error: err1 } = await supabase
          .from("messages")
          .insert({
            conversation_id: convId,
            sender_id: currentUser.id,
            content: userMsg
          });

        if (err1 && err1.message?.toLowerCase().includes("column")) {
          // If it fails because 'content' doesn't exist, try 'text' column
          const { error: err2 } = await supabase
            .from("messages")
            .insert({
              conversation_id: convId,
              sender_id: currentUser.id,
              text: userMsg
            });
          if (err2) throw err2;
        } else if (err1) {
          throw err1;
        }

        // Success! Update local status to 'sent'
        setChatHistories(prev => {
          const history = prev[selectedChatId] || [];
          const newHistory = [...history];
          for (let i = newHistory.length - 1; i >= 0; i--) {
            if (newHistory[i].role === 'user' && newHistory[i].status === 'sending') {
              newHistory[i] = { ...newHistory[i], status: 'sent' };
              break;
            }
          }
          return { ...prev, [selectedChatId]: newHistory };
        });

      } catch (err: any) {
        console.error("Failed to insert message into Supabase:", err);
        alert("Message send error: " + (err.message || JSON.stringify(err)));
      }
    }

    if (!textOverride) setInput("");

    // Check if this is a real user (not seed peer and not AI mentor)
    const isSeedPeer = SEED_PEERS.some(p => p.id === selectedChatId);
    if (selectedChatId !== "ai-mentor" && !isSeedPeer) {
      setStatus("idle");
      return; // Stop here, since we are communicating with a real person in real-time!
    }

    setStatus("searching");

    const currentPeer = activeChats.find(p => p.id === selectedChatId) || null;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/studysphere-ai-mentor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: getSystemPrompt(selectedChatId, currentPeer)
            },
            ...updatedHistory.slice(-6).map(m => ({
              role: m.role === "ai" ? "assistant" : "user",
              content: m.text
            }))
          ],
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error (${response.status}): ${errorText}`);
      }

      const contentType = response.headers.get("Content-Type") || "";
      let content = "";

      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let buffer = "";

        setStatus("typing");
        setChatHistories(prev => {
          const next = { ...prev, [selectedChatId]: [...updatedHistory, { role: 'ai', text: "" }] };
          return next;
        });

        let accumulatedText = "";

        try {
          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
              buffer += decoder.decode(value, { stream: !done });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const cleanLine = line.trim();
                if (cleanLine.startsWith("data: ") && cleanLine !== "data: [DONE]") {
                  try {
                    const jsonStr = cleanLine.substring(6);
                    const parsed = JSON.parse(jsonStr);
                    const delta = parsed.choices?.[0]?.delta?.content || "";
                    if (delta) {
                      accumulatedText += delta;
                      setChatHistories(prev => {
                        const updated = { ...prev };
                        const list = [...(updated[selectedChatId] || [])];
                        if (list.length > 0) {
                          list[list.length - 1] = { role: 'ai', text: accumulatedText };
                        }
                        updated[selectedChatId] = list;
                        return updated;
                      });
                    }
                  } catch (e) {
                    // Buffer chunk parsing fallback
                  }
                }
              }
            }
          }
        } finally {
          setStatus("idle");
          setChatHistories(prev => {
            localStorage.setItem("studysphere_chat_histories", JSON.stringify(prev));
            return prev;
          });
        }
        return;
      } else {
        const data = await response.json();
        content = data.choices?.[0]?.message?.content || "";
      }

      if (content) {
        setStatus("typing");
        setChatHistories(prev => {
          const next = { ...prev, [selectedChatId]: [...updatedHistory, { role: 'ai', text: "" }] };
          return next;
        });

        // Word-by-word streaming effect for static JSON responses
        let currentText = "";
        const words = content.split(" ");
        let wordIndex = 0;
        const interval = setInterval(() => {
          if (wordIndex < words.length) {
            currentText += (wordIndex === 0 ? "" : " ") + words[wordIndex];
            setChatHistories(prev => {
              const updated = { ...prev };
              const list = [...(updated[selectedChatId] || [])];
              if (list.length > 0) {
                list[list.length - 1] = { role: 'ai', text: currentText };
              }
              updated[selectedChatId] = list;
              return updated;
            });
            wordIndex++;
          } else {
            clearInterval(interval);
            setStatus("idle");
            setChatHistories(prev => {
              localStorage.setItem("studysphere_chat_histories", JSON.stringify(prev));
              return prev;
            });
          }
        }, 15);
        return;
      }
    } catch (err: any) {
      console.error("Direct API call failed:", err);
      setStatus("idle");
      
      const errorMessage = err.message.includes("Failed to fetch") 
        ? "Network error connecting to the AI Mentor. Please check your internet connection."
        : `AI Error: ${err.message}. If you haven't deployed the Edge Function, please run: 'supabase functions deploy studysphere-ai-mentor' and set the GROQ_API_KEY secret.`;

      setChatHistories(prev => {
        const next = { 
          ...prev, 
          [selectedChatId]: [...updatedHistory, { 
            role: 'ai', 
            text: errorMessage
          }] 
        };
        localStorage.setItem("studysphere_chat_histories", JSON.stringify(next));
        return next;
      });
    }
  };

  const activePeer = activeChats.find(p => p.id === selectedChatId) || null;
  const currentMessages = chatHistories[selectedChatId] || [];

  return (
    <AppLayout>
      <div className="flex h-[calc(100dvh-12rem)] md:h-[calc(100dvh-13rem)] gap-6 relative overflow-hidden">
        
        {/* ================= LEFT SIDEBAR (CONVERSATIONS LIST) ================= */}
        <div className={cn(
          "w-full md:w-80 shrink-0 glass rounded-[2.5rem] border border-white/5 flex flex-col p-6 overflow-y-auto transition-all duration-300 md:flex relative bg-[#03030b]/40 backdrop-blur-xl",
          isSidebarOpen ? "flex z-20 absolute inset-0 md:relative" : "hidden md:flex"
        )}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <MessageSquare className="text-purple-400 w-5 h-5" /> Conversations
            </h2>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide pr-1">
            {/* 1. Pinned AI Assistant */}
            <button 
              onClick={() => {
                setSelectedChatId("ai-mentor");
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all active:scale-[0.98]",
                selectedChatId === "ai-mentor" 
                  ? "bg-purple-600/10 border-purple-500/30 text-white shadow-lg shadow-purple-500/5" 
                  : "bg-white/2 hover:bg-white/5 border-white/5 hover:border-white/10 text-gray-400"
              )}
            >
              <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center relative shrink-0">
                <Brain className="text-purple-400 w-6 h-6 animate-pulse" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#03030b] shadow-[0_0_8px_#10b981]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  AI Assistant <ShieldCheck className="text-purple-400 w-3.5 h-3.5" />
                </h4>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">StudySphere AI</p>
              </div>
            </button>

            <div className="h-px bg-white/5 my-4" />

            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 px-2">DIRECT MESSAGES</div>

            {/* 2. List of Connected Peers */}
            {activeChats.map(peer => {
              const lastMsg = chatHistories[peer.id]?.slice(-1)[0]?.text || "No messages yet";
              const isSelected = selectedChatId === peer.id;
              
              return (
                <button 
                  key={peer.id}
                  onClick={() => {
                    setSelectedChatId(peer.id);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all active:scale-[0.98]",
                    isSelected 
                      ? "bg-white/5 border-purple-500/20 text-white" 
                      : "bg-white/2 hover:bg-white/5 border-white/2 text-gray-400"
                  )}
                >
                  <div className="w-11 h-11 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 border border-white/5 rounded-xl flex items-center justify-center relative shrink-0">
                    <span className="font-bold text-xs text-purple-400">{peer.avatarText || peer.name.split(' ').map(n=>n[0]).join('')}</span>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#03030b] shadow-[0_0_8px_#10b981]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm tracking-tight text-white truncate">{peer.name}</h4>
                    <p className="text-[10px] text-purple-400 truncate mt-0.5">{peer.role}</p>
                    <p className="text-[10px] text-gray-600 truncate mt-1 italic">"{lastMsg}"</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= RIGHT ACTIVE CHAT PANE ================= */}
        <div className="flex-1 glass rounded-[2.5rem] border border-white/5 flex flex-col p-6 overflow-hidden bg-[#03030b]/20 relative">
          
          {/* Header */}
          <header className="pb-6 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              {/* Back Arrow for mobile */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl transition-all md:hidden text-gray-400 hover:text-white"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/10 to-blue-500/10 border border-white/10 flex items-center justify-center shadow-lg shadow-purple-500/5">
                  {selectedChatId === "ai-mentor" ? (
                    <Brain className="text-purple-400 w-6 h-6 animate-pulse" />
                  ) : (
                    <span className="font-bold text-purple-400">{activePeer?.avatarText || activePeer?.name.split(' ').map(n=>n[0]).join('')}</span>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#03030b] shadow-[0_0_8px_#10b981]" />
              </div>

              <div>
                <h3 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  {selectedChatId === "ai-mentor" ? "🤖 AI Assistant" : activePeer?.name}
                  {selectedChatId === "ai-mentor" && <ShieldCheck className="text-purple-400 w-4 h-4" />}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {status === "idle" ? "Online" : status === "searching" ? "Thinking..." : "Typing..."}
                  </span>
                </div>
              </div>
            </div>

            {selectedChatId !== "ai-mentor" && activePeer && (
              <div className="hidden lg:flex items-center gap-3">
                <div className="flex items-center gap-1.5 mr-2">
                  {activePeer.skills.slice(0, 3).map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-purple-500/5 border border-purple-500/10 text-[9px] font-bold text-purple-400 uppercase tracking-widest">#{s}</span>
                  ))}
                </div>
                {convId && (
                  <button 
                    onClick={() => navigate(`/call/${convId}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-purple-600/20 active:scale-95"
                  >
                    <Video size={14} /> Meet Now
                  </button>
                )}
              </div>
            )}
          </header>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-6 mt-6 mb-4 scrollbar-hide pr-1">
            <AnimatePresence initial={false}>
              {currentMessages.map((m, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex gap-4 p-5 rounded-[2rem] border transition-all",
                    m.role === 'user' 
                      ? "ml-12 bg-white/5 border-white/10" 
                      : "mr-12 bg-[#07070c]/60 backdrop-blur-md border-purple-500/10 shadow-[0_0_20px_rgba(167,139,250,0.02)]"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                    m.role === 'user' ? "bg-white/10 text-gray-400" : "bg-purple-500/10 text-purple-400"
                  )}>
                    {m.role === 'user' ? (
                      <User size={18} />
                    ) : selectedChatId === "ai-mentor" ? (
                      <Sparkles size={18} />
                    ) : (
                      <span className="font-bold text-xs text-purple-400">{activePeer?.avatarText || activePeer?.name.split(' ').map(n=>n[0]).join('')}</span>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed text-gray-300 py-1.5 font-light min-h-[1.5rem] flex-1">
                    {parseMarkdown(m.text)}
                    {m.role === 'user' && m.status && (
                      <div className="flex justify-end mt-1 text-[10px] items-center gap-1 opacity-60">
                        {m.status === 'sending' ? (
                          <><Clock size={10} /> Sending...</>
                        ) : (
                          <><Check size={10} className="text-emerald-400" /> Sent</>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {status === "searching" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 p-5 rounded-[2rem] glass border-purple-500/10 mr-12 bg-[#07070c]/30"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    {selectedChatId === "ai-mentor" ? <Sparkles size={18} /> : <span className="font-bold text-xs text-purple-400">{activePeer?.avatarText || activePeer?.name.split(' ').map(n=>n[0]).join('')}</span>}
                  </div>
                  <div className="flex items-center gap-3 py-2 px-3">
                     <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest animate-pulse">Thinking...</span>
                     <div className="flex gap-1">
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" />
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="relative group shrink-0 mt-auto">
            <div className="absolute inset-0 bg-purple-500/5 blur-xl group-focus-within:bg-purple-500/15 transition-all rounded-3xl" />
            <div className="relative glass border border-white/10 rounded-[1.5rem] flex items-center p-2 shadow-2xl">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={status !== "idle"}
                placeholder={selectedChatId === "ai-mentor" ? "Ask your AI Mentor for guidance..." : `Message ${activePeer?.name.split(" ")[0]}...`}
                className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-sm font-medium placeholder:text-gray-600 disabled:opacity-50 text-white"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || status !== "idle"}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 p-4 rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 shrink-0"
              >
                  {status === "idle" ? <Send size={16} /> : <Loader2 size={16} className="animate-spin" />}
              </button>
            </div>
          </div>
          <p className="text-center text-[9px] text-gray-600 uppercase font-bold tracking-[0.2em] mt-5 shrink-0">
              StudySphere Intelligence • Unified Chat Center
          </p>
        </div>

      </div>
    </AppLayout>
  );
}

function PromptChip({ text, icon, onClick, disabled }: { text: string, icon: React.ReactNode, onClick: (t: string) => void, disabled?: boolean }) {
  return (
    <button 
      onClick={() => onClick(text)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full glass border border-white/5 hover:border-purple-500/30 transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shrink-0 group active:scale-95 bg-white/2",
        disabled && "opacity-50 grayscale cursor-not-allowed active:scale-100"
      )}
    >
      <span className="text-purple-400 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-gray-400 group-hover:text-white transition-colors">{text}</span>
    </button>
  );
}

// Function to render bold and code tags inline
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-extrabold text-white glow-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-xs border border-purple-500/30">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  let inList = false;
  let listItems: string[] = [];
  const renderedElements: React.ReactNode[] = [];
  let elementKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('### ')) {
      if (inList) {
        renderedElements.push(
          <ul key={`list-${elementKey++}`} className="list-disc pl-6 space-y-2 mb-4 text-gray-300 font-light">
            {listItems.map((item, idx) => <li key={idx}>{renderInlineMarkdown(item)}</li>)}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      renderedElements.push(
        <h3 key={`h3-${elementKey++}`} className="text-base font-bold text-purple-400 tracking-tight mt-6 mb-3">
          {renderInlineMarkdown(line.substring(4))}
        </h3>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      if (inList) {
        renderedElements.push(
          <ul key={`list-${elementKey++}`} className="list-disc pl-6 space-y-2 mb-4 text-gray-300 font-light">
            {listItems.map((item, idx) => <li key={idx}>{renderInlineMarkdown(item)}</li>)}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      renderedElements.push(
        <h2 key={`h2-${elementKey++}`} className="text-lg font-bold text-white tracking-tight mt-8 mb-4">
          {renderInlineMarkdown(line.substring(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      if (inList) {
        renderedElements.push(
          <ul key={`list-${elementKey++}`} className="list-disc pl-6 space-y-2 mb-4 text-gray-300 font-light">
            {listItems.map((item, idx) => <li key={idx}>{renderInlineMarkdown(item)}</li>)}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      renderedElements.push(
        <h1 key={`h1-${elementKey++}`} className="text-xl font-bold text-white tracking-tight mt-10 mb-6">
          {renderInlineMarkdown(line.substring(2))}
        </h1>
      );
      continue;
    }

    if (line.startsWith('* ') || line.startsWith('- ')) {
      inList = true;
      listItems.push(line.substring(2));
      continue;
    }

    if (line.startsWith('|')) {
      if (inList) {
        renderedElements.push(
          <ul key={`list-${elementKey++}`} className="list-disc pl-6 space-y-2 mb-4 text-gray-300 font-light">
            {listItems.map((item, idx) => <li key={idx}>{renderInlineMarkdown(item)}</li>)}
          </ul>
        );
        inList = false;
        listItems = [];
      }

      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      i--;

      if (tableLines.length >= 2) {
        const parsedRows = tableLines.map(row => 
          row.split('|')
            .map(cell => cell.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        const headers = parsedRows[0];
        const contentRows = parsedRows.slice(2);

        renderedElements.push(
          <div key={`table-wrapper-${elementKey++}`} className="overflow-x-auto my-6 rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-purple-500/10">
                  {headers.map((h, idx) => (
                    <th key={idx} className="p-4 font-bold text-purple-300 uppercase tracking-wider text-xs">
                      {renderInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contentRows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-4 text-gray-300 font-light">
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    if (line !== '') {
      if (inList) {
        renderedElements.push(
          <ul key={`list-${elementKey++}`} className="list-disc pl-6 space-y-2 mb-4 text-gray-300 font-light">
            {listItems.map((item, idx) => <li key={idx}>{renderInlineMarkdown(item)}</li>)}
          </ul>
        );
        inList = false;
        listItems = [];
      }

      renderedElements.push(
        <p key={`p-${elementKey++}`} className="mb-4 text-gray-300 leading-relaxed font-light">
          {renderInlineMarkdown(line)}
        </p>
      );
    }
  }

  if (inList) {
    renderedElements.push(
      <ul key={`list-${elementKey++}`} className="list-disc pl-6 space-y-2 mb-4 text-gray-300 font-light">
        {listItems.map((item, idx) => <li key={idx}>{renderInlineMarkdown(item)}</li>)}
      </ul>
    );
  }

  return <div className="space-y-1">{renderedElements}</div>;
}
