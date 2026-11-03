package com.example.pos.status;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import com.example.pos.config.SecurityConfiguration;

@WebMvcTest(BackendStatusController.class)
@Import(SecurityConfiguration.class)
class BackendStatusControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void returnsBackendStatusAndTimestamp() throws Exception {
		mockMvc.perform(get("/api/v1/status"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("UP"))
				.andExpect(jsonPath("$.service").value("pos-backend"))
				.andExpect(jsonPath("$.checkedAt").isNotEmpty());
	}

	@Test
	void requiresAuthenticationForOtherRoutes() throws Exception {
		mockMvc.perform(get("/api/v1/private"))
				.andExpect(status().isUnauthorized());
	}
}
