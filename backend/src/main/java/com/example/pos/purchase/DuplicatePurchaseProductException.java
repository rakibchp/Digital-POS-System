package com.example.pos.purchase;

import java.util.UUID;

public class DuplicatePurchaseProductException extends RuntimeException {

	public DuplicatePurchaseProductException(UUID productId) {
		super("Product '" + productId + "' appears more than once in the receipt");
	}
}
