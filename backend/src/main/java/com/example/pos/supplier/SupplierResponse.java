package com.example.pos.supplier;

import java.time.Instant;
import java.util.UUID;

public record SupplierResponse(UUID id, String name, String email, String phone, Instant createdAt) {
}
