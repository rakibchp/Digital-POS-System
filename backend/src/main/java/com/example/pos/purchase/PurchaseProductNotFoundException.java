package com.example.pos.purchase;

import java.util.UUID;

public class PurchaseProductNotFoundException extends RuntimeException {

	public PurchaseProductNotFoundException(UUID productId) {
		super("Product '" + productId + "' was not found");
	}
}
