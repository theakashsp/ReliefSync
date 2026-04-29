-- Enums
CREATE TYPE public.app_role AS ENUM ('citizen', 'volunteer', 'admin');
CREATE TYPE public.disaster_type AS ENUM ('flood', 'earthquake', 'cyclone', 'fire', 'medical', 'other');
CREATE TYPE public.need_type AS ENUM ('food', 'medicine', 'rescue', 'blood', 'shelter', 'transport');
CREATE TYPE public.urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.request_status AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.mission_status AS ENUM ('accepted', 'on_the_way', 'completed', 'cancelled');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  skills TEXT[] DEFAULT '{}',
  has_vehicle BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles (separate table — security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Emergency requests
CREATE TABLE public.emergency_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  reporter_phone TEXT NOT NULL,
  disaster_type disaster_type NOT NULL,
  need_type need_type NOT NULL,
  people_affected INT NOT NULL DEFAULT 1,
  description TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  photo_url TEXT,
  urgency urgency_level NOT NULL DEFAULT 'medium',
  ai_score INT NOT NULL DEFAULT 50,
  status request_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Missions (volunteer assignments)
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  volunteer_name TEXT NOT NULL,
  status mission_status NOT NULL DEFAULT 'accepted',
  eta_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, volunteer_id)
);

-- Indexes
CREATE INDEX idx_requests_status ON public.emergency_requests(status);
CREATE INDEX idx_requests_created ON public.emergency_requests(created_at DESC);
CREATE INDEX idx_missions_request ON public.missions(request_id);
CREATE INDEX idx_missions_volunteer ON public.missions(volunteer_id);

-- Security definer fn for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON public.emergency_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_missions_updated BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'citizen')
  );
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update request status when missions change
CREATE OR REPLACE FUNCTION public.sync_request_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  active_count INT;
  completed_count INT;
BEGIN
  SELECT COUNT(*) FILTER (WHERE status IN ('accepted','on_the_way')),
         COUNT(*) FILTER (WHERE status = 'completed')
  INTO active_count, completed_count
  FROM public.missions WHERE request_id = COALESCE(NEW.request_id, OLD.request_id);

  IF completed_count > 0 THEN
    UPDATE public.emergency_requests SET status = 'completed'
    WHERE id = COALESCE(NEW.request_id, OLD.request_id);
  ELSIF active_count > 0 THEN
    UPDATE public.emergency_requests SET status = 'in_progress'
    WHERE id = COALESCE(NEW.request_id, OLD.request_id);
  ELSE
    UPDATE public.emergency_requests SET status = 'open'
    WHERE id = COALESCE(NEW.request_id, OLD.request_id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_sync_request_status
  AFTER INSERT OR UPDATE OR DELETE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.sync_request_status();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Roles policies
CREATE POLICY "Roles viewable by authenticated" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Requests policies (open: everyone authenticated can view; anyone can post)
CREATE POLICY "Requests viewable by all authenticated" ON public.emergency_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated can create request" ON public.emergency_requests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Reporter or admin updates request" ON public.emergency_requests
  FOR UPDATE TO authenticated USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'volunteer'));
CREATE POLICY "Reporter or admin deletes request" ON public.emergency_requests
  FOR DELETE TO authenticated USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

-- Missions policies
CREATE POLICY "Missions viewable by authenticated" ON public.missions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Volunteers create own missions" ON public.missions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = volunteer_id);
CREATE POLICY "Volunteers update own missions" ON public.missions
  FOR UPDATE TO authenticated USING (auth.uid() = volunteer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Volunteers delete own missions" ON public.missions
  FOR DELETE TO authenticated USING (auth.uid() = volunteer_id OR public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;
ALTER TABLE public.emergency_requests REPLICA IDENTITY FULL;
ALTER TABLE public.missions REPLICA IDENTITY FULL;