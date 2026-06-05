/**
 * Optional shared-password gate. Set APP_PASSWORD in env to enable.
 * Sends/expects a bearer-style token in `x-app-password` header.
 * If APP_PASSWORD is not set, all requests are allowed (single-user mode).
 */
export function checkPassword(req: Request, env: Record<string, string | undefined>): { ok: boolean; reason?: string } {
  const required = env.APP_PASSWORD;
  if (!required) return { ok: true };
  const provided = req.headers.get("x-app-password") ?? "";
  if (provided.length === 0) return { ok: false, reason: "Password required" };
  if (provided !== required) return { ok: false, reason: "Wrong password" };
  return { ok: true };
}
