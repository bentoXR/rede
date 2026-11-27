import React, { useState } from "react";
import { Cloud, Download, LogOut, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import type { CloudSettings, LanguagePref, UserProgress } from "../types/progress";
import { t } from "../i18n/ui";
import {
  signInWithGoogle,
  signInWithMagicLink,
  signOutCloud,
  syncProgressWithCloud,
} from "../lib/sync";
import { createDefaultProgress } from "../lib/storage";

interface SettingsSyncModalProps {
  open: boolean;
  onClose: () => void;
  settings: CloudSettings;
  onSaveSettings: (next: CloudSettings) => void;
  progress: UserProgress;
  onReplaceProgress: (next: UserProgress) => void;
  userEmail: string | null;
  onAuthChanged: () => void;
  lang: LanguagePref;
}

export const SettingsSyncModal: React.FC<SettingsSyncModalProps> = ({
  open,
  onClose,
  settings,
  onSaveSettings,
  progress,
  onReplaceProgress,
  userEmail,
  onAuthChanged,
  lang,
}) => {
  const ui = t(lang);
  const [tab, setTab] = useState<"cloud" | "ai" | "backup">("cloud");
  const [draft, setDraft] = useState<CloudSettings>(settings);
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    onSaveSettings(draft);
    setStatusMsg("Configurações salvas localmente neste navegador.");
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    onSaveSettings(draft);
    const res = await signInWithMagicLink(draft, email.trim());
    setStatusMsg(res.message);
    setBusy(false);
  };

  const handleSyncNow = async () => {
    setBusy(true);
    onSaveSettings(draft);
    const res = await syncProgressWithCloud(draft, progress);
    if (res.ok && res.merged) {
      onReplaceProgress(res.merged);
    }
    setStatusMsg(res.message);
    setBusy(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hcia-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as UserProgress;
      onReplaceProgress(parsed);
      setStatusMsg("Backup importado com sucesso.");
    } catch {
      setStatusMsg("Arquivo JSON de backup inválido.");
    }
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
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#E2DDD3] bg-[#FAF9F6] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E8E4DC] bg-white px-6 py-4">
          <h2 className="font-display text-lg font-extrabold text-[#111827]">
            {ui.settingsTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-[#E8E4DC] bg-white px-6 py-2.5">
          <button
            type="button"
            onClick={() => setTab("cloud")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-bold ${
              tab === "cloud" ? "bg-[#18181B] text-white" : "text-zinc-600 hover:bg-stone-100"
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>{ui.supabaseTab}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("ai")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-bold ${
              tab === "ai" ? "bg-[#18181B] text-white" : "text-zinc-600 hover:bg-stone-100"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{ui.aiTab}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("backup")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-bold ${
              tab === "backup" ? "bg-[#18181B] text-white" : "text-zinc-600 hover:bg-stone-100"
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{ui.backupTab}</span>
          </button>
        </div>

        <div className="space-y-4 p-6">
          {tab === "cloud" && (
            <>
              <p className="text-xs leading-relaxed font-medium text-zinc-600">
                Sincronize lições concluídas, ofensiva, favoritos e grifos entre PC e celular usando
                um projeto gratuito do <strong>Supabase</strong> (esquema incluído em{" "}
                <code className="rounded bg-stone-200 px-1 py-0.5">supabase/schema.sql</code>).
              </p>

              <div className="space-y-2.5">
                <label className="block">
                  <span className="font-display text-xs font-bold text-zinc-700">URL do Supabase</span>
                  <input
                    type="url"
                    value={draft.supabaseUrl}
                    onChange={(e) => setDraft({ ...draft, supabaseUrl: e.target.value })}
                    placeholder="https://xyzcompany.supabase.co"
                    className="mt-1 w-full rounded-xl border border-[#E2DDD3] bg-white px-3 py-2 text-xs font-medium outline-hidden focus:border-blue-600"
                  />
                </label>
                <label className="block">
                  <span className="font-display text-xs font-bold text-zinc-700">
                    Chave Pública (Anon Key) do Supabase
                  </span>
                  <input
                    type="password"
                    value={draft.supabaseAnonKey}
                    onChange={(e) => setDraft({ ...draft, supabaseAnonKey: e.target.value })}
                    placeholder="eyJhbGciOi..."
                    className="mt-1 w-full rounded-xl border border-[#E2DDD3] bg-white px-3 py-2 text-xs font-medium outline-hidden focus:border-blue-600"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-xl border border-[#E2DDD3] bg-white px-4 py-2 font-display text-xs font-bold text-zinc-800 hover:bg-stone-100"
                >
                  {ui.saveCredentials}
                </button>
              </div>

              {userEmail ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-display text-xs font-extrabold text-emerald-900">
                    Conectado como {userEmail}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleSyncNow}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 font-display text-xs font-bold text-white hover:bg-emerald-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>{ui.syncNow}</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await signOutCloud(draft);
                        onAuthChanged();
                        setStatusMsg("Sessão encerrada.");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 font-display text-xs font-bold text-emerald-900"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{ui.signOut}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-2.5 border-t border-[#E8E4DC] pt-4">
                  <p className="font-display text-xs font-extrabold text-zinc-800">
                    {ui.signInToSync}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
                      className="flex-1 rounded-xl border border-[#E2DDD3] bg-white px-3 py-2 text-xs font-medium outline-hidden focus:border-blue-600"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-xl bg-[#18181B] px-4 py-2 font-display text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Link Mágico
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      onSaveSettings(draft);
                      const res = await signInWithGoogle(draft);
                      setStatusMsg(res.message);
                    }}
                    className="w-full rounded-xl border border-[#E2DDD3] bg-white px-4 py-2 font-display text-xs font-bold text-zinc-800 hover:bg-stone-100"
                  >
                    {ui.continueGoogle}
                  </button>
                </form>
              )}
            </>
          )}

          {tab === "ai" && (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed font-medium text-zinc-600">
                Use seu <strong>Cloudflare Tutor Worker</strong> implantado (recomendado para
                hospedagem pública) ou cole uma chave gratuita da <strong>Gemini API</strong>{" "}
                armazenada apenas no seu navegador.
              </p>
              <label className="block">
                <span className="font-display text-xs font-bold text-zinc-700">
                  URL do Cloudflare Tutor Worker
                </span>
                <input
                  type="url"
                  value={draft.tutorWorkerUrl}
                  onChange={(e) => setDraft({ ...draft, tutorWorkerUrl: e.target.value })}
                  placeholder="https://hcia-tutor.seunome.workers.dev"
                  className="mt-1 w-full rounded-xl border border-[#E2DDD3] bg-white px-3 py-2 text-xs font-medium outline-hidden focus:border-blue-600"
                />
              </label>
              <label className="block">
                <span className="font-display text-xs font-bold text-zinc-700">
                  Ou Chave Direta da Gemini API (opcional)
                </span>
                <input
                  type="password"
                  value={draft.geminiApiKey}
                  onChange={(e) => setDraft({ ...draft, geminiApiKey: e.target.value })}
                  placeholder="AIza..."
                  className="mt-1 w-full rounded-xl border border-[#E2DDD3] bg-white px-3 py-2 text-xs font-medium outline-hidden focus:border-blue-600"
                />
              </label>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-[#18181B] px-5 py-2.5 font-display text-xs font-bold text-white hover:bg-blue-700"
              >
                {ui.saveAiConfig}
              </button>
            </div>
          )}

          {tab === "backup" && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-zinc-600">
                Exporte seu progresso, grifos, favoritos e acertos em desafios como JSON, ou
                restaure a partir de um arquivo anterior.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#18181B] px-4 py-2.5 font-display text-xs font-bold text-white hover:bg-blue-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{ui.exportJson}</span>
                </button>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-white px-4 py-2.5 font-display text-xs font-bold text-zinc-800 hover:bg-stone-100">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{ui.importJson}</span>
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
              <div className="border-t border-[#E8E4DC] pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onReplaceProgress(createDefaultProgress());
                    setStatusMsg("Progresso local zerado.");
                  }}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 font-display text-xs font-bold text-rose-800 hover:bg-rose-100"
                >
                  {ui.resetLocal}
                </button>
              </div>
            </div>
          )}

          {statusMsg && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-blue-900">
              {statusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
