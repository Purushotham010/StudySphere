-- ==============================================================
-- STUDY SPHERE DATABASE REFINEMENTS & SCHEMAS (V7)
-- OPPORTUNITIES DELETE POLICY
-- ==============================================================

SET search_path = public;

-- Add a DELETE policy so users can delete their own opportunities
DROP POLICY IF EXISTS "Users can delete own opportunities." ON public.opportunities;
CREATE POLICY "Users can delete own opportunities." ON public.opportunities 
FOR DELETE USING (auth.uid() = created_by);
