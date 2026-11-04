package com.example.pos.purchase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.pos.inventory.InventoryMovement;
import com.example.pos.inventory.InventoryRepository;
import com.example.pos.product.Product;
import com.example.pos.product.ProductRepository;
import com.example.pos.supplier.Supplier;
import com.example.pos.supplier.SupplierRepository;

@ExtendWith(MockitoExtension.class)
class PurchaseReceiptServiceTest {

	@Mock
	private PurchaseReceiptRepository receiptRepository;

	@Mock
	private SupplierRepository supplierRepository;

	@Mock
	private ProductRepository productRepository;

	@Mock
	private InventoryRepository inventoryRepository;

	@InjectMocks
	private PurchaseReceiptService receiptService;

	@Test
	void recordsReceiptAndStockMovementAtomically() {
		UUID supplierId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();
		Supplier supplier = new Supplier("Coffee Co", null, null);
		Product product = org.mockito.Mockito.mock(Product.class);
		org.mockito.Mockito.when(product.getId()).thenReturn(productId);
		org.mockito.Mockito.when(product.getSku()).thenReturn("COFFEE-01");
		org.mockito.Mockito.when(product.getName()).thenReturn("Coffee");
		given(supplierRepository.findById(supplierId)).willReturn(Optional.of(supplier));
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.of(product));
		given(receiptRepository.saveAndFlush(any(PurchaseReceipt.class)))
				.willAnswer(invocation -> invocation.getArgument(0));
		given(inventoryRepository.saveAll(any())).willAnswer(invocation -> invocation.getArgument(0));

		PurchaseReceiptResponse response = receiptService.receive(new CreatePurchaseReceiptRequest(
				supplierId,
				" INV-204 ",
				List.of(new CreatePurchaseReceiptRequest.PurchaseLineRequest(
						productId, 4, new BigDecimal("2.50")))));

		assertEquals("Coffee Co", response.supplierName());
		assertEquals("INV-204", response.supplierReference());
		assertEquals(new BigDecimal("10.00"), response.totalCost());
		assertEquals(4, response.items().getFirst().quantity());
		assertEquals(new BigDecimal("2.50"), response.items().getFirst().unitCost());

		ArgumentCaptor<Iterable<InventoryMovement>> movements = ArgumentCaptor.forClass(Iterable.class);
		verify(inventoryRepository).saveAll(movements.capture());
		InventoryMovement movement = movements.getValue().iterator().next();
		assertEquals(productId, movement.getProductId());
		assertEquals(4, movement.getQuantityChange());
		assertEquals(response.id(), movement.getPurchaseReceiptId());
	}

	@Test
	void rejectsDuplicateProductsBeforeWritingAnything() {
		UUID supplierId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();
		CreatePurchaseReceiptRequest request = new CreatePurchaseReceiptRequest(
				supplierId,
				null,
				List.of(
						new CreatePurchaseReceiptRequest.PurchaseLineRequest(productId, 1, BigDecimal.ONE),
						new CreatePurchaseReceiptRequest.PurchaseLineRequest(productId, 2, BigDecimal.ONE)));

		assertThrows(DuplicatePurchaseProductException.class, () -> receiptService.receive(request));
		org.mockito.Mockito.verifyNoInteractions(receiptRepository, inventoryRepository);
	}
}
