# Direct Google sign-in for FINN

FINN now has its own `/login` screen, using Google Identity Services. The app does not redirect to the former hosting provider's account sign-in. Moving the app to Vercel also removes the old provider's suffix from the production address.

## Owner setup

Google requires a web OAuth Client ID. The Vercel account connection does not create this ID automatically.

1. Sign into https://console.cloud.google.com/auth/clients with your own Google account.
2. Create/select a Google Cloud project for FINN.
3. If prompted, configure the Google Auth Platform branding: app name **FINN**, your support email, and audience. While the app is in Testing, add the people who will test login as test users where Google requires it.
4. Create a client with application type **Web application**.
5. Add the **actual deployed FINN origin** under Authorized JavaScript origins. Use only `https://` plus the hostname, with no path. The production origin is `https://finn-investment-agent.vercel.app`. The old origin is not required unless you also want the old deployment to support Google sign-in.
6. For local testing, add `http://localhost` and `http://localhost:3000` as needed. Use localhost in the browser for Google tests.
7. Copy the Client ID ending in `.apps.googleusercontent.com`. The popup flow does **not** need a client secret.
8. Configure `GOOGLE_CLIENT_ID` in Vercel, and redeploy. `SESSION_SECRET` is a separate, randomly generated server secret.
9. Open `/login`, press Google's button and complete account selection/verification yourself. FINN never asks you to paste your Google password or OTP.

The official Google button only appears when the client configuration exists. Before then, the page honestly says setup is pending and offers a sample desk. This is not a simulated successful sign-in.

If Google rejects the provider hostname or asks for domain ownership/brand verification, use an owner-controlled custom domain and configure it in Google and Vercel. Do not claim domain verification is complete without doing it.

## Security implemented

- Google ID-token verification through JOSE using Google's rotating public keys.
- Checks for signature, issuer, audience, expiration, verified email and nonce.
- Same-origin login/logout requests, a signed short-lived login challenge and CSRF-value matching.
- Session tokens with a separate signing secret, issuer and audience.
- HttpOnly, SameSite cookies; Secure and `__Host-` naming on HTTPS.
- Live AI requires a verified FINN session once Google sign-in is configured.
- The sample desk remains available for read-only product exploration.
- No Gmail inbox permission, Google password collection or client-secret exposure.
- Local notes/preferences use separate storage keys for each signed-in Google account and for the sample desk. They are not cloud-synchronised.

## Testing boundaries

Automated tests use test keys to check validation and rejection paths. A real successful Google sign-in still requires the actual Client ID, authorized origin and human account interaction. Do not substitute a demo identity or a hard-coded code for that test.

Sources: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid and https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
