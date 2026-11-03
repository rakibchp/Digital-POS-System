"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getBackendStatus,
  type BackendStatus,
} from "@/lib/api/backend-status";

type ConnectionState =
  | { kind: "loading" }
  | { kind: "connected"; data: BackendStatus }
  | { kind: "disconnected"; message: string };

export function BackendStatusCard() {
  const [connection, setConnection] = useState<ConnectionState>({
    kind: "loading",
  });
  const [attempt, setAttempt] = useState(0);

  const checkConnection = useCallback(async (signal: AbortSignal) => {
    try {
      const data = await getBackendStatus(signal);
      setConnection({ kind: "connected", data });
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      setConnection({
        kind: "disconnected",
        message:
          error instanceof Error ? error.message : "Unable to reach the backend",
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        return checkConnection(controller.signal);
      }
    });

    return () => controller.abort();
  }, [attempt, checkConnection]);

  return (
    <section
      aria-labelledby="backend-status-title"
      className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/4 p-6 shadow-2xl shadow-black/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-300">Development tools</p>
          <h2
            id="backend-status-title"
            className="mt-2 text-xl font-semibold tracking-tight text-white"
          >
            Backend connection
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Verify the POS API is reachable from this frontend.
          </p>
        </div>
        <span
          aria-label={
            connection.kind === "connected"
              ? "Backend connected"
              : connection.kind === "disconnected"
                ? "Backend disconnected"
                : "Checking backend"
          }
          className={`mt-1 size-3 shrink-0 rounded-full ${
            connection.kind === "connected"
              ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.65)]"
              : connection.kind === "disconnected"
                ? "bg-rose-400"
                : "animate-pulse bg-amber-300"
          }`}
        />
      </div>

      <div className="mt-6 min-h-20 rounded-xl border border-white/10 bg-black/20 p-4">
        {connection.kind === "loading" && (
          <p role="status" className="text-sm text-slate-300">
            Checking backend…
          </p>
        )}
        {connection.kind === "connected" && (
          <div role="status" className="space-y-1">
            <p className="font-medium text-emerald-300">
              API connected · {connection.data.service}
            </p>
            <p className="text-xs text-slate-400">
              Last checked{" "}
              <time dateTime={connection.data.checkedAt}>
                {new Date(connection.data.checkedAt).toLocaleTimeString()}
              </time>
            </p>
          </div>
        )}
        {connection.kind === "disconnected" && (
          <div role="status" className="space-y-1">
            <p className="font-medium text-rose-300">API unavailable</p>
            <p className="text-sm text-slate-400">{connection.message}</p>
          </div>
        )}
      </div>

      <button
        className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={connection.kind === "loading"}
        onClick={() => {
          setConnection({ kind: "loading" });
          setAttempt((current) => current + 1);
        }}
        type="button"
      >
        {connection.kind === "loading" ? "Checking…" : "Check connection"}
      </button>
    </section>
  );
}
