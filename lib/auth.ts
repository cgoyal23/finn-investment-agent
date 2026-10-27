import { runtimeValue } from "./runtime-env";
import { cookieValue, verifySession } from "./auth-core";
export function authConfigured() {
  return (
    !!runtimeValue("GOOGLE_CLIENT_ID") &&
    runtimeValue("SESSION_SECRET").length >= 32
  );
}
export function authCookie(request: Request, part: "session" | "challenge") {
  return (
    (new URL(request.url).protocol === "https:" ? "__Host-" : "") +
    "finn_" +
    part
  );
}
export function serializeCookie(
  request: Request,
  part: "session" | "challenge",
  value: string,
  maxAge: number,
) {
  return `${authCookie(request, part)}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
export async function currentUser(request: Request) {
  if (!authConfigured()) return null;
  return verifySession(
    cookieValue(request, authCookie(request, "session")),
    runtimeValue("SESSION_SECRET"),
  );
}
