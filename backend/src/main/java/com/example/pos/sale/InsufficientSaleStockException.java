package com.example.pos.sale;

import java.util.UUID;

public class InsufficientSaleStockException extends RuntimeException {

	public InsufficientSaleStockException(UUID productId, long available, int requested) {
		super("Product '%s' has %d units available; %d requested"
				.formatted(productId, available, requested));
	}
}
