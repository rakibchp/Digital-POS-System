package com.example.pos.supplier;

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

@WebMvcTest(SupplierController.class)
@Import(SecurityConfiguration.class)
class SupplierControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private SupplierService supplierService;

	@Test
	void requiresAuthenticationToReadSuppliers() throws Exception {
		mockMvc.perform(get("/api/v1/suppliers"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void returnsSuppliersToAuthenticatedUsers() throws Exception {
		UUID supplierId = UUID.randomUUID();
		given(supplierService.findAll()).willReturn(List.of(new SupplierResponse(
				supplierId, "Coffee Co", "orders@example.com", null,
				Instant.parse("2026-11-04T00:00:00Z"))));

		mockMvc.perform(get("/api/v1/suppliers").with(user("cashier")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Coffee Co"))
				.andExpect(jsonPath("$[0].email").value("orders@example.com"));
	}

	@Test
	void createsSuppliersForAuthenticatedUsers() throws Exception {
		UUID supplierId = UUID.randomUUID();
		given(supplierService.create(org.mockito.ArgumentMatchers.any()))
				.willReturn(new SupplierResponse(
						supplierId, "Coffee Co", null, null,
						Instant.parse("2026-11-04T00:00:00Z")));

		mockMvc.perform(post("/api/v1/suppliers")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Coffee Co"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", "/api/v1/suppliers/" + supplierId))
				.andExpect(jsonPath("$.name").value("Coffee Co"));
	}

	@Test
	void rejectsMalformedSupplierEmail() throws Exception {
		mockMvc.perform(post("/api/v1/suppliers")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Coffee Co","email":"not-an-email"}
						"""))
				.andExpect(status().isBadRequest());
	}
}
