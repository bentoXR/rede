import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { CloudSettings, UserProgress } from "../types/progress";
import { mergeUserProgress } from "./storage";

let cachedClient: SupabaseClient | null = null;
let cachedKey = "";

export function getSupabaseClient(settings: CloudSettings): SupabaseClient | null {
  const url = settings.supabaseUrl.trim();
  const key = settings.supabaseAnonKey.trim();
  if (!url || !key) return null;

  const signature = `${url}::${key}`;
  if (cachedClient && cachedKey === signature) {
    return cachedClient;
  }
  cachedClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  cachedKey = signature;
  return cachedClient;
}

export async function getCurrentUser(settings: CloudSettings): Promise<User | null> {
  const client = getSupabaseClient(settings);
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user ?? null;
}

export async function signInWithMagicLink(
  settings: CloudSettings,
  email: string
): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient(settings);
  if (!client) {
    return { ok: false, message: "Configure a URL e a Anon Key do Supabase primeiro." };
  }
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Link mágico enviado! Verifique seu e-mail para entrar." };
}

export async function signInWithGoogle(
  settings: CloudSettings
): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient(settings);
  if (!client) {
    return { ok: false, message: "Configure a URL e a Anon Key do Supabase primeiro." };
  }
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Redirecionando para o Google..." };
}

export async function signOutCloud(settings: CloudSettings): Promise<void> {
  const client = getSupabaseClient(settings);
  if (!client) return;
  await client.auth.signOut();
}

export async function syncProgressWithCloud(
  settings: CloudSettings,
  localProgress: UserProgress
): Promise<{ ok: boolean; merged?: UserProgress; message: string }> {
  const client = getSupabaseClient(settings);
  if (!client) {
    return { ok: false, message: "Supabase não configurado." };
  }
  const { data: userData } = await client.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { ok: false, message: "Entre na sua conta primeiro para sincronizar entre dispositivos." };
  }

  const { data: row, error: fetchErr } = await client
    .from("hcia_user_progress")
    .select("progress, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, message: fetchErr.message };
  }

  const merged = row?.progress
    ? mergeUserProgress(localProgress, row.progress as UserProgress)
    : localProgress;

  const { error: upsertErr } = await client.from("hcia_user_progress").upsert(
    {
      user_id: user.id,
      progress: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertErr) {
    return { ok: false, message: upsertErr.message };
  }

  return { ok: true, merged, message: "Sincronizado com sucesso entre a nuvem e o navegador." };
}
