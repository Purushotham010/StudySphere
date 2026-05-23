import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { motion, AnimatePresence } from "motion/react";
import { WifiOff } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(true);

  useEffect(() => {
    let active = true;

    const pingDB = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout
      
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
          method: "GET",
          headers: {
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          signal: controller.signal
        });
        
        if (!active) return;
        
        if (response.ok) {
          setNetworkError(null);
        } else {
          setNetworkError(`Database API returned status code ${response.status}`);
        }
      } catch (err: any) {
        if (!active) return;
        if (err.name === 'AbortError') {
          setNetworkError("Connection to Supabase timed out after 6 seconds. This usually happens if you are behind a restricted university/office network, proxy, or active VPN blocking database endpoints.");
        } else {
          setNetworkError(`Unable to establish connection to Supabase database. Detail: ${err.message || 'Network blocked'}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    pingDB();
    const interval = setInterval(pingDB, 20000); // Check every 20 seconds
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-full bg-[#03030b] text-white flex overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto w-full"
          >
            {networkError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex flex-col sm:flex-row sm:items-center justify-between gap-6 backdrop-blur-xl relative overflow-hidden group hover:border-red-500/40 transition-all"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                    <WifiOff size={22} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-red-200 uppercase tracking-wider">Live Network Alert</h4>
                    <p className="text-xs text-red-300/80 leading-relaxed font-light max-w-2xl">{networkError}</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shrink-0 self-start sm:self-center relative z-10"
                >
                  Retry Connection
                </button>
              </motion.div>
            )}
            {children}
          </motion.div>
        </main>
      </div>

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
            <button onClick={() => setShowMobileWarning(false)} className="text-gray-500 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
