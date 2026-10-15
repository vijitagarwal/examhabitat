-- Supabase Initial Schema Migration for ExamHabitat
-- Migration: 001_initial_schema.sql

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  target_exam TEXT NOT NULL DEFAULT 'cat',
  target_institution TEXT,
  target_score TEXT,
  avatar_url TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. KV Store Table
CREATE TABLE IF NOT EXISTS public.kv_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kv_store_user_key_unique UNIQUE(user_id, key)
);

-- 3. Topic Tracker Table
CREATE TABLE IF NOT EXISTS public.topic_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id TEXT NOT NULL,
  section TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Not Started',
  confidence INT DEFAULT 0,
  time_spent_minutes INT DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT topic_tracker_user_exam_topic_unique UNIQUE(user_id, exam_id, topic_name)
);

-- 4. Topic History Table (Audit Log)
CREATE TABLE IF NOT EXISTS public.topic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Mock Tests Table
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  test_name TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_score NUMERIC NOT NULL DEFAULT 0,
  max_score NUMERIC NOT NULL DEFAULT 0,
  percentile NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Error Log Table
CREATE TABLE IF NOT EXISTS public.error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  question TEXT NOT NULL,
  section TEXT NOT NULL,
  topic TEXT,
  type TEXT,
  cause TEXT,
  fix TEXT,
  mock_number INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kv_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: User access strictly scoped to auth.uid()

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- KV Store Policies
CREATE POLICY "Users can view own kv_store" ON public.kv_store FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kv_store" ON public.kv_store FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kv_store" ON public.kv_store FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kv_store" ON public.kv_store FOR DELETE USING (auth.uid() = user_id);

-- Topic Tracker Policies
CREATE POLICY "Users can view own topic_tracker" ON public.topic_tracker FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topic_tracker" ON public.topic_tracker FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topic_tracker" ON public.topic_tracker FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own topic_tracker" ON public.topic_tracker FOR DELETE USING (auth.uid() = user_id);

-- Topic History Policies
CREATE POLICY "Users can view own topic_history" ON public.topic_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topic_history" ON public.topic_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mock Tests Policies
CREATE POLICY "Users can view own mock_tests" ON public.mock_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mock_tests" ON public.mock_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mock_tests" ON public.mock_tests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mock_tests" ON public.mock_tests FOR DELETE USING (auth.uid() = user_id);

-- Error Log Policies
CREATE POLICY "Users can view own error_log" ON public.error_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own error_log" ON public.error_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own error_log" ON public.error_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own error_log" ON public.error_log FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
