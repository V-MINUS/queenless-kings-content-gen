import { NextResponse } from "next/server";
import { providerStatus } from "@/lib/llm-router";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = process.env as Record<string, string | undefined>;
  const status = providerStatus(env);
  return NextResponse.json({
    ok: true,
    authRequired: Boolean(env.APP_PASSWORD),
    ...status,
  });
}
