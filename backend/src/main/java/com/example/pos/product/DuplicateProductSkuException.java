package com.example.pos.product;

public class DuplicateProductSkuException extends RuntimeException {

	public DuplicateProductSkuException(String sku) {
		super("A product with SKU '%s' already exists".formatted(sku));
	}

	public DuplicateProductSkuException(String sku, Throwable cause) {
		super("A product with SKU '%s' already exists".formatted(sku), cause);
	}
}
