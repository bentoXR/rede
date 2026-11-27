import React, { useState } from "react";
import { Cloud, LogOut, RefreshCw, X } from "lucide-react";
import type { CloudSettings, UserProgress } from "../types/progress";
import {
  signInWithPassword,
  signOutCloud,
  signUpWithPassword,
  syncProgressWithCloud,
} from "../lib/sync";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  settings: CloudSettings;
  progress: UserProgress;
  onReplaceProgress: (next: UserProgress) => void;
  userEmail: string | null;
  onAuthChanged: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  settings,
  progress,
  onReplaceProgress,
  userEmail,
  onAuthChanged,
}) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setStatusMsg(null);
    setIsError(false);

    if (mode === "login") {
      const res = await signInWithPassword(settings, email.trim(), password);
      setIsError(!res.ok);
      setStatusMsg(res.message);
      if (res.ok) {
        onAuthChanged();
        setPassword("");
      }
    } else {
      const res = await signUpWithPassword(settings, email.trim(), password);
      setIsError(!res.ok);
      setStatusMsg(res.message);
      if (res.ok && !res.needsConfirmation) {
        onAuthChanged();
        setPassword("");
      }
    }
    setBusy(false);
  };

  const handleSyncNow = async () => {
    setBusy(true);
    setStatusMsg(null);
    setIsError(false);
    const res = await syncProgressWithCloud(settings, progress);
    if (res.ok && res.merged) {
      onReplaceProgress(res.merged);
    }
    setIsError(!res.ok);
    setStatusMsg(res.message);
    setBusy(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-75 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-[#E2DDD3] bg-[#FAF9F6] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E8E4DC] bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-600" />
            <h2 className="font-display text-base font-extrabold text-[#111827]">
              {userEmail ? "Conta Conectada" : "Entrar para Sincronizar"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-500 hover:bg-zinc-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {userEmail ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-display text-xs font-extrabold text-emerald-900">
                  Conectado como {userEmail}
                </p>
                <p className="mt-1 text-xs font-medium text-emerald-800">
                  Seu progresso, grifos e favoritos ficam salvos e sincronizados entre PC e celular.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSyncNow}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#18181B] px-4 py-2.5 font-display text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
                  <span>Sincronizar agora</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await signOutCloud(settings);
                    onAuthChanged();
                    setStatusMsg("Sessão encerrada.");
                    setIsError(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-white px-4 py-2.5 font-display text-xs font-bold text-zinc-800 hover:bg-stone-100"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs leading-relaxed font-medium text-zinc-600">
                Seu progresso já é salvo automaticamente neste navegador. Entre com e-mail e senha
                apenas se quiser sincronizar entre PC e celular.
              </p>

              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#E2DDD3] bg-white p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setStatusMsg(null);
                  }}
                  className={`rounded-lg py-1.5 font-display text-xs font-bold transition ${
                    mode === "login" ? "bg-[#18181B] text-white" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setStatusMsg(null);
                  }}
                  className={`rounded-lg py-1.5 font-display text-xs font-bold transition ${
                    mode === "signup"
                      ? "bg-[#18181B] text-white"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Criar conta
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block">
                  <span className="font-display text-xs font-bold text-zinc-700">E-mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="mt-1 w-full rounded-xl border border-[#E2DDD3] bg-white px-3.5 py-2.5 text-sm font-medium outline-hidden focus:border-blue-600"
                  />
                </label>
                <label className="block">
                  <span className="font-display text-xs font-bold text-zinc-700">Senha</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="mt-1 w-full rounded-xl border border-[#E2DDD3] bg-white px-3.5 py-2.5 text-sm font-medium outline-hidden focus:border-blue-600"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-[#18181B] py-2.5 font-display text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy
                    ? "Aguarde..."
                    : mode === "login"
                      ? "Entrar na conta"
                      : "Criar conta e conectar"}
                </button>
              </form>
            </>
          )}

          {statusMsg && (
            <div
              className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                isError
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-blue-200 bg-blue-50 text-blue-900"
              }`}
            >
              {statusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
