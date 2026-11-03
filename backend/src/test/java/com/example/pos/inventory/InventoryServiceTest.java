package com.example.pos.inventory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.when;

import com.example.pos.product.Product;
import com.example.pos.product.ProductRepository;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

	@Mock
	private InventoryRepository inventoryRepository;

	@Mock
	private ProductRepository productRepository;

	@InjectMocks
	private InventoryService inventoryService;

	@Test
	void removesStockAndReturnsTheNewBalance() {
		UUID productId = UUID.randomUUID();
		Product product = mock(Product.class);
		when(product.getId()).thenReturn(productId);
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.of(product));
		given(inventoryRepository.sumQuantityChangeByProductId(productId)).willReturn(5L);
		given(inventoryRepository.saveAndFlush(any(InventoryMovement.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		InventoryAdjustmentResponse result = inventoryService.adjust(
				productId,
				new InventoryAdjustmentRequest(
						InventoryAdjustmentRequest.Direction.REMOVE, 2, "Damaged stock"));

		assertEquals(-2, result.quantityChange());
		assertEquals(3L, result.quantityOnHand());
		assertEquals("Damaged stock", result.reason());
	}

	@Test
	void rejectsAnAdjustmentThatWouldMakeStockNegative() {
		UUID productId = UUID.randomUUID();
		Product product = mock(Product.class);
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.of(product));
		given(inventoryRepository.sumQuantityChangeByProductId(productId)).willReturn(1L);

		assertThrows(
				InsufficientStockException.class,
				() -> inventoryService.adjust(
						productId,
						new InventoryAdjustmentRequest(
								InventoryAdjustmentRequest.Direction.REMOVE, 2, "Damaged stock")));
	}

	@Test
	void rejectsAdjustmentsForUnknownProducts() {
		UUID productId = UUID.randomUUID();
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.empty());

		assertThrows(
				InventoryProductNotFoundException.class,
				() -> inventoryService.adjust(
						productId,
						new InventoryAdjustmentRequest(
								InventoryAdjustmentRequest.Direction.RECEIVE, 2, "Restock")));
	}
}
