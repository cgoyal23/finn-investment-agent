import { runtimeValue } from "@/lib/runtime-env";
import { authConfigured, authCookie, serializeCookie } from "@/lib/auth";
import {
  sameOrigin,
  cookieValue,
  verifyChallenge,
  verifyGoogleCredential,
  createSession,
} from "@/lib/auth-core";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Sign-in must start from FINN." },
      { status: 403 },
    );
  if (!authConfigured())
    return Response.json(
      {
        error:
          "Google sign-in needs the owner’s Google Client ID before it can be activated.",
      },
      { status: 503 },
    );
  try {
    const body = (await request.json()) as {
      credential?: string;
      csrfToken?: string;
    };
    if (
      typeof body.credential !== "string" ||
      body.credential.length > 10000 ||
      typeof body.csrfToken !== "string"
    )
      throw new Error();
    const nonce = await verifyChallenge(
      cookieValue(request, authCookie(request, "challenge")),
      body.csrfToken,
      runtimeValue("SESSION_SECRET"),
    );
    if (!nonce) throw new Error();
    const user = await verifyGoogleCredential(
      body.credential,
      runtimeValue("GOOGLE_CLIENT_ID"),
      nonce,
    );
    const session = await createSession(user, runtimeValue("SESSION_SECRET"));
    const headers = new Headers({ "Cache-Control": "no-store" });
    headers.append(
      "Set-Cookie",
      serializeCookie(request, "session", session, 604800),
    );
    headers.append("Set-Cookie", serializeCookie(request, "challenge", "", 0));
    return Response.json({ user }, { headers });
  } catch {
    return Response.json(
      {
        error:
          "Google could not verify this sign-in. Reload the page and try again.",
      },
      { status: 401 },
    );
  }
}
