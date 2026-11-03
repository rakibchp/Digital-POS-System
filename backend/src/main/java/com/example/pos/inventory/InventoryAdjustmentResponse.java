package com.example.pos.inventory;

import java.time.Instant;
import java.util.UUID;

public record InventoryAdjustmentResponse(
		UUID id,
		UUID productId,
		int quantityChange,
		long quantityOnHand,
		String reason,
		Instant createdAt) {
}
