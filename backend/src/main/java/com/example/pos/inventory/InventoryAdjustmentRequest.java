package com.example.pos.inventory;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record InventoryAdjustmentRequest(
		@NotNull Direction direction,
		@NotNull @Positive @Max(1_000_000) Integer quantity,
		@NotBlank @Size(max = 200) String reason) {

	public enum Direction {
		RECEIVE,
		REMOVE
	}
}
