package com.example.pos.customer;

import java.time.Instant;
import java.util.UUID;

public record CustomerResponse(
		UUID id,
		String name,
		String email,
		String phone,
		Instant createdAt) {
}
