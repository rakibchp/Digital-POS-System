package com.example.pos.sale;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Max;

public record CreateSaleRequest(
		UUID customerId,
		@NotEmpty @Size(max = 100) List<@Valid SaleLineRequest> items) {

	public record SaleLineRequest(
			@NotNull UUID productId,
			@NotNull @Positive @Max(1_000_000) Integer quantity) {
	}
}
