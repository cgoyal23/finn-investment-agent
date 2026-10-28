import {
  SignJWT,
  jwtVerify,
  createRemoteJWKSet,
  type JWTVerifyGetKey,
} from "jose";
export type FinnUser = { id: string; email: string; name: string };
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const key = (secret: string) => {
  if (secret.length < 32) throw new Error("Session secret is not configured");
  return new TextEncoder().encode(secret);
};
export async function verifyGoogleCredential(
  credential: string,
  clientId: string,
  nonce: string,
  keys: JWTVerifyGetKey = googleKeys,
): Promise<FinnUser> {
  const { payload } = await jwtVerify(credential, keys, {
    algorithms: ["RS256"],
    audience: clientId,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    clockTolerance: 5,
  });
  if (
    !payload.sub ||
    payload.email_verified !== true ||
    typeof payload.email !== "string" ||
    payload.nonce !== nonce
  )
    throw new Error("Google account verification failed");
  return {
    id: payload.sub,
    email: payload.email,
    name:
      typeof payload.name === "string"
        ? payload.name.slice(0, 100)
        : payload.email.split("@")[0],
  };
}
export async function createSession(user: FinnUser, secret: string) {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("finn")
    .setAudience("finn-web")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key(secret));
}
export async function verifySession(
  token: string,
  secret: string,
): Promise<FinnUser | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ["HS256"],
      issuer: "finn",
      audience: "finn-web",
    });
    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    )
      return null;
    return { id: payload.sub, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}
export async function createChallenge(secret: string) {
  const nonce = crypto.randomUUID(),
    csrf = crypto.randomUUID();
  const token = await new SignJWT({ nonce, csrf })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("finn")
    .setAudience("finn-login")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(key(secret));
  return { nonce, csrf, token };
}
export async function reusableChallenge(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ["HS256"],
      issuer: "finn",
      audience: "finn-login",
    });
    if (
      typeof payload.nonce !== "string" ||
      typeof payload.csrf !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp * 1000 - Date.now() < 60000
    )
      return null;
    return { token, nonce: payload.nonce, csrf: payload.csrf };
  } catch {
    return null;
  }
}
export async function verifyChallenge(
  token: string,
  csrf: string,
  secret: string,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ["HS256"],
      issuer: "finn",
      audience: "finn-login",
    });
    return typeof payload.nonce === "string" && payload.csrf === csrf
      ? payload.nonce
      : null;
  } catch {
    return null;
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const url = new URL(request.url);
  // Next may use its internal localhost URL while serving a 127.0.0.1 Host.
  // Host is the browser's destination; do not trust forwarded-host overrides.
  const host = request.headers.get("host") || url.host;
  try {
    const expected = new URL(`${url.protocol}//${host}`);
    return expected.host === host && origin === expected.origin;
  } catch {
    return false;
  }
}
export function cookieValue(request: Request, name: string) {
  const raw = (request.headers.get("cookie") || "")
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(name + "="));
  return raw ? raw.slice(name.length + 1) : "";
}
