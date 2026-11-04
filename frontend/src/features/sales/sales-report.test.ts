import { describe, expect, it } from "vitest";
import type { Sale } from "@/lib/api/backend";
import { createSalesCsv } from "./sales-report";

describe("createSalesCsv", () => {
  it("exports sale lines and safely escapes spreadsheet cells", () => {
    const sale: Sale = {
      id: 'sale,"one"',
      totalAmount: 5,
      createdAt: "2026-11-04T10:00:00Z",
      customerId: null,
      customerName: 'Sam "Customer"',
      paymentMethod: "CASH",
      amountTendered: 5,
      changeDue: 0,
      returnedAt: null,
      returnReason: null,
      refundAmount: null,
      items: [
        {
          productId: "product-1",
          sku: "COF,01",
          productName: "Coffee",
          unitPrice: 2.5,
          quantity: 2,
          lineTotal: 5,
        },
      ],
    };

    const csv = createSalesCsv([sale]);

    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain('"sale,""one"""');
    expect(csv).toContain('"Sam ""Customer"""');
    expect(csv).toContain('"COF,01"');
    expect(csv).toContain('"2.50","5.00"');
  });

  it("exports a returned sale with refund details", () => {
    const sale: Sale = {
      id: "returned-sale",
      totalAmount: 12,
      createdAt: "2026-11-04T10:00:00Z",
      customerId: null,
      customerName: null,
      paymentMethod: "CARD",
      amountTendered: 12,
      changeDue: 0,
      returnedAt: "2026-11-04T11:00:00Z",
      returnReason: "Changed mind",
      refundAmount: 12,
      items: [
        {
          productId: "product-1",
          sku: "TEA-01",
          productName: "Tea",
          unitPrice: 12,
          quantity: 1,
          lineTotal: 12,
        },
      ],
    };

    expect(createSalesCsv([sale])).toContain(
      '"returned-sale","2026-11-04T10:00:00Z","Returned","Walk-in","CARD","12.00","12.00"',
    );
  });

  it("neutralizes spreadsheet formulas in text fields", () => {
    const sale: Sale = {
      id: "sale-1",
      totalAmount: 1,
      createdAt: "2026-11-04T10:00:00Z",
      customerId: null,
      customerName: null,
      paymentMethod: "CASH",
      amountTendered: 1,
      changeDue: 0,
      returnedAt: null,
      returnReason: null,
      refundAmount: null,
      items: [
        {
          productId: "product-1",
          sku: "=1+1",
          productName: "Coffee",
          unitPrice: 1,
          quantity: 1,
          lineTotal: 1,
        },
      ],
    };

    expect(createSalesCsv([sale])).toContain(',"\'=1+1","Coffee"');
  });
});
