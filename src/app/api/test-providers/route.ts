import { NextResponse } from "next/server";
import { PROVIDERS, type Env, type ProviderConfig } from "@/lib/llm-router";

export const maxDuration = 60;

function loadKeys(env: Env, p: ProviderConfig): string[] {
  const raw = env[p.envVar] ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function testProvider(p: ProviderConfig, key: string, env: Env): Promise<{ name: string; ok: boolean; error?: string; ms: number }> {
  const model = env[p.modelEnvVar] ?? p.defaultModel;
  const t0 = Date.now();
  try {
    let r: Response;
    if (p.style === "gemini") {
      const url = `${p.baseUrl}/models/${model}:generateContent?key=${key}`;
      r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "Reply with exactly: OK" }] },
          contents: [{ role: "user", parts: [{ text: "Say OK" }] }],
          generationConfig: { maxOutputTokens: 5, temperature: 0 },
        }),
      });
    } else if (p.style === "cohere") {
      r = await fetch(`${p.baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
          temperature: 0,
        }),
      });
    } else {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      };
      r = await fetch(`${p.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "Reply with exactly: OK" },
            { role: "user", content: "Say OK" },
          ],
          max_tokens: 5,
          temperature: 0,
        }),
      });
    }
    const ms = Date.now() - t0;
    if (!r.ok) {
      const body = await r.text();
      return { name: p.name, ok: false, error: `${r.status}: ${body.slice(0, 200)}`, ms };
    }
    return { name: p.name, ok: true, ms };
  } catch (e) {
    return { name: p.name, ok: false, error: e instanceof Error ? e.message : String(e), ms: Date.now() - t0 };
  }
}

export async function GET() {
  const env = process.env as Record<string, string | undefined>;
  const results = [];

  for (const p of PROVIDERS) {
    const keys = loadKeys(env, p);
    if (keys.length === 0) continue;
    const result = await testProvider(p, keys[0], env);
    results.push({ ...result, model: env[p.modelEnvVar] ?? p.defaultModel });
  }

  return NextResponse.json({ results });
}
