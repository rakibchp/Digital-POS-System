package com.example.pos.sale;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SaleResponse(UUID id, BigDecimal totalAmount, Instant createdAt, List<SaleItemResponse> items) {
}
