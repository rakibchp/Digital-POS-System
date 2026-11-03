package com.example.pos.inventory;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

@WebMvcTest(InventoryController.class)
@Import(SecurityConfiguration.class)
class InventoryControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private InventoryService inventoryService;

	@Test
	void requiresAuthenticationToReadInventory() throws Exception {
		mockMvc.perform(get("/api/v1/inventory"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void returnsInventoryForAuthenticatedUsers() throws Exception {
		given(inventoryService.findInventory())
				.willReturn(List.of(new InventoryItemResponse(
						UUID.fromString("6a427584-9c4a-4f4f-82fa-61b0bac118ea"),
						"TEA-01",
						"Green tea",
						12)));

		mockMvc.perform(get("/api/v1/inventory").with(user("admin")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].sku").value("TEA-01"))
				.andExpect(jsonPath("$[0].quantityOnHand").value(12));
	}

	@Test
	void createsAStockAdjustment() throws Exception {
		UUID productId = UUID.fromString("6a427584-9c4a-4f4f-82fa-61b0bac118ea");
		UUID adjustmentId = UUID.fromString("971c5455-fc7e-44ee-8c4b-aac3cd741b10");
		given(inventoryService.adjust(org.mockito.ArgumentMatchers.eq(productId), org.mockito.ArgumentMatchers.any()))
				.willReturn(new InventoryAdjustmentResponse(
						adjustmentId,
						productId,
						5,
						5,
						"Opening stock",
						Instant.parse("2026-11-04T00:00:00Z")));

		mockMvc.perform(post("/api/v1/inventory/{productId}/adjustments", productId)
				.with(user("admin"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"direction":"RECEIVE","quantity":5,"reason":"Opening stock"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantityChange").value(5))
				.andExpect(jsonPath("$.quantityOnHand").value(5));
	}

	@Test
	void rejectsZeroQuantityAdjustments() throws Exception {
		mockMvc.perform(post("/api/v1/inventory/{productId}/adjustments", UUID.randomUUID())
				.with(user("admin"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"direction":"RECEIVE","quantity":0,"reason":"Restock"}
						"""))
				.andExpect(status().isBadRequest());
	}

	@Test
	void reportsInsufficientStockAsConflict() throws Exception {
		UUID productId = UUID.fromString("6a427584-9c4a-4f4f-82fa-61b0bac118ea");
		given(inventoryService.adjust(org.mockito.ArgumentMatchers.eq(productId), org.mockito.ArgumentMatchers.any()))
				.willThrow(new InsufficientStockException("Cannot remove 2 units; only 1 are currently in stock"));

		mockMvc.perform(post("/api/v1/inventory/{productId}/adjustments", productId)
				.with(user("admin"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"direction":"REMOVE","quantity":2,"reason":"Damaged stock"}
						"""))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value(
						"Cannot remove 2 units; only 1 are currently in stock"));
	}
}
