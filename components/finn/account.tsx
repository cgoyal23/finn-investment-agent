"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
export function AccountMenu() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) =>
        setUser((d as { user?: { name: string; email: string } }).user || null),
      )
      .catch(() => {});
  }, []);
  return (
    <div className="account-control">
      <button
        className="account-button"
        onClick={() => (user ? setOpen(!open) : router.push("/login"))}
        aria-label={user ? "Open account menu" : "Sign in with Google"}
      >
        <span className="account-avatar">
          {user ? (
            user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
          ) : (
            <UserRound size={16} />
          )}
        </span>
        <span className="account-button-label">
          {user ? user.name.split(" ")[0] : "Sign in"}
        </span>
      </button>
      {open && user && (
        <div className="account-popover">
          <strong>{user.name}</strong>
          <span>{user.email}</span>
          <p>
            Preferences and notebook stay in this browser. Signing in does not
            enable cloud sync.
          </p>
          <button
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              setError("");
              try {
                const response = await fetch("/api/auth/logout", {
                  method: "POST",
                  signal: AbortSignal.timeout(10000),
                });
                if (!response.ok) throw Error();
                router.push("/login");
              } catch {
                setError(
                  "Sign-out did not complete. Check your connection and retry.",
                );
                setSigningOut(false);
              }
            }}
          >
            <LogOut size={14} />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
