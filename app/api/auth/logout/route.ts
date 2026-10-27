import { sameOrigin } from "@/lib/auth-core";
import { serializeCookie } from "@/lib/auth";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", serializeCookie(request, "session", "", 0));
  headers.append("Set-Cookie", serializeCookie(request, "challenge", "", 0));
  return Response.json({ ok: true }, { headers });
}
