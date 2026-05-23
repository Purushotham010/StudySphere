import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Video } from "lucide-react";

export default function VideoCall() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Create a unique but readable room name for Jitsi
  const roomName = `studysphere-session-${id || "demo"}`;

  return (
    <div className="h-screen w-screen bg-[#03030b] flex flex-col font-sans">
      {/* Header Bar */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <Video size={18} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">StudySphere Live Room</h1>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
              <ShieldCheck size={12} /> End-to-end Encrypted
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate("/dashboard")}
          className="px-6 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95"
        >
          <ArrowLeft size={14} /> Leave Call
        </button>
      </header>

      {/* Jitsi Iframe */}
      <div className="flex-1 w-full bg-[#111]">
        <iframe 
          src={`https://meet.jit.si/${roomName}`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-none"
          title="StudySphere Live Call"
        />
      </div>
    </div>
  );
}
