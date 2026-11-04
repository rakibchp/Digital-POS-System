"use client";

import type { Sale } from "@/lib/api/backend";

interface SaleReceiptProps {
  sale: Sale;
  onClose?: () => void;
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatPaymentMethod(method: Sale["paymentMethod"]) {
  if (!method) {
    return "Not recorded";
  }
  return `${method.charAt(0)}${method.slice(1).toLowerCase()}`;
}

export function SaleReceipt({ sale, onClose }: SaleReceiptProps) {
  const itemCount = sale.items.reduce((quantity, item) => quantity + item.quantity, 0);

  return (
    <section
      aria-label={`Receipt ${sale.id.slice(0, 8)}`}
      className="sale-receipt w-full max-w-sm rounded-xl border border-white/10 bg-white p-5 text-slate-950 shadow-xl sm:p-6"
    >
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Digital POS
        </p>
        <h2 className="mt-2 text-xl font-bold">Sales receipt</h2>
        <p className="mt-1 text-xs text-slate-500">Transaction {sale.id}</p>
        <time className="mt-1 block text-xs text-slate-500" dateTime={sale.createdAt}>
          {new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(sale.createdAt))}
        </time>
      </header>

      <dl className="mt-5 space-y-1 border-y border-dashed border-slate-300 py-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Customer</dt>
          <dd className="text-right font-medium">{sale.customerName || "Walk-in"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Payment</dt>
          <dd className="font-medium">{formatPaymentMethod(sale.paymentMethod)}</dd>
        </div>
      </dl>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-slate-500">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 text-right font-medium">Qty</th>
            <th className="pb-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sale.items.map((item) => (
            <tr key={item.productId}>
              <td className="py-2 pr-2">
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-slate-500">{item.sku}</p>
              </td>
              <td className="py-2 text-right tabular-nums">{item.quantity}</td>
              <td className="py-2 text-right tabular-nums">
                {formatPrice(item.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
        <div className="flex justify-between gap-4 font-semibold">
          <dt>Total ({itemCount} items)</dt>
          <dd className="tabular-nums">{formatPrice(sale.totalAmount)}</dd>
        </div>
        {sale.paymentMethod === "CASH" && sale.amountTendered !== null && (
          <>
            <div className="flex justify-between gap-4 text-slate-600">
              <dt>Cash received</dt>
              <dd className="tabular-nums">{formatPrice(sale.amountTendered)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-slate-600">
              <dt>Change</dt>
              <dd className="tabular-nums">
                {formatPrice(sale.changeDue ?? 0)}
              </dd>
            </div>
          </>
        )}
      </dl>

      <p className="mt-5 text-center text-xs text-slate-500">Thank you for your purchase.</p>

      <div className="receipt-actions mt-5 flex gap-2">
        <button
          className="h-10 flex-1 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700"
          onClick={() => window.print()}
          type="button"
        >
          Print receipt
        </button>
        {onClose && (
          <button
            className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        )}
      </div>
    </section>
  );
}
