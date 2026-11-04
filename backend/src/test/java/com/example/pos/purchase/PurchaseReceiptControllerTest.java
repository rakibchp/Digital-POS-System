package com.example.pos.purchase;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.pos.config.SecurityConfiguration;

@WebMvcTest(PurchaseReceiptController.class)
@Import(SecurityConfiguration.class)
class PurchaseReceiptControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private PurchaseReceiptService receiptService;

	@Test
	void requiresAuthenticationToReadReceipts() throws Exception {
		mockMvc.perform(get("/api/v1/purchases/receipts"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsReceiptLinesWithInvalidQuantities() throws Exception {
		mockMvc.perform(post("/api/v1/purchases/receipts")
				.with(user("cashier"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "supplierId":"5f01b5cb-745d-4113-9790-97e26da0c070",
						  "items":[
						    {
						      "productId":"5f01b5cb-745d-4113-9790-97e26da0c071",
						      "quantity":0,
						      "unitCost":1.25
						    }
						  ]
						}
						"""))
				.andExpect(status().isBadRequest());
	}
}
