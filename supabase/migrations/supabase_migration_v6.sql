-- ==============================================================
-- STUDY SPHERE DATABASE REFINEMENTS & SCHEMAS (V6)
-- OPPORTUNITIES INSERT POLICY & COLUMN FIX
-- ==============================================================

SET search_path = public;

-- 1. Add created_by column if it doesn't exist so we can track who posted it
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- 2. Add an INSERT policy so users can actually save opportunities to the database
DROP POLICY IF EXISTS "Users can insert opportunities." ON public.opportunities;
CREATE POLICY "Users can insert opportunities." ON public.opportunities 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
