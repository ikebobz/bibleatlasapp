import { Bell, BellOff, Loader2, RefreshCw, Stethoscope } from "lucide-react";
import { useState } from "react";

import { IosPushHelp } from "./IosPushHelp";
import { PushDiagnostics } from "./PushDiagnostics";
import {
  formatTime,
  fromInputValue,
  toInputValue,
  usePushState,
  type PushStatus,
} from "./usePushState";

const PRESETS = [
  { label: "Early 6:00", hour: 6 },
  { label: "Morning 7:00", hour: 7 },
  { label: "Midday 12:00", hour: 12 },
  { label: "Evening 20:00", hour: 20 },
];

const DOT: Record<PushStatus, string> = {
  checking: "bg-muted-foreground/50",
  unsupported: "bg-amber-500",
  blocked: "bg-amber-500",
  disabled: "bg-muted-foreground/50",
  subscribing: "bg-primary animate-pulse",
  enabled: "bg-emerald-500",
  error: "bg-destructive",
};

/** Daily verse notification control, shown inside the reading settings menu. */
export function PushToggle() {
  const {
    status,
    statusLabel,
    detail,
    code,
    note,
    time,
    zone,
    on,
    canToggle,
    inspect,
    activate,
    toggle,
    chooseTime,
    test,
  } = usePushState();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-2 border-t pt-3">
      <button
        type="button"
        onClick={toggle}
        disabled={!canToggle}
        className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs disabled:opacity-50"
      >
        <span className="inline-flex items-center gap-2 text-foreground">
          {status === "subscribing" || status === "checking" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : on ? (
            <Bell className="h-3 w-3" />
          ) : (
            <BellOff className="h-3 w-3" />
          )}
          Daily verse
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden />
          <span className={on ? "text-primary" : undefined}>
            {on ? "Enabled" : status === "subscribing" ? "Subscribing" : statusLabel}
          </span>
        </span>
      </button>

      <p
        className={`text-[11px] leading-relaxed ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
        role="status"
        aria-live="polite"
      >
        {status === "subscribing" || status === "enabled" ? statusLabel : (detail ?? statusLabel)}
      </p>

      {code && status === "error" && (
        <p className="text-[10px] leading-relaxed text-muted-foreground">Details: {code}</p>
      )}

      <IosPushHelp />

      {(status === "error" || status === "blocked") && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={status === "blocked" ? () => void inspect() : activate}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className="h-3 w-3" />
            Try again
          </button>
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted"
          >
            <Stethoscope className="h-3 w-3" />
            Diagnose
          </button>
        </div>
      )}

      {status === "disabled" && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          One verse a day at a time you choose, with themed readings through Advent, Lent, Holy
          Week, Eastertide and Pentecost.
        </p>
      )}

      <div className="space-y-2 rounded-lg border px-3 py-2">
        <label className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          Delivery time
          <input
            type="time"
            step={900}
            value={toInputValue(time)}
            onChange={(event) => {
              const parsed = fromInputValue(event.target.value);
              if (parsed) chooseTime(parsed);
            }}
            className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
            aria-label="Daily verse delivery time"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((preset) => {
            const active = preset.hour === time.hour && time.minute === 0;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => chooseTime({ hour: preset.hour, minute: 0 })}
                className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                  active ? "border-primary text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {on
            ? `Each day at ${formatTime(time)}, ${zone}. This device only.`
            : `Will send at ${formatTime(time)}, ${zone}, once Daily verse is on.`}
        </p>
      </div>

      {on && (
        <button
          type="button"
          onClick={() => void test()}
          className="w-full rounded-lg border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted"
        >
          Send me a test
        </button>
      )}
      {note && <p className="text-[11px] leading-relaxed text-primary">{note}</p>}

      <button
        type="button"
        onClick={() => setShowDetails(true)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted"
      >
        <Stethoscope className="h-3 w-3" />
        Run diagnostics
      </button>

      <PushDiagnostics open={showDetails} onOpenChange={setShowDetails} onTurnOn={activate} />
    </div>
  );
}
