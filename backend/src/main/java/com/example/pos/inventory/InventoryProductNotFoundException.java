package com.example.pos.inventory;

import java.util.UUID;

public class InventoryProductNotFoundException extends RuntimeException {

	public InventoryProductNotFoundException(UUID productId) {
		super("Product '%s' was not found".formatted(productId));
	}
}
