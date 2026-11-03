package com.example.pos.status;

import java.time.Instant;

public record BackendStatusResponse(String status, String service, Instant checkedAt) {
}
