import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export async function loadProgress(): Promise<Record<string, unknown> | null> {
  if (!supabase) return null;
  let { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    user = data.user;
  }
  if (!user) return null;
  const { data, error } = await supabase.from('learner_progress').select('stats').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data?.stats ?? null;
}

export async function saveProgress(stats: Record<string, unknown>): Promise<void> {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from('learner_progress').upsert({ user_id: user.id, stats, updated_at: new Date().toISOString() });
  if (error) throw error;
}
