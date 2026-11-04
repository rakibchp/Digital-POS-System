"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, getSales, type Sale } from "@/lib/api/backend";
import { summarizeSales } from "./sales-summary";
import { SaleReceipt } from "./sale-receipt";

interface SalesDashboardProps {
  authorization: string;
  onSignOut: () => void;
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SalesDashboard({ authorization, onSignOut }: SalesDashboardProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const summary = useMemo(() => summarizeSales(sales), [sales]);

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSales(await getSales(authorization));
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSignOut();
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load sales overview.",
      );
    } finally {
      setLoading(false);
    }
  }, [authorization, onSignOut]);

  useEffect(() => {
    void Promise.resolve().then(loadSales);
  }, [loadSales]);

  return (
    <section className="w-full max-w-6xl rounded-2xl border border-white/10 bg-white/4 p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-300">Performance</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Sales overview
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Summary and product rankings from the latest 50 transactions.
          </p>
        </div>
        <button
          className="h-9 self-start rounded-lg border border-white/15 px-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 sm:self-auto"
          onClick={() => void loadSales()}
          type="button"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3">
          <p className="text-sm text-rose-200" role="alert">{error}</p>
          <button
            className="mt-2 text-sm font-medium text-emerald-200 hover:text-emerald-100"
            onClick={() => void loadSales()}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <p className="mt-6 rounded-xl border border-white/10 p-5 text-sm text-slate-400" role="status">
          Loading sales overview…
        </p>
      ) : !error && (
        <>
          <div className="grid gap-3 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Sales recorded" value={summary.saleCount.toLocaleString()} />
            <Metric label="Revenue" value={formatPrice(summary.totalRevenue)} />
            <Metric label="Average sale" value={formatPrice(summary.averageSale)} />
            <Metric label="Items sold" value={summary.itemsSold.toLocaleString()} />
          </div>

          {sales.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/15 px-5 py-10 text-center">
              <p className="font-medium text-slate-200">No sales yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Completed checkouts will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
              <div>
                <h3 className="mb-4 font-semibold text-white">Recent transactions</h3>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Transaction</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Customer</th>
                        <th className="px-4 py-3 font-medium">Payment</th>
                        <th className="px-4 py-3 text-right font-medium">Items</th>
                        <th className="px-4 py-3 text-right font-medium">Total</th>
                        <th className="px-4 py-3 text-right font-medium">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/8">
                      {sales.map((sale) => (
                        <tr className="text-slate-200" key={sale.id}>
                          <td className="px-4 py-3 font-mono text-xs text-slate-300">
                            {sale.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {formatDate(sale.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {sale.customerName || "Walk-in"}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {sale.paymentMethod
                              ? `${sale.paymentMethod.charAt(0)}${sale.paymentMethod.slice(1).toLowerCase()}`
                              : "Not recorded"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {sale.items.reduce((quantity, item) => quantity + item.quantity, 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums">
                            {formatPrice(sale.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
                              onClick={() => setReceiptSale(sale)}
                              type="button"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-semibold text-white">Top products</h3>
                {summary.bestSellers.length === 0 ? (
                  <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">
                    No product sales recorded.
                  </p>
                ) : (
                  <ol className="divide-y divide-white/8 rounded-xl border border-white/10">
                    {summary.bestSellers.map((product, index) => (
                      <li
                        className="flex items-center gap-3 px-4 py-3"
                        key={product.productId}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 text-xs font-semibold text-emerald-200">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-100">
                            {product.productName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {product.sku} · {product.quantity} sold
                          </p>
                        </div>
                        <p className="shrink-0 text-sm tabular-nums text-slate-200">
                          {formatPrice(product.revenue)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {receiptSale && (
        <div
          aria-label="Receipt details"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setReceiptSale(null);
            }
          }}
          role="dialog"
        >
          <SaleReceipt
            onClose={() => setReceiptSale(null)}
            sale={receiptSale}
          />
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </article>
  );
}
