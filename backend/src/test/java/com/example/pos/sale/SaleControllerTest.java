package com.example.pos.sale;

import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

@WebMvcTest(SaleController.class)
@Import(SecurityConfiguration.class)
class SaleControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private SaleService saleService;

	@Test
	void requiresAuthenticationToReadSales() throws Exception {
		mockMvc.perform(get("/api/v1/sales"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void createsAuthenticatedSale() throws Exception {
		UUID saleId = UUID.fromString("93dd31a7-6e6c-4c4a-8982-d0774203a67e");
		UUID productId = UUID.fromString("6a427584-9c4a-4f4f-82fa-61b0bac118ea");
		given(saleService.create(org.mockito.ArgumentMatchers.any()))
				.willReturn(new SaleResponse(
						saleId,
						new BigDecimal("7.00"),
						Instant.parse("2026-11-04T00:00:00Z"),
						null,
						null,
						PaymentMethod.CASH,
						new BigDecimal("7.00"),
						BigDecimal.ZERO,
						null,
						null,
						null,
						List.of(new SaleItemResponse(
								productId, "COFFEE-01", "Coffee",
								new BigDecimal("3.50"), 2, new BigDecimal("7.00")))));

		mockMvc.perform(post("/api/v1/sales")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"paymentMethod":"CASH","items":[{"productId":"6a427584-9c4a-4f4f-82fa-61b0bac118ea","quantity":2}]}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.totalAmount").value(7.00))
				.andExpect(jsonPath("$.paymentMethod").value("CASH"))
				.andExpect(jsonPath("$.amountTendered").value(7.00))
				.andExpect(jsonPath("$.changeDue").value(0.00))
				.andExpect(jsonPath("$.items[0].sku").value("COFFEE-01"));
	}

	@Test
	void requiresPaymentMethod() throws Exception {
		mockMvc.perform(post("/api/v1/sales")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"items":[{"productId":"6a427584-9c4a-4f4f-82fa-61b0bac118ea","quantity":1}]}
						"""))
				.andExpect(status().isBadRequest());
	}

	@Test
	void rejectsAnEmptySale() throws Exception {
		mockMvc.perform(post("/api/v1/sales")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"paymentMethod":"CASH","items":[]}
						"""))
				.andExpect(status().isBadRequest());
	}

	@Test
	void reportsInsufficientStockAsConflict() throws Exception {
		given(saleService.create(org.mockito.ArgumentMatchers.any()))
				.willThrow(new InsufficientSaleStockException(
						UUID.fromString("6a427584-9c4a-4f4f-82fa-61b0bac118ea"), 1, 2));

		mockMvc.perform(post("/api/v1/sales")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"paymentMethod":"CASH","items":[{"productId":"6a427584-9c4a-4f4f-82fa-61b0bac118ea","quantity":2}]}
						"""))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value(
						"Product '6a427584-9c4a-4f4f-82fa-61b0bac118ea' has 1 units available; 2 requested"));
	}

	@Test
	void reportsInsufficientCashTenderAsBadRequest() throws Exception {
		given(saleService.create(org.mockito.ArgumentMatchers.any()))
				.willThrow(new InsufficientPaymentException(
						new BigDecimal("7.00"), new BigDecimal("5.00")));

		mockMvc.perform(post("/api/v1/sales")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"paymentMethod":"CASH","amountTendered":5.00,"items":[{"productId":"6a427584-9c4a-4f4f-82fa-61b0bac118ea","quantity":2}]}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value(
						"Cash tendered 5.00 is less than sale total 7.00"));
	}

	@Test
	void requiresAuthenticationToReturnASale() throws Exception {
		mockMvc.perform(post("/api/v1/sales/93dd31a7-6e6c-4c4a-8982-d0774203a67e/return")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"reason":"Customer returned item"}
						"""))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void returnsASaleForAuthenticatedUsers() throws Exception {
		UUID saleId = UUID.fromString("93dd31a7-6e6c-4c4a-8982-d0774203a67e");
		given(saleService.returnSale(
				org.mockito.ArgumentMatchers.eq(saleId),
				org.mockito.ArgumentMatchers.any()))
				.willReturn(new SaleResponse(
						saleId,
						new BigDecimal("7.00"),
						Instant.parse("2026-11-04T00:00:00Z"),
						null,
						null,
						PaymentMethod.CASH,
						new BigDecimal("7.00"),
						BigDecimal.ZERO,
						Instant.parse("2026-11-04T01:00:00Z"),
						"Customer returned item",
						new BigDecimal("7.00"),
						List.of()));

		mockMvc.perform(post("/api/v1/sales/" + saleId + "/return")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"reason":"Customer returned item"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.refundAmount").value(7.00))
				.andExpect(jsonPath("$.returnReason").value("Customer returned item"));
	}

	@Test
	void rejectsBlankReturnReason() throws Exception {
		mockMvc.perform(post("/api/v1/sales/93dd31a7-6e6c-4c4a-8982-d0774203a67e/return")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"reason":"  "}
						"""))
				.andExpect(status().isBadRequest());
	}
}
