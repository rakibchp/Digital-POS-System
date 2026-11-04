package com.example.pos.customer;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.pos.config.SecurityConfiguration;

@WebMvcTest(CustomerController.class)
@Import(SecurityConfiguration.class)
class CustomerControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private CustomerService customerService;

	@Test
	void requiresAuthenticationToReadCustomers() throws Exception {
		mockMvc.perform(get("/api/v1/customers"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void returnsCustomersToAuthenticatedUsers() throws Exception {
		UUID customerId = UUID.fromString("6a427584-9c4a-4f4f-82fa-61b0bac118ea");
		given(customerService.findAll()).willReturn(List.of(new CustomerResponse(
				customerId, "Sam Customer", "sam@example.com", "555-0123",
				Instant.parse("2026-11-04T00:00:00Z"))));

		mockMvc.perform(get("/api/v1/customers").with(user("cashier")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Sam Customer"))
				.andExpect(jsonPath("$[0].email").value("sam@example.com"));
	}

	@Test
	void createsCustomersForAuthenticatedUsers() throws Exception {
		UUID customerId = UUID.fromString("6a427584-9c4a-4f4f-82fa-61b0bac118ea");
		given(customerService.create(org.mockito.ArgumentMatchers.any()))
				.willReturn(new CustomerResponse(
						customerId, "Sam Customer", null, null,
						Instant.parse("2026-11-04T00:00:00Z")));

		mockMvc.perform(post("/api/v1/customers")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Sam Customer"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", "/api/v1/customers/" + customerId))
				.andExpect(jsonPath("$.name").value("Sam Customer"))
				.andExpect(jsonPath("$.email").doesNotExist());
	}

	@Test
	void rejectsMalformedCustomerEmail() throws Exception {
		mockMvc.perform(post("/api/v1/customers")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Sam Customer","email":"not-an-email"}
						"""))
				.andExpect(status().isBadRequest());
	}
}
