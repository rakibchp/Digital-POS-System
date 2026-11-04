import type { Sale } from "@/lib/api/backend";

function csvCell(value: string | number): string {
  const rawText = String(value);
  const text =
    typeof value === "string" && /^[\t\r\n ]*[=+\-@]/.test(rawText)
      ? `'${rawText}`
      : rawText;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createSalesCsv(sales: Sale[]): string {
  const rows: Array<Array<string | number>> = [
    [
      "Sale ID",
      "Date",
      "Status",
      "Customer",
      "Payment method",
      "Sale total",
      "Refund",
      "Product SKU",
      "Product",
      "Quantity",
      "Unit price",
      "Line total",
    ],
  ];

  for (const sale of sales) {
    const shared = [
      sale.id,
      sale.createdAt,
      sale.returnedAt ? "Returned" : "Completed",
      sale.customerName ?? "Walk-in",
      sale.paymentMethod ?? "Not recorded",
      sale.totalAmount.toFixed(2),
      (sale.refundAmount ?? 0).toFixed(2),
    ];
    for (const item of sale.items) {
      rows.push([
        ...shared,
        item.sku,
        item.productName,
        item.quantity,
        item.unitPrice.toFixed(2),
        item.lineTotal.toFixed(2),
      ]);
    }
  }

  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
