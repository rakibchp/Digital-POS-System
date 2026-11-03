"use client";

import { useState, type FormEvent } from "react";
import { ApiError, authenticate } from "@/lib/api/backend";

interface LoginFormProps {
  onAuthenticated: (username: string, authorization: string) => void;
}

export function LoginForm({ onAuthenticated }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await authenticate(username.trim(), password);
      setPassword("");
      onAuthenticated(result.session.username, result.authorization);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError && requestError.status === 401
          ? "The username or password is incorrect."
          : requestError instanceof Error
            ? requestError.message
            : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/4 p-7 shadow-2xl shadow-black/20">
      <div className="mb-7">
        <p className="text-sm font-medium text-emerald-300">Welcome back</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Sign in to your POS
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Use your backend API account to open the product workspace.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-200" htmlFor="username">
            Username
          </label>
          <input
            autoComplete="username"
            className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
            id="username"
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-200" htmlFor="password">
            Password
          </label>
          <input
            autoComplete="current-password"
            className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        {error && (
          <p
            className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-xs leading-5 text-slate-500">
        This development session ends when you close or refresh this page.
      </p>
    </section>
  );
}
