import type { Sale } from "@/lib/api/backend";

export interface SalesSummary {
  saleCount: number;
  totalRevenue: number;
  averageSale: number;
  itemsSold: number;
  bestSellers: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
}

export function summarizeSales(sales: Sale[]): SalesSummary {
  const products = new Map<string, SalesSummary["bestSellers"][number]>();
  const totalRevenue = sales.reduce((total, sale) => total + sale.totalAmount, 0);
  let itemsSold = 0;

  for (const sale of sales) {
    for (const item of sale.items) {
      itemsSold += item.quantity;
      const current = products.get(item.productId);
      products.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: (current?.quantity ?? 0) + item.quantity,
        revenue: (current?.revenue ?? 0) + item.lineTotal,
      });
    }
  }

  return {
    saleCount: sales.length,
    totalRevenue,
    averageSale: sales.length === 0 ? 0 : totalRevenue / sales.length,
    itemsSold,
    bestSellers: [...products.values()]
      .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
      .slice(0, 5),
  };
}
