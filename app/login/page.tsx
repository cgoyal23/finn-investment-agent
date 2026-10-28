"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChartNoAxesCombined,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
type GoogleWindow = Window & {
  google?: {
    accounts: {
      id: {
        initialize: (options: {
          client_id: string;
          nonce: string | null;
          auto_select: boolean;
          callback: (response: { credential: string }) => Promise<void>;
        }) => void;
        renderButton: (
          target: HTMLElement,
          options: {
            theme: string;
            size: string;
            shape: string;
            text: string;
            width: number;
            logo_alignment: string;
          },
        ) => void;
      };
    };
  };
};
type AuthConfig = {
  configured: boolean;
  clientId: string | null;
  nonce: string | null;
  csrfToken: string | null;
  user: { name: string } | null;
};
export default function Login() {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const target = useRef<HTMLDivElement>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth?challenge=1", {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((raw) => {
        const d = raw as AuthConfig;
        if (controller.signal.aborted) return;
        setConfig(d);
        if (d.user) location.replace("/");
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Unable to load sign-in settings. Please refresh.");
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!config?.configured) return;
    const existing = document.getElementById(
      "finn-google-sdk",
    ) as HTMLScriptElement | null;
    if (existing) {
      // The SDK can already exist after client navigation; synchronise that external state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if ((window as GoogleWindow).google?.accounts?.id) setSdkLoaded(true);
      else
        existing.addEventListener("load", () => setSdkLoaded(true), {
          once: true,
        });
      return;
    }
    const script = document.createElement("script");
    script.id = "finn-google-sdk";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () =>
      setError(
        "Google sign-in could not load. Check your connection or browser settings.",
      );
    document.head.appendChild(script);
  }, [config?.configured]);
  useEffect(() => {
    if (!sdkLoaded || !config?.clientId || !target.current) return;
    const google = (window as GoogleWindow).google;
    if (!google) return;
    google.accounts.id.initialize({
      client_id: config.clientId,
      nonce: config.nonce,
      auto_select: false,
      callback: async (response: { credential: string }) => {
        setBusy(true);
        setError("");
        try {
          const r = await fetch("/api/auth/google", {
            method: "POST",
            signal: AbortSignal.timeout(20000),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              credential: response.credential,
              csrfToken: config.csrfToken,
            }),
          });
          const data = (await r.json()) as { error?: string };
          if (!r.ok) throw Error(data.error || "Sign-in failed.");
          location.replace("/");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Sign-in failed.");
          setBusy(false);
        }
      },
    });
    google.accounts.id.renderButton(target.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: 300,
      logo_alignment: "left",
    });
  }, [sdkLoaded, config]);
  return (
    <div className="login-page">
      <Link className="login-wordmark" href="/">
        finn<span>.</span>
      </Link>
      <main className="login-layout">
        <section className="login-story">
          <div className="eyebrow">
            A LITTLE LESS NOISE. A LOT MORE PERSPECTIVE.
          </div>
          <h1>
            Your next good
            <br />
            question starts here<span>.</span>
          </h1>
          <p>
            A calmer place to follow your companies, understand their numbers,
            and see the evidence for yourself.
          </p>
          <div className="login-mini-report">
            <div>
              <span className="login-orbit">
                <ChartNoAxesCombined size={22} />
              </span>
              <span>
                <strong>One desk. A clearer view.</strong>
                <small>
                  Price movements → company evidence → better questions
                </small>
              </span>
            </div>
            <svg viewBox="0 0 400 100" aria-hidden="true">
              <path
                d="M0 82L25 68L45 74L65 55L90 63L110 43L140 52L165 35L190 48L215 26L240 36L260 21L285 30L310 11L335 25L360 13L385 5"
                fill="none"
                stroke="#a8c297"
                strokeWidth="2"
              />
            </svg>
            <span>Illustration of the workflow, not market data</span>
          </div>
          <div className="login-reasons">
            <span>
              <Check size={14} />
              Real share-price charts
            </span>
            <span>
              <Check size={14} />
              Primary-source research
            </span>
            <span>
              <Check size={14} />
              Your questions, kept together
            </span>
          </div>
        </section>
        <section className="login-card">
          <span className="login-card-icon">
            <ShieldCheck size={26} />
          </span>
          <div className="eyebrow">WELCOME TO FINN</div>
          <h2>
            Make room for
            <br />
            what matters.
          </h2>
          <p>
            Sign in with your Google account. Your password stays with Google.
          </p>
          {!config && !error && (
            <div className="login-loading">
              <LoaderCircle size={18} className="spinning" />
              Preparing sign-in...
            </div>
          )}
          {config?.configured ? (
            <>
              <div ref={target} className="google-button-target" />
              {busy && (
                <div className="login-loading">
                  <LoaderCircle size={17} className="spinning" />
                  Opening your desk...
                </div>
              )}
              <p className="login-caption">
                Google handles account selection and any verification code it
                requires. FINN never asks for your Google password or OTP.
              </p>
            </>
          ) : (
            config && (
              <div className="auth-setup-note">
                <strong>Google sign-in is being connected.</strong>
                <p>
                  The owner’s Google Client ID is still needed. You can explore
                  the sample desk while setup is completed.
                </p>
              </div>
            )
          )}
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <Link className="login-demo-link" href="/">
            Explore the sample desk <ArrowRight size={14} />
          </Link>
          <div className="login-privacy">
            <ShieldCheck size={14} />
            <span>
              Only your basic profile and email are used for sign-in. No access
              to your Gmail inbox.
            </span>
          </div>
          <div className="login-legal">
            <Link href="/privacy">Privacy</Link>
            <span>·</span>
            <Link href="/terms">About this prototype</Link>
          </div>
        </section>
      </main>
      <footer className="login-footer">
        <span>FINN · Evidence before opinion.</span>
        <Link href="/">
          Back to the desk <ArrowUpRight size={12} />
        </Link>
      </footer>
    </div>
  );
}
