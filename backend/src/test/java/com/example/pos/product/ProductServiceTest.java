package com.example.pos.product;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

	@Mock
	private ProductRepository productRepository;

	@InjectMocks
	private ProductService productService;

	@Test
	void trimsProductFieldsAndNormalizesSku() {
		given(productRepository.existsBySkuIgnoreCase("TEA-01")).willReturn(false);
		given(productRepository.saveAndFlush(any(Product.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

		ProductResponse product = productService.create(
				new CreateProductRequest(" tea-01 ", " Green tea ", new BigDecimal("2.50")));

		assertEquals("TEA-01", product.sku());
		assertEquals("Green tea", product.name());
		assertEquals(new BigDecimal("2.50"), product.price());
		verify(productRepository).existsBySkuIgnoreCase("TEA-01");
	}

	@Test
	void rejectsDuplicateSkuWithoutSaving() {
		given(productRepository.existsBySkuIgnoreCase("TEA-01")).willReturn(true);

		assertThrows(
				DuplicateProductSkuException.class,
				() -> productService.create(
						new CreateProductRequest("tea-01", "Green tea", new BigDecimal("2.50"))));
	}
}
