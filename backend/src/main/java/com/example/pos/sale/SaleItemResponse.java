package com.example.pos.sale;

import java.math.BigDecimal;
import java.util.UUID;

public record SaleItemResponse(
		UUID productId,
		String sku,
		String productName,
		BigDecimal unitPrice,
		int quantity,
		BigDecimal lineTotal) {
}
