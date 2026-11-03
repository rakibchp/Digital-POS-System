package com.example.pos.status;

import java.time.Instant;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/status")
public class BackendStatusController {

	@GetMapping
	public BackendStatusResponse getStatus() {
		return new BackendStatusResponse("UP", "pos-backend", Instant.now());
	}
}
