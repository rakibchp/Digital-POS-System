package com.example.pos.sale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.pos.inventory.InventoryMovement;
import com.example.pos.inventory.InventoryRepository;
import com.example.pos.customer.Customer;
import com.example.pos.customer.CustomerRepository;
import com.example.pos.product.Product;
import com.example.pos.product.ProductRepository;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

	@Mock
	private SaleRepository saleRepository;

	@Mock
	private ProductRepository productRepository;

	@Mock
	private CustomerRepository customerRepository;

	@Mock
	private InventoryRepository inventoryRepository;

	@InjectMocks
	private SaleService saleService;

	@Test
	void createsSaleSnapshotsAndDeductsStock() {
		UUID productId = UUID.randomUUID();
		Product product = product(productId, "COFFEE-01", "Coffee", "3.50");
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.of(product));
		given(inventoryRepository.sumQuantityChangeByProductId(productId)).willReturn(5L);
		given(saleRepository.saveAndFlush(any(Sale.class)))
				.willAnswer(invocation -> invocation.getArgument(0));
		given(inventoryRepository.saveAll(any(Iterable.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SaleResponse result = saleService.create(
				new CreateSaleRequest(
						null, PaymentMethod.CASH, null,
						List.of(new CreateSaleRequest.SaleLineRequest(productId, 2))));

		assertEquals(new BigDecimal("7.00"), result.totalAmount());
		assertEquals("COFFEE-01", result.items().getFirst().sku());
		assertEquals(2, result.items().getFirst().quantity());
		verify(inventoryRepository).saveAll(any(Iterable.class));
	}

	@Test
	void associatesSelectedCustomerWithSale() {
		UUID customerId = UUID.randomUUID();
		UUID productId = UUID.randomUUID();
		Customer customer = new Customer("Sam Customer", null, null);
		Product product = product(productId, "COFFEE-01", "Coffee", "3.50");
		given(customerRepository.findById(customerId)).willReturn(Optional.of(customer));
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.of(product));
		given(inventoryRepository.sumQuantityChangeByProductId(productId)).willReturn(5L);
		given(saleRepository.saveAndFlush(any(Sale.class)))
				.willAnswer(invocation -> invocation.getArgument(0));
		given(inventoryRepository.saveAll(any(Iterable.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SaleResponse result = saleService.create(new CreateSaleRequest(
				customerId, PaymentMethod.CASH, null,
				List.of(new CreateSaleRequest.SaleLineRequest(productId, 1))));

		assertEquals(customer.getId(), result.customerId());
		assertEquals("Sam Customer", result.customerName());
	}

	@Test
	void rejectsSaleWhenStockIsInsufficient() {
		UUID productId = UUID.randomUUID();
		Product product = mock(Product.class);
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.of(product));
		given(inventoryRepository.sumQuantityChangeByProductId(productId)).willReturn(1L);

		assertThrows(
				InsufficientSaleStockException.class,
				() -> saleService.create(
						new CreateSaleRequest(
								null, PaymentMethod.CASH, null,
								List.of(new CreateSaleRequest.SaleLineRequest(productId, 2)))));
	}

	@Test
	void rejectsDuplicateProductLines() {
		UUID productId = UUID.randomUUID();
		var line = new CreateSaleRequest.SaleLineRequest(productId, 1);

		assertThrows(
				DuplicateSaleProductException.class,
				() -> saleService.create(new CreateSaleRequest(null, PaymentMethod.CASH, null, List.of(line, line))));
	}

	@Test
	void rejectsUnknownProducts() {
		UUID productId = UUID.randomUUID();
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.empty());

		assertThrows(
				SaleProductNotFoundException.class,
				() -> saleService.create(
						new CreateSaleRequest(
								null, PaymentMethod.CASH, null,
								List.of(new CreateSaleRequest.SaleLineRequest(productId, 1)))));
	}

	@Test
	void rejectsUnknownCustomer() {
		UUID customerId = UUID.randomUUID();
		given(customerRepository.findById(customerId)).willReturn(Optional.empty());

		assertThrows(
				SaleCustomerNotFoundException.class,
				() -> saleService.create(new CreateSaleRequest(
						customerId,
						PaymentMethod.CASH,
						null,
						List.of(new CreateSaleRequest.SaleLineRequest(UUID.randomUUID(), 1)))));
	}

	@Test
	void calculatesCashChangeAndPersistsTender() {
		UUID productId = UUID.randomUUID();
		Product product = product(productId, "COFFEE-01", "Coffee", "3.50");
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.of(product));
		given(inventoryRepository.sumQuantityChangeByProductId(productId)).willReturn(5L);
		given(saleRepository.saveAndFlush(any(Sale.class)))
				.willAnswer(invocation -> invocation.getArgument(0));
		given(inventoryRepository.saveAll(any(Iterable.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SaleResponse result = saleService.create(new CreateSaleRequest(
				null,
				PaymentMethod.CASH,
				new BigDecimal("5.00"),
				List.of(new CreateSaleRequest.SaleLineRequest(productId, 1))));

		assertEquals(PaymentMethod.CASH, result.paymentMethod());
		assertEquals(new BigDecimal("5.00"), result.amountTendered());
		assertEquals(new BigDecimal("1.50"), result.changeDue());
	}

	@Test
	void rejectsCashTenderBelowTotal() {
		UUID productId = UUID.randomUUID();
		Product product = product(productId, "COFFEE-01", "Coffee", "3.50");
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.of(product));
		given(inventoryRepository.sumQuantityChangeByProductId(productId)).willReturn(5L);

		assertThrows(
				InsufficientPaymentException.class,
				() -> saleService.create(new CreateSaleRequest(
						null,
						PaymentMethod.CASH,
						new BigDecimal("3.00"),
						List.of(new CreateSaleRequest.SaleLineRequest(productId, 1)))));
	}

	@Test
	void recordsCardPaymentForExactSaleAmount() {
		UUID productId = UUID.randomUUID();
		Product product = product(productId, "COFFEE-01", "Coffee", "3.50");
		given(productRepository.findByIdForUpdate(productId)).willReturn(Optional.of(product));
		given(inventoryRepository.sumQuantityChangeByProductId(productId)).willReturn(5L);
		given(saleRepository.saveAndFlush(any(Sale.class)))
				.willAnswer(invocation -> invocation.getArgument(0));
		given(inventoryRepository.saveAll(any(Iterable.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		SaleResponse result = saleService.create(new CreateSaleRequest(
				null,
				PaymentMethod.CARD,
				null,
				List.of(new CreateSaleRequest.SaleLineRequest(productId, 1))));

		assertEquals(PaymentMethod.CARD, result.paymentMethod());
		assertEquals(new BigDecimal("3.50"), result.amountTendered());
		assertEquals(BigDecimal.ZERO, result.changeDue());
	}

	private static Product product(UUID id, String sku, String name, String price) {
		Product product = mock(Product.class);
		when(product.getId()).thenReturn(id);
		when(product.getSku()).thenReturn(sku);
		when(product.getName()).thenReturn(name);
		when(product.getPrice()).thenReturn(new BigDecimal(price));
		return product;
	}
}
