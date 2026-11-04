package com.example.pos.sale;

import java.util.UUID;

public class SaleAlreadyReturnedException extends RuntimeException {

	public SaleAlreadyReturnedException(UUID saleId) {
		super("Sale '" + saleId + "' has already been returned");
	}
}
