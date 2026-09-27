import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { checkResetToken, completeAdminReset } from "@/lib/admin/reset.functions";

const searchSchema = z.object({ token: z.string().max(200).optional() });

export const Route = createFileRoute("/admin/reset")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Reset admin passcode — Bible Atlas" },
      { name: "description", content: "Set a new passcode for the Bible Atlas admin area." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Reset admin passcode — Bible Atlas" },
      { property: "og:description", content: "Internal admin passcode reset." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminResetPage,
});

function AdminResetPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "valid" | "invalid" | "done">("checking");
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState("invalid");
      return;
    }
    checkResetToken({ data: { token } })
      .then((res) => {
        if (!cancelled) setState(res.valid ? "valid" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setState("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm rounded-xl border p-6">
        <h1 className="scripture text-2xl text-foreground">Reset admin passcode</h1>

        {state === "checking" ? (
          <p className="mt-3 text-sm text-muted-foreground">Checking your link…</p>
        ) : null}

        {state === "invalid" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            This reset link is no longer valid. Request a new one from the admin sign-in screen.
          </p>
        ) : null}

        {state === "done" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Your passcode has been changed and you're signed in.
          </p>
        ) : null}

        {state === "valid" ? (
          <form
            className="mt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              if (passcode !== confirm) {
                setError("The two passcodes do not match.");
                return;
              }
              setBusy(true);
              const res = await completeAdminReset({
                data: { token: token as string, passcode },
              }).catch(() => ({ ok: false as const, reason: "failed" as const }));
              setBusy(false);
              if (res.ok) {
                setState("done");
                navigate({ to: "/admin/devices" });
              } else if (res.reason === "throttled") {
                setError("Too many attempts. Try again in a few minutes.");
              } else if (res.reason === "failed") {
                setError(
                  "Something went wrong saving the passcode. Your link is still valid — please try again.",
                );
              } else {
                setError("This reset link is no longer valid.");
              }
            }}
          >
            <label htmlFor="new-passcode" className="text-sm text-muted-foreground">
              New passcode
            </label>
            <input
              id="new-passcode"
              type="password"
              autoComplete="new-password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="At least 10 characters"
            />
            <label htmlFor="confirm-passcode" className="mt-4 block text-sm text-muted-foreground">
              Confirm passcode
            </label>
            <input
              id="confirm-passcode"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground"
            />
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save new passcode"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
