
-- =========== ENUMS ===========
CREATE TYPE public.app_role AS ENUM ('admin', 'member');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'completed');
CREATE TYPE public.project_status AS ENUM ('active', 'on_hold', 'completed', 'archived');

-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========== USER ROLES ===========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- =========== PROJECTS ===========
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'active',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- =========== PROJECT MEMBERS ===========
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id AND project_id = _project_id
  )
$$;

-- =========== TASKS ===========
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'todo',
  due_date DATE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- =========== UPDATED_AT TRIGGER ===========
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========== AUTO-CREATE PROFILE + ROLE ON SIGNUP ===========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  -- First user becomes admin, rest are members
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== RLS POLICIES ===========

-- profiles
CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- projects
CREATE POLICY "Members and admins view projects" ON public.projects
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_project_member(auth.uid(), id));
CREATE POLICY "Admins insert projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update projects" ON public.projects
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete projects" ON public.projects
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- project_members
CREATE POLICY "Members view their memberships" ON public.project_members
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage memberships" ON public.project_members
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- tasks
CREATE POLICY "Admins and project members view tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_project_member(auth.uid(), project_id));
CREATE POLICY "Admins insert tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update any task" ON public.tasks
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Members update status of own project tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (public.is_project_member(auth.uid(), project_id))
  WITH CHECK (public.is_project_member(auth.uid(), project_id));
CREATE POLICY "Admins delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
