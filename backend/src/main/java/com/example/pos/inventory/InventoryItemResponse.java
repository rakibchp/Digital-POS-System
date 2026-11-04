package com.example.pos.inventory;

import java.util.UUID;

public record InventoryItemResponse(
		UUID productId,
		String sku,
		String name,
		long quantityOnHand,
		int reorderPoint) {
}
