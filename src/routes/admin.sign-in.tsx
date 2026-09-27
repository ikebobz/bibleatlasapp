import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { checkAdminEmailLogin, confirmAdminEmailLogin } from "@/lib/admin/gate.functions";

const searchSchema = z.object({ token: z.string().max(200).optional() });

export const Route = createFileRoute("/admin/sign-in")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Admin email sign-in — Bible Atlas" },
      { name: "description", content: "Confirm secure access to the Bible Atlas admin area." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin email sign-in — Bible Atlas" },
      { property: "og:description", content: "Internal admin sign-in confirmation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminEmailSignIn,
});

function AdminEmailSignIn() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<"checking" | "valid" | "invalid" | "busy" | "error">(
    "checking",
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState("invalid");
      return;
    }
    checkAdminEmailLogin({ data: { token } })
      .then((result) => {
        if (!cancelled) setState(result.valid ? "valid" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setState("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <section className="w-full max-w-sm rounded-lg border p-6">
        <MailCheck className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="scripture mt-4 text-2xl text-foreground">Confirm admin sign-in</h1>
        {state === "checking" ? (
          <p className="mt-3 text-sm text-muted-foreground">Checking your secure link…</p>
        ) : null}
        {state === "invalid" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            This sign-in link is invalid, expired, or has already been used. Request a new one from
            the admin page.
          </p>
        ) : null}
        {state === "valid" || state === "busy" || state === "error" ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Continue only if you requested access to the Bible Atlas admin portal.
            </p>
            {message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}
            <Button
              className="mt-5 w-full"
              disabled={state === "busy"}
              onClick={async () => {
                if (!token) return;
                setState("busy");
                setMessage(null);
                const result = await confirmAdminEmailLogin({ data: { token } }).catch(() => ({
                  ok: false as const,
                  reason: "no_session" as const,
                }));
                if (result.ok) {
                  window.location.assign("/admin/devices");
                  return;
                }
                setState(result.reason === "invalid" ? "invalid" : "error");
                setMessage(
                  result.reason === "throttled"
                    ? "Too many attempts. Try again in a few minutes."
                    : "The secure session could not be created. Request a fresh link and try again.",
                );
              }}
            >
              {state === "busy" ? "Signing in…" : "Continue to admin"}
            </Button>
          </>
        ) : null}
        <a
          href="/admin/devices"
          className="mt-4 block text-center text-xs text-muted-foreground underline underline-offset-4"
        >
          Back to admin sign-in
        </a>
      </section>
    </main>
  );
}