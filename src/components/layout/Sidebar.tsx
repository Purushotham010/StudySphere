import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Briefcase, 
  Layers, 
  FileText, 
  Settings,
  LogOut,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/context/AuthContext";

const menuItems = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/dashboard" },
  { icon: <MessageSquare size={20} />, label: "AI Assistant", path: "/chat" },
  { icon: <Users size={20} />, label: "Mentors", path: "/mentors" },
  { icon: <Layers size={20} />, label: "Skill Exchange", path: "/skills" },
  { icon: <Briefcase size={20} />, label: "Opportunities", path: "/opportunities" },
  { icon: <Sparkles size={20} />, label: "Community", path: "/community" },
];

import { supabase } from "@/src/lib/supabase";

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isOnboarded = profile?.onboarded ?? true;

  const handleLogout = async () => {
    try {
      // 1. Instantly clear local storage so the session is wiped immediately
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Fire and forget the server signout so network hangs don't block execution
      supabase.auth.signOut().catch(err => console.error("Server signout sync error:", err));
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // 3. Immediately redirect to login
      window.location.href = "/login";
    }
  };

  return (
    <aside className={cn(
      "w-72 h-full border-r border-white/5 flex flex-col bg-[#03030b]/95 md:bg-[#03030b]/80 backdrop-blur-3xl shrink-0 overflow-hidden z-50 transition-transform duration-300",
      "fixed md:relative top-0 left-0 bottom-0",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="p-8 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 overflow-hidden">
          <img src="/studysphere-logo.png" alt="StudySphere Logo" className="w-full h-full object-cover" />
        </div>
        <span className="font-bold tracking-tight text-lg">StudySphere</span>
      </div>

      <div className="flex-1 flex flex-col pt-2">
        <nav className="px-4 space-y-2 overflow-y-auto scrollbar-hide py-4">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            const disabled = !isOnboarded;
            return (
              <Link 
                key={item.path}
                to={disabled ? "#" : item.path}
                onClick={(e) => {
                  if (disabled) e.preventDefault();
                  else if (onClose) onClose();
                }}
                className={cn(
                  "group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300",
                  active 
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]" 
                    : disabled
                      ? "text-gray-700 cursor-not-allowed opacity-40 select-none"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className={cn("transition-transform duration-300", active && "scale-110", disabled && "text-gray-800")}>{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {active && <ChevronRight size={14} className="animate-pulse" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-2 mt-8">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-4 mb-2">Account</div>
          <Link 
            to={!isOnboarded ? "#" : "/settings"}
            onClick={(e) => {
              if (!isOnboarded) e.preventDefault();
              else if (onClose) onClose();
            }}
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-medium",
              location.pathname === "/settings" 
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]" 
                : !isOnboarded
                  ? "text-gray-700 cursor-not-allowed opacity-40 select-none"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings size={20} className={cn("transition-transform duration-300", location.pathname === "/settings" && "scale-110")} /> 
            Settings
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all text-sm font-medium"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

    </aside>
  );
}
