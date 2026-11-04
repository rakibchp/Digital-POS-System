package com.example.pos.sale;

import java.util.UUID;

public class DuplicateSaleProductException extends RuntimeException {

	public DuplicateSaleProductException(UUID productId) {
		super("Product '%s' appears more than once in the sale".formatted(productId));
	}
}
