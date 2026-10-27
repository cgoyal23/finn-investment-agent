import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";
fs.mkdirSync("work", { recursive: true });
const temp = fs.mkdtempSync(path.resolve("work/auth-tests-"));
after(() => fs.rmSync(temp, { recursive: true, force: true }));
const output = ts.transpileModule(fs.readFileSync("lib/auth-core.ts", "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const file = path.join(temp, "auth-core.mjs");
fs.writeFileSync(file, output);
const auth = await import(pathToFileURL(file));
const secret = "a-test-secret-at-least-thirty-two-characters-long";
const { privateKey, publicKey } = await generateKeyPair("RS256");
const jwk = await exportJWK(publicKey);
jwk.kid = "test";
const keys = createLocalJWKSet({ keys: [jwk] });
async function token({
  nonce = "correct",
  audience = "finn-client",
  verified = true,
  expires = "5m",
} = {}) {
  return new SignJWT({
    email: "user@example.com",
    email_verified: verified,
    name: "Test User",
    nonce,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setSubject("google-subject")
    .setIssuer("https://accounts.google.com")
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(privateKey);
}
test("Google identity requires a verified signature, issuer, audience, nonce and email", async () => {
  const signed = await token();
  const user = await auth.verifyGoogleCredential(
    signed,
    "finn-client",
    "correct",
    keys,
  );
  assert.equal(user.id, "google-subject");
  assert.equal(user.email, "user@example.com");
  await assert.rejects(() =>
    auth.verifyGoogleCredential(signed, "different-client", "correct", keys),
  );
});
test("mismatched nonce, unverified email and expired ID tokens are rejected", async () => {
  for (const options of [
    { nonce: "attacker" },
    { verified: false },
    { expires: "-1m" },
  ]) {
    const signed = await token(options);
    await assert.rejects(() =>
      auth.verifyGoogleCredential(signed, "finn-client", "correct", keys),
    );
  }
});
test("session cookies cannot be modified or accepted with a different secret", async () => {
  const signed = await auth.createSession(
    { id: "abc", email: "user@example.com", name: "User" },
    secret,
  );
  assert.equal((await auth.verifySession(signed, secret)).id, "abc");
  assert.equal(await auth.verifySession(signed + "modified", secret), null);
  assert.equal(await auth.verifySession(signed, secret + "wrong"), null);
});
test("login challenge requires the signed CSRF value and its purpose-specific audience", async () => {
  const c = await auth.createChallenge(secret);
  assert.equal(await auth.verifyChallenge(c.token, c.csrf, secret), c.nonce);
  assert.equal(await auth.verifyChallenge(c.token, "wrong", secret), null);
  assert.equal(await auth.verifySession(c.token, secret), null);
});
test("cross-origin sign-in and sign-out requests are rejected", () => {
  assert.equal(
    auth.sameOrigin(
      new Request("https://finn.example/api/auth", {
        headers: { origin: "https://evil.example" },
      }),
    ),
    false,
  );
  assert.equal(
    auth.sameOrigin(
      new Request("https://finn.example/api/auth", {
        headers: { origin: "https://finn.example" },
      }),
    ),
    true,
  );
  assert.equal(
    auth.sameOrigin(new Request("https://finn.example/api/auth")),
    false,
  );
});
