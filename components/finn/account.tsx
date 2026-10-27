"use client";
import { useEffect, useState } from "react";
import { LogOut, UserRound, ArrowUpRight } from "lucide-react";
export function AccountMenu() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d: any) => setUser(d.user || null))
      .catch(() => {});
  }, []);
  return (
    <div className="account-control">
      <button
        className="account-button"
        onClick={() => (user ? setOpen(!open) : location.assign("/login"))}
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
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              location.assign("/login");
            }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
