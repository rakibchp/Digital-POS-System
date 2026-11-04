package com.example.pos.purchase;

import java.util.UUID;

public class SupplierNotFoundException extends RuntimeException {

	public SupplierNotFoundException(UUID supplierId) {
		super("Supplier '" + supplierId + "' was not found");
	}
}
