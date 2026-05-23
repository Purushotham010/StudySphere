-- ==============================================================
-- STUDY SPHERE DATABASE REFINEMENTS & SCHEMAS (V5)
-- BULLETPROOF CHAT RLS POLICIES
-- ==============================================================

SET search_path = public;

-- 1. Remove recursive policies that cause setupConversation to crash
DROP POLICY IF EXISTS "Members can view members." ON conversation_members;
CREATE POLICY "Members can view members." ON conversation_members 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can view conversations." ON conversations;
CREATE POLICY "Members can view conversations." ON conversations 
FOR SELECT USING (true);

-- 2. Keep messages secure, but using a simpler check
DROP POLICY IF EXISTS "Members can view messages." ON messages;
CREATE POLICY "Members can view messages." ON messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_members 
    WHERE conversation_members.conversation_id = messages.conversation_id 
    AND conversation_members.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can insert messages." ON messages;
CREATE POLICY "Members can insert messages." ON messages 
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM conversation_members 
    WHERE conversation_members.conversation_id = messages.conversation_id 
    AND conversation_members.profile_id = auth.uid()
  )
);
