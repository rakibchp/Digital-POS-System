"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ApiError,
  createProduct,
  getProducts,
  type Product,
} from "@/lib/api/backend";

interface ProductCatalogProps {
  authorization: string;
  onSignOut: () => void;
  username: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function ProductCatalog({
  authorization,
  onSignOut,
  username,
}: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setProducts(await getProducts(authorization));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSignOut();
        return;
      }
      setLoadError(
        error instanceof Error ? error.message : "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  }, [authorization, onSignOut]);

  useEffect(() => {
    void Promise.resolve().then(loadProducts);
  }, [loadProducts]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const product = await createProduct(authorization, {
        sku: sku.trim(),
        name: name.trim(),
        price: Number(price),
      });
      setProducts((current) =>
        [...current, product].sort(
          (left, right) =>
            left.name.localeCompare(right.name) ||
            left.sku.localeCompare(right.sku),
        ),
      );
      setSku("");
      setName("");
      setPrice("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSignOut();
        return;
      }
      setFormError(
        error instanceof Error ? error.message : "Unable to create product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="w-full max-w-5xl rounded-2xl border border-white/10 bg-white/4 p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-300">Catalog</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Products
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Add and review the products available at checkout.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="max-w-40 truncate text-sm text-slate-300">{username}</span>
          <button
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/15 px-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
            onClick={onSignOut}
            type="button"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-white">All products</h3>
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
              {products.length} {products.length === 1 ? "item" : "items"}
            </span>
          </div>

          {loading && (
            <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400" role="status">
              Loading products…
            </p>
          )}
          {!loading && loadError && (
            <div className="rounded-xl border border-rose-300/20 bg-rose-300/5 p-5">
              <p className="text-sm text-rose-200" role="alert">{loadError}</p>
              <button
                className="mt-3 text-sm font-medium text-emerald-300 hover:text-emerald-200"
                onClick={() => void loadProducts()}
                type="button"
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !loadError && products.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 px-5 py-10 text-center">
              <p className="font-medium text-slate-200">No products yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Add your first product using the form.
              </p>
            </div>
          )}
          {!loading && !loadError && products.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {products.map((product) => (
                    <tr className="text-slate-200" key={product.id}>
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-slate-400">{product.sku}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPrice(product.price)}
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
          onSubmit={handleCreate}
        >
          <div>
            <h3 className="font-semibold text-white">Add a product</h3>
            <p className="mt-1 text-sm text-slate-400">
              Product SKUs must be unique.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200" htmlFor="product-sku">
              SKU
            </label>
            <input
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              id="product-sku"
              maxLength={64}
              onChange={(event) => setSku(event.target.value)}
              required
              value={sku}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200" htmlFor="product-name">
              Product name
            </label>
            <input
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              id="product-name"
              maxLength={200}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200" htmlFor="product-price">
              Price
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
                $
              </span>
              <input
                className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 pl-7 pr-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
                id="product-price"
                min="0"
                onChange={(event) => setPrice(event.target.value)}
                required
                step="0.01"
                type="number"
                value={price}
              />
            </div>
          </div>
          {formError && (
            <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">
              {formError}
            </p>
          )}
          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving…" : "Add product"}
          </button>
        </form>
      </div>
    </section>
  );
}
