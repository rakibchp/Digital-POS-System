package com.example.pos.purchase;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PurchaseReceiptResponse(
		UUID id,
		UUID supplierId,
		String supplierName,
		String supplierReference,
		BigDecimal totalCost,
		Instant createdAt,
		List<PurchaseReceiptItemResponse> items) {
}
