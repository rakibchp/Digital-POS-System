package com.example.pos.sale;

public class SalesReportRangeException extends RuntimeException {

	public SalesReportRangeException() {
		super("Report dates must be ordered and cover no more than 31 days");
	}
}
