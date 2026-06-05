/**
 * QK LLM Router — round-robin + failover across multiple free-tier providers.
 *
 * Edge-runtime safe (uses fetch only, no Node.js APIs).
 * Each request picks the next provider/key in round-robin order; on failure
 * we cycle through all available keys before giving up.
 *
 * Add keys via comma-separated env vars:
 *   GROQ_API_KEYS, GEMINI_API_KEYS, OPENROUTER_API_KEYS, CEREBRAS_API_KEYS,
 *   GITHUB_MODELS_TOKENS, MISTRAL_API_KEYS, COHERE_API_KEYS,
 *   TOGETHER_API_KEYS, DEEPSEEK_API_KEYS, OPENAI_API_KEYS
 */

export type ProviderName =
  | "groq"
  | "gemini"
  | "openrouter"
  | "cerebras"
  | "github_models"
  | "mistral"
  | "cohere"
  | "together"
  | "deepseek"
  | "openai"
  | "pollinations"
  | "hyperbolic"
  | "nvidia"
  | "huggingface"
  | "sambanova"
  | "xai";

export interface ProviderConfig {
  name: ProviderName;
  envVar: string;
  modelEnvVar: string;
  defaultModel: string;
  baseUrl: string;
  /** Provider API style. "openai" works for any OpenAI-compatible /chat/completions endpoint. */
  style: "openai" | "gemini" | "cohere";
  /** Free-tier hint (used in /api/status) */
  freeTier: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    name: "groq",
    envVar: "GROQ_API_KEYS",
    modelEnvVar: "GROQ_MODEL",
    defaultModel: "llama-3.3-70b-versatile",
    baseUrl: "https://api.groq.com/openai/v1",
    style: "openai",
    freeTier: "30 req/min, very fast inference",
  },
  {
    name: "cerebras",
    envVar: "CEREBRAS_API_KEYS",
    modelEnvVar: "CEREBRAS_MODEL",
    defaultModel: "llama3.1-70b",
    baseUrl: "https://api.cerebras.ai/v1",
    style: "openai",
    freeTier: "1M tokens/day, fastest inference",
  },
  {
    name: "gemini",
    envVar: "GEMINI_API_KEYS",
    modelEnvVar: "GEMINI_MODEL",
    defaultModel: "gemini-2.0-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    style: "gemini",
    freeTier: "15 req/min, 1500/day",
  },
  {
    name: "openrouter",
    envVar: "OPENROUTER_API_KEYS",
    modelEnvVar: "OPENROUTER_MODEL",
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
    baseUrl: "https://openrouter.ai/api/v1",
    style: "openai",
    freeTier: "free models available, 20 req/min on free",
  },
  {
    name: "github_models",
    envVar: "GITHUB_MODELS_TOKENS",
    modelEnvVar: "GITHUB_MODELS_MODEL",
    defaultModel: "gpt-4o-mini",
    baseUrl: "https://models.inference.ai.azure.com",
    style: "openai",
    freeTier: "free with GitHub PAT, 50 req/day per model",
  },
  {
    name: "mistral",
    envVar: "MISTRAL_API_KEYS",
    modelEnvVar: "MISTRAL_MODEL",
    defaultModel: "mistral-small-latest",
    baseUrl: "https://api.mistral.ai/v1",
    style: "openai",
    freeTier: "1 req/sec, 500k tokens/min on free experimental",
  },
  {
    name: "cohere",
    envVar: "COHERE_API_KEYS",
    modelEnvVar: "COHERE_MODEL",
    defaultModel: "command-r-08-2024",
    baseUrl: "https://api.cohere.com/v2",
    style: "cohere",
    freeTier: "1000 req/month trial keys",
  },
  {
    name: "together",
    envVar: "TOGETHER_API_KEYS",
    modelEnvVar: "TOGETHER_MODEL",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    baseUrl: "https://api.together.xyz/v1",
    style: "openai",
    freeTier: "$1 free credit, free models available",
  },
  {
    name: "deepseek",
    envVar: "DEEPSEEK_API_KEYS",
    modelEnvVar: "DEEPSEEK_MODEL",
    defaultModel: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1",
    style: "openai",
    freeTier: "small free credit on signup, cheap paid",
  },
  {
    name: "openai",
    envVar: "OPENAI_API_KEYS",
    modelEnvVar: "OPENAI_MODEL",
    defaultModel: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    style: "openai",
    freeTier: "paid only, no free tier",
  },
  {
    name: "pollinations",
    envVar: "POLLINATIONS_API_KEYS",
    modelEnvVar: "POLLINATIONS_MODEL",
    defaultModel: "openai",
    baseUrl: "https://text.pollinations.ai/openai",
    style: "openai",
    freeTier: "completely free, no signup, anonymous (set any token like 'free' as key)",
  },
  {
    name: "hyperbolic",
    envVar: "HYPERBOLIC_API_KEYS",
    modelEnvVar: "HYPERBOLIC_MODEL",
    defaultModel: "meta-llama/Meta-Llama-3.1-70B-Instruct",
    baseUrl: "https://api.hyperbolic.xyz/v1",
    style: "openai",
    freeTier: "$10 free credit on signup",
  },
  {
    name: "nvidia",
    envVar: "NVIDIA_API_KEYS",
    modelEnvVar: "NVIDIA_MODEL",
    defaultModel: "meta/llama-3.1-70b-instruct",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    style: "openai",
    freeTier: "1000 free credits on signup, generous monthly limits",
  },
  {
    name: "huggingface",
    envVar: "HUGGINGFACE_API_KEYS",
    modelEnvVar: "HUGGINGFACE_MODEL",
    defaultModel: "meta-llama/Llama-3.1-8B-Instruct",
    baseUrl: "https://api-inference.huggingface.co/v1",
    style: "openai",
    freeTier: "free with HF token, rate-limited but unlimited monthly",
  },
  {
    name: "sambanova",
    envVar: "SAMBANOVA_API_KEYS",
    modelEnvVar: "SAMBANOVA_MODEL",
    defaultModel: "Meta-Llama-3.1-70B-Instruct",
    baseUrl: "https://api.sambanova.ai/v1",
    style: "openai",
    freeTier: "free tier with reasonable daily limits, very fast",
  },
  {
    name: "xai",
    envVar: "XAI_API_KEYS",
    modelEnvVar: "XAI_MODEL",
    defaultModel: "grok-beta",
    baseUrl: "https://api.x.ai/v1",
    style: "openai",
    freeTier: "$25 free credit/month if you opt into data sharing",
  },
];

export type Env = Record<string, string | undefined>;

interface CallArgs {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
}

interface CallResult {
  text: string;
  provider: ProviderName;
  model: string;
  keyIndex: number;
  totalKeys: number;
  attempts: number;
  elapsedMs: number;
}

/** Module-level rotation cursor (per Worker instance — survives within a single edge isolate). */
const cursor = {
  global: 0,
  perProvider: new Map<string, number>(),
};

function loadKeys(env: Env, p: ProviderConfig): string[] {
  const raw = env[p.envVar] ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function availableProviders(env: Env): ProviderConfig[] {
  return PROVIDERS.filter((p) => loadKeys(env, p).length > 0);
}

function pickNext(env: Env): {
  provider: ProviderConfig;
  key: string;
  keyIndex: number;
  totalKeys: number;
} | null {
  const providers = availableProviders(env);
  if (providers.length === 0) return null;

  const idx = cursor.global % providers.length;
  cursor.global++;
  const provider = providers[idx];

  const keys = loadKeys(env, provider);
  const ki = (cursor.perProvider.get(provider.name) ?? 0) % keys.length;
  cursor.perProvider.set(provider.name, ki + 1);

  return { provider, key: keys[ki], keyIndex: ki, totalKeys: keys.length };
}

// ──────────────────────────────────────────────────────────────────
// Provider-specific HTTP callers
// ──────────────────────────────────────────────────────────────────

async function callOpenAICompat(
  p: ProviderConfig,
  key: string,
  model: string,
  args: CallArgs
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  // OpenRouter requires a referrer to identify your app
  if (p.name === "openrouter") {
    headers["HTTP-Referer"] = "https://social.queenlesskingsband.com";
    headers["X-Title"] = "QK Content Generator";
  }
  const r = await fetch(`${p.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
      max_tokens: args.maxTokens,
      temperature: args.temperature,
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`${p.name} ${r.status}: ${body.slice(0, 300)}`);
  }
  const data = (await r.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return text.trim();
}

async function callGemini(
  p: ProviderConfig,
  key: string,
  model: string,
  args: CallArgs
): Promise<string> {
  const url = `${p.baseUrl}/models/${model}:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: args.system }] },
      contents: [{ role: "user", parts: [{ text: args.user }] }],
      generationConfig: {
        maxOutputTokens: args.maxTokens,
        temperature: args.temperature,
      },
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`gemini ${r.status}: ${body.slice(0, 300)}`);
  }
  const data = (await r.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((x) => x.text ?? "")
    .join("")
    .trim();
}

async function callCohere(
  p: ProviderConfig,
  key: string,
  model: string,
  args: CallArgs
): Promise<string> {
  const r = await fetch(`${p.baseUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
      max_tokens: args.maxTokens,
      temperature: args.temperature,
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`cohere ${r.status}: ${body.slice(0, 300)}`);
  }
  const data = (await r.json()) as {
    message?: { content?: Array<{ text?: string }> };
  };
  const parts = data.message?.content ?? [];
  return parts
    .map((x) => x.text ?? "")
    .join("")
    .trim();
}

function dispatch(
  p: ProviderConfig,
  key: string,
  model: string,
  args: CallArgs
): Promise<string> {
  switch (p.style) {
    case "gemini":
      return callGemini(p, key, model, args);
    case "cohere":
      return callCohere(p, key, model, args);
    default:
      return callOpenAICompat(p, key, model, args);
  }
}

// ──────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────

export class NoProvidersConfiguredError extends Error {
  constructor() {
    super(
      "No API keys configured. Set at least one of: " +
        PROVIDERS.map((p) => p.envVar).join(", ")
    );
    this.name = "NoProvidersConfiguredError";
  }
}

export async function generate(
  env: Env,
  args: CallArgs,
  options: { maxRetries?: number } = {}
): Promise<CallResult> {
  const providers = availableProviders(env);
  if (providers.length === 0) throw new NoProvidersConfiguredError();

  const totalKeys = providers.reduce(
    (sum, p) => sum + loadKeys(env, p).length,
    0
  );
  const cap = options.maxRetries ?? totalKeys;
  const errors: string[] = [];
  const t0 = Date.now();

  for (let attempt = 0; attempt < cap; attempt++) {
    const sel = pickNext(env);
    if (!sel) break;
    const { provider, key, keyIndex, totalKeys: nk } = sel;
    const model = env[provider.modelEnvVar] ?? provider.defaultModel;
    try {
      const text = await dispatch(provider, key, model, args);
      if (!text) throw new Error("empty response");
      return {
        text,
        provider: provider.name,
        model,
        keyIndex: keyIndex + 1,
        totalKeys: nk,
        attempts: attempt + 1,
        elapsedMs: Date.now() - t0,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${provider.name}: ${msg}`);
      continue;
    }
  }

  throw new Error(
    `All ${cap} provider attempts failed. Recent errors: ${errors
      .slice(-3)
      .join(" | ")}`
  );
}

export function providerStatus(env: Env): {
  providers: Array<{
    name: ProviderName;
    enabled: boolean;
    keysConfigured: number;
    model: string;
    freeTier: string;
  }>;
  totalKeys: number;
  totalProviders: number;
} {
  const list = PROVIDERS.map((p) => {
    const keys = loadKeys(env, p);
    return {
      name: p.name,
      enabled: keys.length > 0,
      keysConfigured: keys.length,
      model: env[p.modelEnvVar] ?? p.defaultModel,
      freeTier: p.freeTier,
    };
  });
  return {
    providers: list,
    totalKeys: list.reduce((s, p) => s + p.keysConfigured, 0),
    totalProviders: list.filter((p) => p.enabled).length,
  };
}
