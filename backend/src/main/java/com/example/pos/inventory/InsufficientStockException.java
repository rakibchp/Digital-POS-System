package com.example.pos.inventory;

public class InsufficientStockException extends RuntimeException {

	public InsufficientStockException(String message) {
		super(message);
	}
}
