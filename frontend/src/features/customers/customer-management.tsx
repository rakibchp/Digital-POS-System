"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ApiError,
  createCustomer,
  getCustomers,
  type Customer,
} from "@/lib/api/backend";

interface CustomerManagementProps {
  authorization: string;
  onSignOut: () => void;
}

export function CustomerManagement({
  authorization,
  onSignOut,
}: CustomerManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCustomers(await getCustomers(authorization));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSignOut();
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load customers.",
      );
    } finally {
      setLoading(false);
    }
  }, [authorization, onSignOut]);

  useEffect(() => {
    void Promise.resolve().then(loadCustomers);
  }, [loadCustomers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const customer = await createCustomer(authorization, {
        name: name.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      setCustomers((current) =>
        [...current, customer].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      );
      setName("");
      setEmail("");
      setPhone("");
      setNotice(`${customer.name} added to customers.`);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSignOut();
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create customer.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="w-full max-w-6xl rounded-2xl border border-white/10 bg-white/4 p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="border-b border-white/10 pb-6">
        <p className="text-sm font-medium text-emerald-300">Customer records</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Customers
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Save customer contact details and associate them with checkouts.
        </p>
      </div>

      {error && (
        <p className="mt-5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200" role="status">
          {notice}
        </p>
      )}

      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-white">Customer list</h3>
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
              {customers.length} {customers.length === 1 ? "customer" : "customers"}
            </span>
          </div>
          {loading ? (
            <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400" role="status">
              Loading customers…
            </p>
          ) : customers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 px-5 py-10 text-center">
              <p className="font-medium text-slate-200">No customers saved</p>
              <p className="mt-1 text-sm text-slate-400">
                Add a customer to associate them with a sale.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {customers.map((customer) => (
                    <tr className="text-slate-200" key={customer.id}>
                      <td className="px-4 py-3 font-medium">{customer.name}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {customer.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {customer.phone || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form
          className="h-fit space-y-4 rounded-xl border border-white/10 bg-slate-950/40 p-5"
          onSubmit={handleSubmit}
        >
          <div>
            <h3 className="font-semibold text-white">Add customer</h3>
            <p className="mt-1 text-sm text-slate-400">
              Name is required; contact details are optional.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200" htmlFor="customer-name">
              Name
            </label>
            <input
              autoComplete="name"
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              id="customer-name"
              maxLength={200}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200" htmlFor="customer-email">
              Email
            </label>
            <input
              autoComplete="email"
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              id="customer-email"
              maxLength={254}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200" htmlFor="customer-phone">
              Phone
            </label>
            <input
              autoComplete="tel"
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              id="customer-phone"
              maxLength={32}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              value={phone}
            />
          </div>
          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving…" : "Add customer"}
          </button>
        </form>
      </div>
    </section>
  );
}
