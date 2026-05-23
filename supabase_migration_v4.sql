-- ==============================================================
-- STUDY SPHERE DATABASE REFINEMENTS & SCHEMAS (V4)
-- CHAT ROOM CREATION PERMISSIONS
-- ==============================================================

SET search_path = public;

-- Enable authenticated users to create a new chat room (conversation)
DROP POLICY IF EXISTS "Users can create conversations." ON conversations;
CREATE POLICY "Users can create conversations." ON conversations 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Enable authenticated users to add members to a conversation they just created
DROP POLICY IF EXISTS "Users can insert conversation members." ON conversation_members;
CREATE POLICY "Users can insert conversation members." ON conversation_members 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
