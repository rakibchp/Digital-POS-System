"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  adjustInventory,
  ApiError,
  getInventory,
  type InventoryItem,
} from "@/lib/api/backend";

interface InventoryManagementProps {
  authorization: string;
  onSignOut: () => void;
}

export function InventoryManagement({
  authorization,
  onSignOut,
}: InventoryManagementProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [direction, setDirection] = useState<"RECEIVE" | "REMOVE">("RECEIVE");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const inventory = await getInventory(authorization);
      setItems(inventory);
      setSelectedProductId((current) =>
        inventory.some((item) => item.productId === current)
          ? current
          : inventory[0]?.productId ?? "",
      );
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSignOut();
        return;
      }
      setLoadError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
    }
  }, [authorization, onSignOut]);

  useEffect(() => {
    void Promise.resolve().then(loadInventory);
  }, [loadInventory]);

  async function handleAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProductId) {
      return;
    }

    setSaving(true);
    setFormError("");
    setNotice("");
    try {
      const adjustment = await adjustInventory(authorization, selectedProductId, {
        direction,
        quantity: Number(quantity),
        reason: reason.trim(),
      });
      setItems((current) =>
        current.map((item) =>
          item.productId === adjustment.productId
            ? { ...item, quantityOnHand: adjustment.quantityOnHand }
            : item,
        ),
      );
      setQuantity("");
      setReason("");
      setNotice(
        `${direction === "RECEIVE" ? "Received" : "Removed"} ${Math.abs(adjustment.quantityChange)} units.`,
      );
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSignOut();
        return;
      }
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to adjust inventory.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="w-full max-w-5xl rounded-2xl border border-white/10 bg-white/4 p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="border-b border-white/10 pb-6">
        <p className="text-sm font-medium text-emerald-300">Stock control</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Inventory
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Review on-hand quantities and record stock movements.
        </p>
      </div>

      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-white">Stock on hand</h3>
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
              {items.length} {items.length === 1 ? "product" : "products"}
            </span>
          </div>

          {loading && (
            <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400" role="status">
              Loading inventory…
            </p>
          )}
          {!loading && loadError && (
            <div className="rounded-xl border border-rose-300/20 bg-rose-300/5 p-5">
              <p className="text-sm text-rose-200" role="alert">{loadError}</p>
              <button
                className="mt-3 text-sm font-medium text-emerald-300 hover:text-emerald-200"
                onClick={() => void loadInventory()}
                type="button"
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !loadError && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 px-5 py-10 text-center">
              <p className="font-medium text-slate-200">No products to stock</p>
              <p className="mt-1 text-sm text-slate-400">
                Add products to your catalog before recording inventory.
              </p>
            </div>
          )}
          {!loading && !loadError && items.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 text-right font-medium">On hand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {items.map((item) => (
                    <tr className="text-slate-200" key={item.productId}>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-slate-400">{item.sku}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {item.quantityOnHand}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {notice && (
            <p className="mt-3 text-sm text-emerald-300" role="status">
              {notice}
            </p>
          )}
        </div>

        <form
          className="h-fit space-y-4 rounded-xl border border-white/10 bg-slate-950/40 p-5"
          onSubmit={handleAdjustment}
        >
          <div>
            <h3 className="font-semibold text-white">Adjust stock</h3>
            <p className="mt-1 text-sm text-slate-400">
              Every adjustment is recorded with a reason.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200" htmlFor="inventory-product">
              Product
            </label>
            <select
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              disabled={items.length === 0}
              id="inventory-product"
              onChange={(event) => setSelectedProductId(event.target.value)}
              required
              value={selectedProductId}
            >
              {items.map((item) => (
                <option key={item.productId} value={item.productId}>
                  {item.name} · {item.sku}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200" htmlFor="inventory-direction">
              Adjustment
            </label>
            <select
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              id="inventory-direction"
              onChange={(event) =>
                setDirection(event.target.value as "RECEIVE" | "REMOVE")
              }
              value={direction}
            >
              <option value="RECEIVE">Receive stock</option>
              <option value="REMOVE">Remove stock</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200" htmlFor="inventory-quantity">
              Quantity
            </label>
            <input
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              id="inventory-quantity"
              max="1000000"
              min="1"
              onChange={(event) => setQuantity(event.target.value)}
              required
              step="1"
              type="number"
              value={quantity}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200" htmlFor="inventory-reason">
              Reason
            </label>
            <input
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              id="inventory-reason"
              maxLength={200}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Supplier delivery"
              required
              value={reason}
            />
          </div>

          {formError && (
            <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">
              {formError}
            </p>
          )}

          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || loading || items.length === 0}
            type="submit"
          >
            {saving ? "Saving…" : "Record adjustment"}
          </button>
        </form>
      </div>
    </section>
  );
}
