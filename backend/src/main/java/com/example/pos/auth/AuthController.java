package com.example.pos.auth;

import java.security.Principal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	@GetMapping("/session")
	public AuthSession getSession(Principal principal) {
		return new AuthSession(principal.getName());
	}

	public record AuthSession(String username) {
	}
}
