import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { CloudSettings, UserProgress } from "../types/progress";
import { mergeUserProgress } from "./storage";

let cachedClient: SupabaseClient | null = null;
let cachedKey = "";

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (lower.includes("user already registered")) {
    return "Este e-mail já possui uma conta. Tente entrar.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).";
  }
  if (lower.includes("password should be at least")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  if (lower.includes("unable to validate email address") || lower.includes("invalid email")) {
    return "Digite um endereço de e-mail válido.";
  }
  return message;
}

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

export async function signInWithPassword(
  settings: CloudSettings,
  email: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient(settings);
  if (!client) {
    return { ok: false, message: "Serviço de sincronização indisponível." };
  }
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: translateAuthError(error.message) };
  return { ok: true, message: "Conectado com sucesso!" };
}

export async function signUpWithPassword(
  settings: CloudSettings,
  email: string,
  password: string
): Promise<{ ok: boolean; needsConfirmation?: boolean; message: string }> {
  const client = getSupabaseClient(settings);
  if (!client) {
    return { ok: false, message: "Serviço de sincronização indisponível." };
  }
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.href },
  });
  if (error) return { ok: false, message: translateAuthError(error.message) };
  if (!data.session) {
    return {
      ok: true,
      needsConfirmation: true,
      message: "Conta criada! Verifique seu e-mail para confirmar o cadastro e depois entre.",
    };
  }
  return { ok: true, message: "Conta criada e conectada!" };
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
    return { ok: false, message: "Sincronização indisponível." };
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

  return { ok: true, merged, message: "Progresso sincronizado com sucesso." };
}
