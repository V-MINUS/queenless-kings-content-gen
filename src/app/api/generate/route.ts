import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/llm-router";
import {
  QK_SYSTEM_PROMPT,
  buildPresetUserPrompt,
  buildEditUserPrompt,
  type PresetRequest,
  type EditRequest,
} from "@/lib/prompts";
import { checkPassword } from "@/lib/auth";

export const maxDuration = 30;

interface Body {
  mode: "preset" | "edit" | "freeform";
  preset?: PresetRequest;
  edit?: EditRequest;
  freeform?: string;
  maxTokens?: number;
  temperature?: number;
}

function getEnv(): Record<string, string | undefined> {
  // On Cloudflare Pages, process.env is populated from bindings.
  return process.env as Record<string, string | undefined>;
}

export async function POST(req: NextRequest) {
  const env = getEnv();
  const auth = checkPassword(req, env);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let userPrompt = "";
  if (body.mode === "preset" && body.preset) {
    if (!body.preset.details?.trim()) {
      return NextResponse.json({ error: "details is required" }, { status: 400 });
    }
    userPrompt = buildPresetUserPrompt(body.preset);
  } else if (body.mode === "edit" && body.edit) {
    if (!body.edit.current?.trim()) {
      return NextResponse.json({ error: "current text is required" }, { status: 400 });
    }
    userPrompt = buildEditUserPrompt(body.edit);
  } else if (body.mode === "freeform" && body.freeform) {
    userPrompt = body.freeform;
  } else {
    return NextResponse.json({ error: "Invalid mode or missing payload" }, { status: 400 });
  }

  try {
    const result = await generate(env, {
      system: QK_SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: body.maxTokens ?? 600,
      temperature: body.temperature ?? 0.7,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg.startsWith("No API keys") ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
