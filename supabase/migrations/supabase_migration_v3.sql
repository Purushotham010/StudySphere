-- ==============================================================
-- STUDY SPHERE DATABASE REFINEMENTS & SCHEMAS (V3)
-- PEER TO PEER CONNECTIONS UPGRADE
-- ==============================================================

SET search_path = public;

-- Ensure the connections table exists with proper status enum and columns
CREATE TABLE IF NOT EXISTS public.connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(requester_id, recipient_id)
);

-- Enable Row-Level Security
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- 1. View Policy: Users can see connections if they are the requester OR the recipient
DROP POLICY IF EXISTS "Users can view own connections" ON public.connections;
CREATE POLICY "Users can view own connections" ON public.connections 
FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- 2. Insert Policy: Users can send a connection request (they MUST be the requester)
DROP POLICY IF EXISTS "Users can insert connection requests" ON public.connections;
CREATE POLICY "Users can insert connection requests" ON public.connections 
FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- 3. Update Policy: Only the RECIPIENT can update the status (Accept / Reject)
DROP POLICY IF EXISTS "Recipients can update connection status" ON public.connections;
CREATE POLICY "Recipients can update connection status" ON public.connections 
FOR UPDATE USING (auth.uid() = recipient_id);

-- 4. Delete Policy: Either party can cancel or sever the connection
DROP POLICY IF EXISTS "Users can delete own connections" ON public.connections;
CREATE POLICY "Users can delete own connections" ON public.connections 
FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Add performance indexes for faster dashboard lookups
CREATE INDEX IF NOT EXISTS idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient_id ON public.connections(recipient_id);
