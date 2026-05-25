-- ==============================================================
-- STUDY SPHERE DATABASE REFINEMENTS & SCHEMAS
-- ==============================================================

SET search_path = public;

-- ==============================================================
-- 1. FIX CONVERSATION RLS RECURSION BUG
-- ==============================================================

-- Drop old recursive select policy if it exists
DROP POLICY IF EXISTS "Users can view members of their conversations." ON conversation_members;
DROP POLICY IF EXISTS "Members can view conversations." ON conversations;
DROP POLICY IF EXISTS "Members can view messages." ON messages;
DROP POLICY IF EXISTS "Members can insert messages." ON messages;

-- Create security definer helper to check membership without triggering RLS recursively
-- Configured with strict search_path = public to avoid search path hijacking vulnerability
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id uuid, user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_members 
    WHERE conversation_id = conv_id AND profile_id = user_id
  );
END;
$$;

-- Apply elegant recursion-free select policies
CREATE POLICY "Members can view members." ON conversation_members 
FOR SELECT USING (public.is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Members can view conversations." ON conversations 
FOR SELECT USING (public.is_conversation_member(id, auth.uid()));

CREATE POLICY "Members can view messages." ON messages 
FOR SELECT USING (public.is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Members can insert messages." ON messages 
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND 
  public.is_conversation_member(conversation_id, auth.uid())
);

-- ==============================================================
-- 2. CREATE OPPORTUNITIES & BOOKMARKS
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  deadline timestamp with time zone DEFAULT (now() + interval '7 days') NOT NULL,
  tags text[] DEFAULT '{}'::text[] NOT NULL,
  logo text,
  description text,
  external_url text DEFAULT 'https://example.com' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Opportunities are viewable by everyone." ON public.opportunities 
FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, opportunity_id)
);

-- RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookmarks." ON public.bookmarks 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks." ON public.bookmarks 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks." ON public.bookmarks 
FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================
-- 3. CREATE COMMUNITY POSTS, REPLIES & LIKES
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  post_type text CHECK (post_type IN ('feed', 'team')) DEFAULT 'feed' NOT NULL,
  tags text[] DEFAULT '{}'::text[] NOT NULL,
  tech_stack text[] DEFAULT '{}'::text[] NOT NULL,
  roles_needed text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone." ON public.community_posts 
FOR SELECT USING (true);

CREATE POLICY "Users can create posts." ON public.community_posts 
FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts." ON public.community_posts 
FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts." ON public.community_posts 
FOR DELETE USING (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS public.post_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Replies are viewable by everyone." ON public.post_replies 
FOR SELECT USING (true);

CREATE POLICY "Users can create replies." ON public.post_replies 
FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own replies." ON public.post_replies 
FOR DELETE USING (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone." ON public.post_likes 
FOR SELECT USING (true);

CREATE POLICY "Users can toggle likes." ON public.post_likes 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove likes." ON public.post_likes 
FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================
-- 4. PERFORMANCE TUNING INDEXES
-- ==============================================================

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);

-- ==============================================================
-- 5. SEED SAMPLE DATA FOR OPPORTUNITIES
-- ==============================================================

INSERT INTO public.opportunities (title, company, location, tags, deadline, logo, description, external_url)
VALUES
  ('Software Engineering Intern', 'Google', 'Global / Remote', ARRAY['Internship', 'Engineering'], now() + interval '3 days', 'G', 'Discover high-impact systems engineering and frontend software engineering work at scale.', 'https://careers.google.com'),
  ('Product Design Fellow', 'Figma', 'San Francisco', ARRAY['Fellowship', 'Design'], now() + interval '7 days', 'F', 'Work closely with core product teams to craft the future of interactive visual environments.', 'https://figma.com/careers'),
  ('Open Source Contributor', 'Linux Foundation', 'Remote', ARRAY['Grant', 'Open Source'], now() + interval '14 days', 'L', 'Get funded grants to contribute to system-level open-source foundations.', 'https://linuxfoundation.org'),
  ('Summer Hackathon ''26', 'StudySphere', 'Metaverse', ARRAY['Hackathon', 'Build'], now() + interval '1 day', 'S', 'Collaborate, form elite teams, and showcase your web applications in a massive online design sprint.', 'https://studysphere.ai/hackathon'),
  ('Backend Systems Trainee', 'Netflix', 'Remote', ARRAY['Trainee', 'Engineering'], now() + interval '5 days', 'N', 'Learn modern scalable microservices engineering and highly concurrent video streaming systems.', 'https://netflix.com/careers'),
  ('Frontend Team Lead', 'SkyLearn', 'Remote', ARRAY['Contract', 'Lead'], now() + interval '21 days', 'S', 'Lead visual design and custom interactivity architectures for interactive education apps.', 'https://skylearn.com');

-- ==============================================================
-- 6. MENTOR SESSIONS SCHEMAS
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.mentor_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mentor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  session_time timestamp with time zone NOT NULL,
  status text CHECK (status in ('pending', 'accepted', 'completed')) DEFAULT 'pending' NOT NULL,
  session_type text DEFAULT 'Review' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users can view own sessions." ON public.mentor_sessions
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = mentor_id);

-- Insert policy
CREATE POLICY "Students can book sessions." ON public.mentor_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Update/Delete policies
CREATE POLICY "Users can update own sessions." ON public.mentor_sessions
  FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = mentor_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_student_id ON public.mentor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor_id ON public.mentor_sessions(mentor_id);

