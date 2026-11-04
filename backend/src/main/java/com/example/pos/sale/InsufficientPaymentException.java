package com.example.pos.sale;

import java.math.BigDecimal;

public class InsufficientPaymentException extends RuntimeException {

	public InsufficientPaymentException(BigDecimal total, BigDecimal tendered) {
		super("Cash tendered " + tendered + " is less than sale total " + total);
	}
}
