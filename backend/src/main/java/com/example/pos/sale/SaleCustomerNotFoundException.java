package com.example.pos.sale;

import java.util.UUID;

public class SaleCustomerNotFoundException extends RuntimeException {

	public SaleCustomerNotFoundException(UUID customerId) {
		super("Customer '" + customerId + "' was not found");
	}
}
