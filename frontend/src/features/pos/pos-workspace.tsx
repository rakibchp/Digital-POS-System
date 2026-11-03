"use client";

import { useState } from "react";
import { BackendStatusCard } from "@/features/backend-status/backend-status-card";
import { LoginForm } from "@/features/auth/login-form";
import { InventoryManagement } from "@/features/inventory/inventory-management";
import { ProductCatalog } from "@/features/products/product-catalog";

export function PosWorkspace() {
  const [authenticated, setAuthenticated] = useState<{
    username: string;
    authorization: string;
  } | null>(null);
  const [section, setSection] = useState<"products" | "inventory">("products");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-white sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.16),_transparent_55%)]"
      />
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center">
        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Digital POS
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Retail workspace
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Manage the catalog that powers your point of sale.
          </p>
        </header>

        <div className="mb-6 w-full">
          <BackendStatusCard />
        </div>

        {authenticated ? (
          <>
            <div className="mb-4 flex w-full max-w-5xl items-center gap-2 rounded-xl border border-white/10 bg-white/4 p-1.5">
              <button
                aria-current={section === "products" ? "page" : undefined}
                className={`h-10 flex-1 rounded-lg px-4 text-sm font-medium transition ${
                  section === "products"
                    ? "bg-emerald-300 text-slate-950"
                    : "text-slate-300 hover:bg-white/8"
                }`}
                onClick={() => setSection("products")}
                type="button"
              >
                Products
              </button>
              <button
                aria-current={section === "inventory" ? "page" : undefined}
                className={`h-10 flex-1 rounded-lg px-4 text-sm font-medium transition ${
                  section === "inventory"
                    ? "bg-emerald-300 text-slate-950"
                    : "text-slate-300 hover:bg-white/8"
                }`}
                onClick={() => setSection("inventory")}
                type="button"
              >
                Inventory
              </button>
              <span className="hidden px-3 text-sm text-slate-400 sm:inline">
                {authenticated.username}
              </span>
              <button
                className="mr-1 h-9 rounded-lg border border-white/15 px-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                onClick={() => setAuthenticated(null)}
                type="button"
              >
                Sign out
              </button>
            </div>
            {section === "products" ? (
              <ProductCatalog
                authorization={authenticated.authorization}
                onSignOut={() => setAuthenticated(null)}
                username={authenticated.username}
              />
            ) : (
              <InventoryManagement
                authorization={authenticated.authorization}
                onSignOut={() => setAuthenticated(null)}
              />
            )}
          </>
        ) : (
          <LoginForm
            onAuthenticated={(username, authorization) =>
              setAuthenticated({ username, authorization })
            }
          />
        )}
      </div>
    </main>
  );
}
