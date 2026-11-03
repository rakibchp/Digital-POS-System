package com.example.pos.product;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
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

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@WebMvcTest(ProductController.class)
@Import(SecurityConfiguration.class)
class ProductControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private ProductService productService;

	@Test
	void requiresAuthenticationToListProducts() throws Exception {
		mockMvc.perform(get("/api/v1/products"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void returnsProductsForAuthenticatedUsers() throws Exception {
		ProductResponse product = new ProductResponse(
				UUID.fromString("6a427584-9c4a-4f4f-82fa-61b0bac118ea"),
				"COFFEE-01",
				"Coffee",
				new BigDecimal("3.50"),
				Instant.parse("2026-11-03T12:00:00Z"));
		given(productService.findAll()).willReturn(List.of(product));

		mockMvc.perform(get("/api/v1/products").with(user("cashier")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].sku").value("COFFEE-01"))
				.andExpect(jsonPath("$[0].price").value(3.50));
	}

	@Test
	void createsProductsForAuthenticatedUsers() throws Exception {
		UUID id = UUID.fromString("6a427584-9c4a-4f4f-82fa-61b0bac118ea");
		given(productService.create(org.mockito.ArgumentMatchers.any()))
				.willReturn(new ProductResponse(
						id,
						"COFFEE-01",
						"Coffee",
						new BigDecimal("3.50"),
						Instant.parse("2026-11-03T12:00:00Z")));

		mockMvc.perform(post("/api/v1/products")
				.with(user("cashier"))
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"sku":"COFFEE-01","name":"Coffee","price":3.50}
						"""))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", "/api/v1/products/" + id))
				.andExpect(jsonPath("$.sku").value("COFFEE-01"));
	}

	@Test
	void rejectsInvalidProductPrice() throws Exception {
		mockMvc.perform(post("/api/v1/products")
				.with(user("cashier"))
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"sku":"COFFEE-01","name":"Coffee","price":-1}
						"""))
				.andExpect(status().isBadRequest());
	}
}
