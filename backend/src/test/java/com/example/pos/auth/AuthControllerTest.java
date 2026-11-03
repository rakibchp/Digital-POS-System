package com.example.pos.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import com.example.pos.config.SecurityConfiguration;

@WebMvcTest(
		value = AuthController.class,
		properties = {
				"spring.security.user.name=admin",
				"spring.security.user.password=test-password"
		})
@Import(SecurityConfiguration.class)
class AuthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void requiresAuthentication() throws Exception {
		mockMvc.perform(get("/api/v1/auth/session"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void returnsAuthenticatedUsernameForValidBasicCredentials() throws Exception {
		mockMvc.perform(get("/api/v1/auth/session")
				.with(httpBasic("admin", "test-password")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value("admin"));
	}

	@Test
	void rejectsInvalidBasicCredentials() throws Exception {
		mockMvc.perform(get("/api/v1/auth/session")
				.with(httpBasic("admin", "wrong-password")))
				.andExpect(status().isUnauthorized());
	}
}
