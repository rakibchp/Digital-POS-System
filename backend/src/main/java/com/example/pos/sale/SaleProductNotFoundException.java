package com.example.pos.sale;

import java.util.UUID;

public class SaleProductNotFoundException extends RuntimeException {

	public SaleProductNotFoundException(UUID productId) {
		super("Product '%s' was not found".formatted(productId));
	}
}
