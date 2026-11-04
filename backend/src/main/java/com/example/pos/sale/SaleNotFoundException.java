package com.example.pos.sale;

import java.util.UUID;

public class SaleNotFoundException extends RuntimeException {

	public SaleNotFoundException(UUID saleId) {
		super("Sale '" + saleId + "' was not found");
	}
}
