-- 1. Add served_by to appointments (which agent served this citizen)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS served_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Add avg_rating and review_count to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- 3. Create feedback table
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  citizen_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id      UUID NOT NULL,
  rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS on feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Citizens insert own feedback"
  ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Citizens view own feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (auth.uid() = citizen_id);

CREATE POLICY "Agents view own feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins view all feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Grant permissions
GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

-- 6. Indexes for feedback lookup and appointment served_by
CREATE INDEX IF NOT EXISTS idx_feedback_agent_id ON public.feedback(agent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_served_by ON public.appointments(served_by);

-- 7. Trigger: recalculate agent avg_rating on feedback insert/update/delete
CREATE OR REPLACE FUNCTION public.update_agent_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles
    SET
      avg_rating   = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.feedback WHERE agent_id = OLD.agent_id),
      review_count = (SELECT COUNT(*) FROM public.feedback WHERE agent_id = OLD.agent_id)
    WHERE id = OLD.agent_id;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.agent_id IS DISTINCT FROM NEW.agent_id) THEN
      UPDATE public.profiles
      SET
        avg_rating   = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.feedback WHERE agent_id = OLD.agent_id),
        review_count = (SELECT COUNT(*) FROM public.feedback WHERE agent_id = OLD.agent_id)
      WHERE id = OLD.agent_id;
    END IF;
    UPDATE public.profiles
    SET
      avg_rating   = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.feedback WHERE agent_id = NEW.agent_id),
      review_count = (SELECT COUNT(*) FROM public.feedback WHERE agent_id = NEW.agent_id)
    WHERE id = NEW.agent_id;
    RETURN NEW;
  ELSE
    UPDATE public.profiles
    SET
      avg_rating   = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.feedback WHERE agent_id = NEW.agent_id),
      review_count = (SELECT COUNT(*) FROM public.feedback WHERE agent_id = NEW.agent_id)
    WHERE id = NEW.agent_id;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_feedback_rating_change ON public.feedback;
CREATE TRIGGER on_feedback_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_agent_rating();

-- Notes:
-- New Pages
-- - /my-appointments — citizen dashboard with pending feedback prompts
-- - /admin/staff-profile/:id — agent rating detail page
-- Modified Files
-- - src/pages/admin/Appointments.tsx — records which agent marked as served
-- - src/pages/admin/Users.tsx — shows avg rating for staff members  