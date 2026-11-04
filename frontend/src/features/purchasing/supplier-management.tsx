"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ApiError,
  createPurchaseReceipt,
  createSupplier,
  getInventory,
  getProducts,
  getPurchaseReceipts,
  getSuppliers,
  type InventoryItem,
  type Product,
  type PurchaseReceipt,
  type Supplier,
} from "@/lib/api/backend";

interface SupplierManagementProps {
  authorization: string;
  onSignOut: () => void;
}

interface ReceiptDraftLine {
  productId: string;
  quantity: string;
  unitCost: string;
}

const blankLine = (): ReceiptDraftLine => ({
  productId: "",
  quantity: "1",
  unitCost: "",
});

export function SupplierManagement({
  authorization,
  onSignOut,
}: SupplierManagementProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierReference, setSupplierReference] = useState("");
  const [lines, setLines] = useState<ReceiptDraftLine[]>([blankLine()]);
  const [loading, setLoading] = useState(true);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [supplierList, productList, stock, recentReceipts] =
        await Promise.all([
          getSuppliers(authorization),
          getProducts(authorization),
          getInventory(authorization),
          getPurchaseReceipts(authorization),
        ]);
      setSuppliers(supplierList);
      setProducts(productList);
      setInventory(stock);
      setReceipts(recentReceipts);
      setSupplierId((current) =>
        supplierList.some((supplier) => supplier.id === current)
          ? current
          : supplierList[0]?.id ?? "",
      );
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSignOut();
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load supplier and receiving data.",
      );
    } finally {
      setLoading(false);
    }
  }, [authorization, onSignOut]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  async function handleAddSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSupplier(true);
    setError("");
    setNotice("");
    try {
      const supplier = await createSupplier(authorization, {
        name: supplierName.trim(),
        ...(supplierEmail.trim() ? { email: supplierEmail.trim() } : {}),
        ...(supplierPhone.trim() ? { phone: supplierPhone.trim() } : {}),
      });
      setSuppliers((current) =>
        [...current, supplier].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      );
      setSupplierId(supplier.id);
      setSupplierName("");
      setSupplierEmail("");
      setSupplierPhone("");
      setNotice(`${supplier.name} added.`);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSignOut();
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add supplier.",
      );
    } finally {
      setSavingSupplier(false);
    }
  }

  async function handleReceive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingReceipt(true);
    setError("");
    setNotice("");
    try {
      const receipt = await createPurchaseReceipt(authorization, {
        supplierId,
        ...(supplierReference.trim()
          ? { supplierReference: supplierReference.trim() }
          : {}),
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost),
        })),
      });
      setReceipts((current) => [receipt, ...current].slice(0, 50));
      setInventory((current) =>
        current.map((item) => {
          const received = receipt.items.find(
            (line) => line.productId === item.productId,
          );
          return received
            ? {
                ...item,
                quantityOnHand: item.quantityOnHand + received.quantity,
              }
            : item;
        }),
      );
      setSupplierReference("");
      setLines([blankLine()]);
      setNotice(
        `Received ${receipt.items.length} ${
          receipt.items.length === 1 ? "product" : "products"
        } from ${receipt.supplierName}.`,
      );
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onSignOut();
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to record the delivery.",
      );
    } finally {
      setSavingReceipt(false);
    }
  }

  function updateLine(index: number, patch: Partial<ReceiptDraftLine>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  const draftTotal = lines.reduce(
    (total, line) =>
      total + Number(line.quantity || 0) * Number(line.unitCost || 0),
    0,
  );

  return (
    <section className="w-full max-w-6xl rounded-2xl border border-white/10 bg-white/4 p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="border-b border-white/10 pb-6">
        <p className="text-sm font-medium text-emerald-300">
          Purchasing and stock
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Suppliers &amp; receiving
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Track supplier deliveries and post received quantities to inventory.
        </p>
      </div>

      {error && (
        <p
          className="mt-5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200"
          role="status"
        >
          {notice}
        </p>
      )}

      {loading ? (
        <p className="mt-6 rounded-xl border border-white/10 p-5 text-sm text-slate-400" role="status">
          Loading suppliers and stock…
        </p>
      ) : (
        <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-8">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">Recent deliveries</h3>
                <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
                  {receipts.length} receipts
                </span>
              </div>
              {receipts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-slate-400">
                  Received deliveries will appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt) => (
                    <article
                      className="rounded-xl border border-white/10 bg-slate-950/30 p-4"
                      key={receipt.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-white">
                            {receipt.supplierName}
                          </h4>
                          <p className="mt-1 text-xs text-slate-400">
                            {new Date(receipt.createdAt).toLocaleString()}
                            {receipt.supplierReference
                              ? ` · Ref ${receipt.supplierReference}`
                              : ""}
                          </p>
                        </div>
                        <p className="font-semibold tabular-nums text-emerald-200">
                          ${receipt.totalCost.toFixed(2)}
                        </p>
                      </div>
                      <ul className="mt-3 space-y-1 border-t border-white/8 pt-3 text-sm text-slate-300">
                        {receipt.items.map((item) => (
                          <li
                            className="flex justify-between gap-3"
                            key={item.productId}
                          >
                            <span>
                              {item.productName} · {item.quantity}
                            </span>
                            <span className="text-slate-400">
                              ${item.lineCost.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-white">Suppliers</h3>
              {suppliers.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 px-5 py-6 text-sm text-slate-400">
                  Add a supplier before recording its first delivery.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {suppliers.map((supplier) => (
                    <li
                      className="rounded-lg border border-white/10 px-4 py-3"
                      key={supplier.id}
                    >
                      <p className="font-medium text-slate-200">
                        {supplier.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {[supplier.email, supplier.phone]
                          .filter(Boolean)
                          .join(" · ") || "No contact details"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <form
              className="space-y-4 rounded-xl border border-white/10 bg-slate-950/40 p-5"
              onSubmit={handleAddSupplier}
            >
              <div>
                <h3 className="font-semibold text-white">Add supplier</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Keep contact details for future receiving.
                </p>
              </div>
              <label className="block space-y-2 text-sm font-medium text-slate-200">
                Supplier name
                <input
                  autoComplete="organization"
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-emerald-300"
                  maxLength={200}
                  onChange={(event) => setSupplierName(event.target.value)}
                  required
                  value={supplierName}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-slate-200">
                Email
                <input
                  autoComplete="email"
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-emerald-300"
                  maxLength={254}
                  onChange={(event) => setSupplierEmail(event.target.value)}
                  type="email"
                  value={supplierEmail}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium text-slate-200">
                Phone
                <input
                  autoComplete="tel"
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-emerald-300"
                  maxLength={32}
                  onChange={(event) => setSupplierPhone(event.target.value)}
                  type="tel"
                  value={supplierPhone}
                />
              </label>
              <button
                className="h-10 w-full rounded-lg border border-white/15 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/8 disabled:opacity-50"
                disabled={savingSupplier}
                type="submit"
              >
                {savingSupplier ? "Saving…" : "Add supplier"}
              </button>
            </form>

            <form
              className="space-y-4 rounded-xl border border-emerald-300/20 bg-slate-950/40 p-5"
              onSubmit={handleReceive}
            >
              <div>
                <h3 className="font-semibold text-white">Receive delivery</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Stock and receipt are saved together.
                </p>
              </div>
              {suppliers.length === 0 || products.length === 0 ? (
                <p className="rounded-lg bg-white/5 p-3 text-sm text-slate-400">
                  {suppliers.length === 0
                    ? "Add a supplier to enable receiving."
                    : "Add products to the catalog before receiving stock."}
                </p>
              ) : (
                <>
                  <label className="block space-y-2 text-sm font-medium text-slate-200">
                    Supplier
                    <select
                      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-emerald-300"
                      onChange={(event) => setSupplierId(event.target.value)}
                      required
                      value={supplierId}
                    >
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2 text-sm font-medium text-slate-200">
                    Supplier reference (optional)
                    <input
                      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-emerald-300"
                      maxLength={64}
                      onChange={(event) =>
                        setSupplierReference(event.target.value)
                      }
                      value={supplierReference}
                    />
                  </label>
                  <div className="space-y-3">
                    {lines.map((line, index) => (
                      <fieldset
                        className="space-y-3 rounded-lg border border-white/10 p-3"
                        key={index}
                      >
                        <legend className="px-1 text-xs font-medium text-slate-400">
                          Product {index + 1}
                        </legend>
                        <label className="block space-y-2 text-sm text-slate-200">
                          Product
                          <select
                            className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-white"
                            onChange={(event) =>
                              updateLine(index, {
                                productId: event.target.value,
                              })
                            }
                            required
                            value={line.productId}
                          >
                            <option value="">Select product</option>
                            {products.map((product) => (
                              <option
                                disabled={lines.some(
                                  (other, otherIndex) =>
                                    otherIndex !== index &&
                                    other.productId === product.id,
                                )}
                                key={product.id}
                                value={product.id}
                              >
                                {product.name} · {product.sku}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block space-y-2 text-sm text-slate-200">
                            Quantity
                            <input
                              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-white"
                              max="1000000"
                              min="1"
                              onChange={(event) =>
                                updateLine(index, {
                                  quantity: event.target.value,
                                })
                              }
                              required
                              step="1"
                              type="number"
                              value={line.quantity}
                            />
                          </label>
                          <label className="block space-y-2 text-sm text-slate-200">
                            Unit cost
                            <input
                              className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-white"
                              min="0"
                              onChange={(event) =>
                                updateLine(index, {
                                  unitCost: event.target.value,
                                })
                              }
                              required
                              step="0.01"
                              type="number"
                              value={line.unitCost}
                            />
                          </label>
                        </div>
                        {lines.length > 1 && (
                          <button
                            className="text-xs font-medium text-rose-200 hover:text-rose-100"
                            onClick={() =>
                              setLines((current) =>
                                current.filter(
                                  (_, lineIndex) => lineIndex !== index,
                                ),
                              )
                            }
                            type="button"
                          >
                            Remove product
                          </button>
                        )}
                      </fieldset>
                    ))}
                    {lines.length < products.length && (
                      <button
                        className="text-sm font-medium text-emerald-200 hover:text-emerald-100"
                        onClick={() =>
                          setLines((current) => [...current, blankLine()])
                        }
                        type="button"
                      >
                        + Add another product
                      </button>
                    )}
                  </div>
                  <p className="flex justify-between border-t border-white/10 pt-3 text-sm">
                    <span className="text-slate-400">Estimated total</span>
                    <span className="font-semibold tabular-nums text-white">
                      ${draftTotal.toFixed(2)}
                    </span>
                  </p>
                  <button
                    className="h-10 w-full rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      savingReceipt ||
                      !supplierId ||
                      lines.some(
                        (line) =>
                          !line.productId ||
                          !line.quantity ||
                          !line.unitCost,
                      )
                    }
                    type="submit"
                  >
                    {savingReceipt ? "Recording…" : "Record delivery"}
                  </button>
                </>
              )}
            </form>
          </div>
          <div className="lg:col-span-2">
            <h3 className="mb-3 font-semibold text-white">Current stock</h3>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 text-right font-medium">
                      On hand
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {inventory.map((item) => (
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
          </div>
        </div>
      )}
    </section>
  );
}
