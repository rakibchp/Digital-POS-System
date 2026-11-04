package com.example.pos.sale;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaleReturnRequest(
		@NotBlank @Size(max = 150) String reason) {
}
