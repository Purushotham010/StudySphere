import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'mentor';
  onboarded: boolean;
  bio?: string;
  avatar_url?: string;
  github_url?: string;
  linkedin_url?: string;
  growth_points?: number;
  streak_days?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Self-heal: Create profile row if it doesn't exist in DB
          const { data: newData, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: currentUser.id,
              full_name: currentUser.user_metadata?.full_name || "New Builder",
              email: currentUser.email || "",
              role: null,
              onboarded: false
            })
            .select()
            .single();

          if (insertError) {
            // If another parallel process (e.g., StrictMode double-render or DB trigger)
            // inserted it first, catch the duplicate key violation (23505) and fetch again!
            if (insertError.code === "23505") {
              const { data: refetchedData, error: refetchError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .single();
              
              if (refetchError) throw refetchError;
              setProfile(refetchedData);
              return;
            }
            throw insertError;
          }
          setProfile(newData);
          return;
        }
        throw error;
      }
      setProfile(data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    let active = true;

    // Failsafe: Force loading to false after 3 seconds no matter what!
    const failsafe = setTimeout(() => {
      if (active) {
         console.warn("Failsafe triggered: Auth taking too long to load.");
         setIsLoading(false);
      }
    }, 3000);

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser);
        }
      } catch (err) {
        console.error("Error initializing auth session:", err);
      } finally {
        clearTimeout(failsafe);
        if (active) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes (completely synchronous/non-blocking to prevent Supabase auth deadlocks!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Safe side-effect: fetch profile when logged in user changes, decoupled from auth state events
  useEffect(() => {
    if (user) {
      fetchProfile(user);
    } else {
      setProfile(null);
    }
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
