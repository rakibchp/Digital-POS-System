package com.example.pos.inventory;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ReorderPointRequest(
		@NotNull @PositiveOrZero @Max(1_000_000) Integer reorderPoint) {
}
