import { runtimeValue } from "@/lib/runtime-env";
import { authConfigured, currentUser, serializeCookie } from "@/lib/auth";
import { createChallenge } from "@/lib/auth-core";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const configured = authConfigured();
  const user = await currentUser(request);
  const headers = new Headers({ "Cache-Control": "no-store" });
  let challenge: { nonce: string; csrf: string; token: string } | null = null;
  if (configured && !user) {
    challenge = await createChallenge(runtimeValue("SESSION_SECRET"));
    headers.append(
      "Set-Cookie",
      serializeCookie(request, "challenge", challenge.token, 600),
    );
  }
  return Response.json(
    {
      configured,
      user,
      clientId: configured ? runtimeValue("GOOGLE_CLIENT_ID") : null,
      nonce: challenge?.nonce || null,
      csrfToken: challenge?.csrf || null,
    },
    { headers },
  );
}
