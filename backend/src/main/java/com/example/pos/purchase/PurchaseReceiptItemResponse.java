package com.example.pos.purchase;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseReceiptItemResponse(
		UUID productId,
		String sku,
		String productName,
		int quantity,
		BigDecimal unitCost,
		BigDecimal lineCost) {
}
