"use client";

import { useEffect, useState } from "react";
import {
  PLATFORM_LABELS,
  PLATFORM_CHAR_LIMITS,
  POST_TYPE_LABELS,
  type Platform,
  type Tone,
  type PostType,
  type HashtagStyle,
  type EditAction,
} from "@/lib/prompts";

const POST_TYPES: PostType[] = [
  "gig-announcement",
  "music-release",
  "behind-the-scenes",
  "merchandise",
  "band-update",
  "fan-engagement",
];
const PLATFORMS: Platform[] = ["instagram", "facebook", "tiktok", "twitter"];
const TONES: Tone[] = ["casual", "excited", "professional", "humorous", "heartfelt"];
const HASHTAG_STYLES: HashtagStyle[] = ["auto", "none", "minimal", "heavy"];

interface GenerateResult {
  text: string;
  provider: string;
  model: string;
  keyIndex: number;
  totalKeys: number;
  attempts: number;
  elapsedMs: number;
}

interface StatusResp {
  ok: boolean;
  authRequired: boolean;
  totalKeys: number;
  totalProviders: number;
  providers: Array<{
    name: string;
    enabled: boolean;
    keysConfigured: number;
    model: string;
    freeTier: string;
  }>;
}

export default function HomePage() {
  const [authRequired, setAuthRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [tab, setTab] = useState<"presets" | "freeform">("presets");

  // Preset form (matches the home-server dashboard)
  const [postType, setPostType] = useState<PostType>("band-update");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tone, setTone] = useState<Tone>("casual");
  const [hashtagStyle, setHashtagStyle] = useState<HashtagStyle>("auto");
  const [details, setDetails] = useState("");
  const [cta, setCta] = useState("");

  const [freeformInput, setFreeformInput] = useState("");

  const [output, setOutput] = useState("");
  const [meta, setMeta] = useState<GenerateResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((s: StatusResp) => {
        setStatus(s);
        setAuthRequired(s.authRequired);
        if (s.authRequired) {
          const stored = typeof window !== "undefined" ? localStorage.getItem("qk_pw") : null;
          if (stored) setPassword(stored);
        }
      })
      .catch(() => undefined);
  }, []);

  async function callGenerate(payload: object) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-app-password": password },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? `HTTP ${r.status}`);
        return;
      }
      setOutput(data.text);
      setMeta(data);
      if (authRequired && password) localStorage.setItem("qk_pw", password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onPresetGenerate() {
    if (!details.trim()) {
      setError("Add some details about the post first");
      return;
    }
    await callGenerate({
      mode: "preset",
      preset: { postType, platform, tone, hashtagStyle, details, cta },
    });
  }

  async function onFreeformGenerate() {
    if (!freeformInput.trim()) {
      setError("Enter an instruction");
      return;
    }
    await callGenerate({ mode: "freeform", freeform: freeformInput });
  }

  async function onEdit(action: EditAction) {
    if (!output.trim()) return;
    await callGenerate({
      mode: "edit",
      edit: { action, current: output, platform, newTone: tone },
    });
  }

  async function onCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  }

  const charLimit = PLATFORM_CHAR_LIMITS[platform];

  return (
    <div className="min-h-screen w-full">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">QK Content Generator</h1>
          <p className="text-xs text-muted-foreground">
            Queenless Kings · social post AI ·{" "}
            {status
              ? `${status.totalKeys} key(s) across ${status.totalProviders} provider(s)`
              : "loading…"}
          </p>
        </div>
        {authRequired ? (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="px-3 py-2 rounded-md border border-input bg-background text-sm w-48"
          />
        ) : null}
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-4">
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setTab("presets")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === "presets"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setTab("freeform")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === "freeform"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Freeform
            </button>
          </div>

          {tab === "presets" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Post type
                  </label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as PostType)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    {POST_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {POST_TYPE_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as Platform)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM_LABELS[p]} · {PLATFORM_CHAR_LIMITS[p]}c
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as Tone)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm capitalize"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t} className="capitalize">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Hashtag style
                  </label>
                  <select
                    value={hashtagStyle}
                    onChange={(e) => setHashtagStyle(e.target.value as HashtagStyle)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="auto">Auto (platform appropriate)</option>
                    <option value="none">None</option>
                    <option value="minimal">Minimal (3-5)</option>
                    <option value="heavy">Heavy (10-15, IG)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  What&apos;s the post about?
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  placeholder="e.g. We're playing The Limelight Belfast on June 14 supporting Foo Fighters — doors 7pm, tickets £20 on the website"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Call to action <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="e.g. Grab tickets now / Check the link in bio"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>

              <button
                onClick={onPresetGenerate}
                disabled={busy}
                className="w-full px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition"
              >
                {busy ? "Generating…" : "Generate post"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Freeform prompt
                </label>
                <textarea
                  value={freeformInput}
                  onChange={(e) => setFreeformInput(e.target.value)}
                  rows={10}
                  placeholder={
                    "Write whatever you want here.\n\nExample: 'Write a thank-you post to fans for sold-out gig last night at Connolly\\'s of Leap.'"
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-y font-mono"
                />
              </div>
              <button
                onClick={onFreeformGenerate}
                disabled={busy}
                className="w-full px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition"
              >
                {busy ? "Generating…" : "Generate"}
              </button>
            </div>
          )}

          {error ? (
            <div className="px-3 py-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          ) : null}

          {status ? (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground select-none">
                Providers ({status.totalProviders} active, {status.totalKeys} total keys)
              </summary>
              <ul className="mt-2 space-y-1 pl-4">
                {status.providers.map((p) => (
                  <li key={p.name} className="flex justify-between gap-3">
                    <span className={p.enabled ? "text-foreground" : ""}>
                      {p.enabled ? "✓" : "·"} {p.name}
                    </span>
                    <span className="text-right truncate">
                      {p.enabled ? `${p.keysConfigured} key(s) · ${p.model}` : p.freeTier}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Output {output ? `· ${output.length}/${charLimit} chars` : ""}
            </label>
            {meta ? (
              <span className="text-xs text-muted-foreground">
                {meta.provider} · {meta.model} · key {meta.keyIndex}/{meta.totalKeys} ·{" "}
                {meta.elapsedMs}ms
              </span>
            ) : null}
          </div>

          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            rows={20}
            placeholder="Generated content will appear here. You can edit it freely."
            className="w-full px-4 py-3 rounded-md border border-input bg-background text-sm font-mono resize-y leading-relaxed"
          />

          {output ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onEdit("regenerate")}
                disabled={busy}
                className="px-3 py-1.5 text-xs rounded-md border border-input hover:bg-accent disabled:opacity-50"
              >
                Regenerate
              </button>
              <button
                onClick={() => onEdit("shorten")}
                disabled={busy}
                className="px-3 py-1.5 text-xs rounded-md border border-input hover:bg-accent disabled:opacity-50"
              >
                Shorten
              </button>
              <button
                onClick={() => onEdit("lengthen")}
                disabled={busy}
                className="px-3 py-1.5 text-xs rounded-md border border-input hover:bg-accent disabled:opacity-50"
              >
                Lengthen
              </button>
              <button
                onClick={() => onEdit("tone")}
                disabled={busy}
                className="px-3 py-1.5 text-xs rounded-md border border-input hover:bg-accent disabled:opacity-50"
              >
                Apply tone: {tone}
              </button>
              <button
                onClick={onCopy}
                className="ml-auto px-3 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80"
              >
                Copy
              </button>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-6 border-t border-border mt-8">
        Queenless Kings — content generator ·{" "}
        <a href="https://github.com/V-MINUS/qk-content-generator" className="underline">
          GitHub
        </a>
      </footer>
    </div>
  );
}
