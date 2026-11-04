"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  createSale,
  getCustomers,
  getInventory,
  getProducts,
  getSales,
  type Customer,
  type Product,
  type Sale,
} from "@/lib/api/backend";

interface CheckoutProps {
  authorization: string;
  onSignOut: () => void;
}

interface CheckoutProduct extends Product {
  quantityOnHand: number;
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function Checkout({ authorization, onSignOut }: CheckoutProps) {
  const [products, setProducts] = useState<CheckoutProduct[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCheckout = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catalog, inventory, sales, customers] = await Promise.all([
        getProducts(authorization),
        getInventory(authorization),
        getSales(authorization),
        getCustomers(authorization),
      ]);
      const stockByProduct = new Map(
        inventory.map((item) => [item.productId, item.quantityOnHand]),
      );
      setProducts(
        catalog.map((product) => ({
          ...product,
          quantityOnHand: stockByProduct.get(product.id) ?? 0,
        })),
      );
      setRecentSales(sales);
      setCustomers(customers);
      setCart({});
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSignOut();
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load checkout.",
      );
    } finally {
      setLoading(false);
    }
  }, [authorization, onSignOut]);

  useEffect(() => {
    void Promise.resolve().then(loadCheckout);
  }, [loadCheckout]);

  const cartLines = useMemo(
    () =>
      products.flatMap((product) => {
        const quantity = cart[product.id] ?? 0;
        return quantity > 0 ? [{ product, quantity }] : [];
      }),
    [cart, products],
  );
  const cartTotal = cartLines.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0,
  );

  function changeQuantity(product: CheckoutProduct, amount: number) {
    setCart((current) => {
      const quantity = (current[product.id] ?? 0) + amount;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }
      if (quantity > product.quantityOnHand) {
        return current;
      }
      return { ...current, [product.id]: quantity };
    });
    setError("");
    setNotice("");
  }

  async function completeSale() {
    if (cartLines.length === 0 || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const sale = await createSale(authorization, {
        ...(customerId ? { customerId } : {}),
        items: cartLines.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
      });
      setRecentSales((current) => [sale, ...current].slice(0, 50));
      const soldQuantities = new Map(
        sale.items.map((item) => [item.productId, item.quantity]),
      );
      setProducts((current) =>
        current.map((product) => ({
          ...product,
          quantityOnHand:
            product.quantityOnHand - (soldQuantities.get(product.id) ?? 0),
        })),
      );
      setCart({});
      setNotice(`Sale complete · ${formatPrice(sale.totalAmount)}`);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSignOut();
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete sale.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-6xl rounded-2xl border border-white/10 bg-white/4 p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-300">Point of sale</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Checkout
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Select in-stock products and complete a sale.
          </p>
        </div>
        <button
          className="h-9 self-start rounded-lg border border-white/15 px-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 sm:self-auto"
          onClick={() => void loadCheckout()}
          type="button"
        >
          Refresh
        </button>
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

      {loading ? (
        <p className="mt-6 rounded-xl border border-white/10 p-5 text-sm text-slate-400" role="status">
          Loading checkout…
        </p>
      ) : (
        <div className="grid gap-8 pt-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <h3 className="mb-4 font-semibold text-white">Products</h3>
            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 px-5 py-10 text-center">
                <p className="font-medium text-slate-200">No products available</p>
                <p className="mt-1 text-sm text-slate-400">
                  Add products and receive stock before checkout.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {products.map((product) => {
                  const quantity = cart[product.id] ?? 0;
                  return (
                    <article
                      className="rounded-xl border border-white/10 bg-slate-950/35 p-4"
                      key={product.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate font-medium text-white">
                            {product.name}
                          </h4>
                          <p className="mt-1 text-xs text-slate-400">{product.sku}</p>
                        </div>
                        <p className="shrink-0 font-semibold tabular-nums text-emerald-200">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-400">
                          {product.quantityOnHand} in stock
                        </p>
                        {quantity === 0 ? (
                          <button
                            className="h-8 rounded-lg bg-white/10 px-3 text-xs font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={product.quantityOnHand === 0}
                            onClick={() => changeQuantity(product, 1)}
                            type="button"
                          >
                            Add to cart
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              aria-label={`Remove one ${product.name}`}
                              className="size-8 rounded-lg border border-white/10 text-white hover:bg-white/10"
                              onClick={() => changeQuantity(product, -1)}
                              type="button"
                            >
                              −
                            </button>
                            <span
                              aria-label={`${product.name} quantity`}
                              className="min-w-5 text-center text-sm tabular-nums text-white"
                            >
                              {quantity}
                            </span>
                            <button
                              aria-label={`Add one ${product.name}`}
                              className="size-8 rounded-lg border border-white/10 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={quantity >= product.quantityOnHand}
                              onClick={() => changeQuantity(product, 1)}
                              type="button"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-8">
              <h3 className="mb-3 font-semibold text-white">Recent sales</h3>
              {recentSales.length === 0 ? (
                <p className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">
                  Completed sales will appear here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {recentSales.slice(0, 5).map((sale) => (
                    <li
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"
                      key={sale.id}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          Sale · {sale.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </p>
                        {sale.customerName && (
                          <p className="text-xs text-emerald-200">{sale.customerName}</p>
                        )}
                        <time className="text-xs text-slate-400" dateTime={sale.createdAt}>
                          {new Date(sale.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <p className="font-semibold tabular-nums text-slate-200">
                        {formatPrice(sale.totalAmount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-white/10 bg-slate-950/40 p-5">
            <label
              className="mb-2 block text-sm font-medium text-slate-200"
              htmlFor="checkout-customer"
            >
              Customer
            </label>
            <select
              className="mb-5 h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              id="checkout-customer"
              onChange={(event) => setCustomerId(event.target.value)}
              value={customerId}
            >
              <option value="">Walk-in customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <h3 className="font-semibold text-white">Current sale</h3>
            {cartLines.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-white/15 p-4 text-sm text-slate-400">
                Add products to start a sale.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-white/8">
                {cartLines.map(({ product, quantity }) => (
                  <li
                    className="flex items-start justify-between gap-3 py-3 first:pt-0"
                    key={product.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {quantity} × {formatPrice(product.price)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm tabular-nums text-slate-200">
                      {formatPrice(quantity * product.price)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="font-medium text-slate-300">Total</span>
              <span className="text-xl font-semibold tabular-nums text-white">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <button
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={cartLines.length === 0 || submitting}
              onClick={() => void completeSale()}
              type="button"
            >
              {submitting ? "Completing sale…" : "Complete sale"}
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
