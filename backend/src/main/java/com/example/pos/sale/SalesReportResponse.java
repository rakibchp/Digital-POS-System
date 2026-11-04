package com.example.pos.sale;

import java.time.LocalDate;
import java.util.List;

public record SalesReportResponse(
		LocalDate from,
		LocalDate to,
		List<SaleResponse> sales) {
}
