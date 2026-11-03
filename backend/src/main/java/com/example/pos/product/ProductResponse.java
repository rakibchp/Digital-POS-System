package com.example.pos.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductResponse(UUID id, String sku, String name, BigDecimal price, Instant createdAt) {
}
