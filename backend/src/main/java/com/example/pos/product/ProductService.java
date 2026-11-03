package com.example.pos.product;

import java.util.List;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

	private final ProductRepository productRepository;

	public ProductService(ProductRepository productRepository) {
		this.productRepository = productRepository;
	}

	@Transactional(readOnly = true)
	public List<ProductResponse> findAll() {
		return productRepository.findAllByOrderByNameAscSkuAsc().stream()
				.map(ProductService::toResponse)
				.toList();
	}

	@Transactional
	public ProductResponse create(CreateProductRequest request) {
		String sku = request.sku().trim().toUpperCase(Locale.ROOT);
		String name = request.name().trim();

		if (productRepository.existsBySkuIgnoreCase(sku)) {
			throw new DuplicateProductSkuException(sku);
		}

		try {
			return toResponse(productRepository.saveAndFlush(
					new Product(sku, name, request.price())));
		} catch (DataIntegrityViolationException exception) {
			throw new DuplicateProductSkuException(sku, exception);
		}
	}

	private static ProductResponse toResponse(Product product) {
		return new ProductResponse(
				product.getId(),
				product.getSku(),
				product.getName(),
				product.getPrice(),
				product.getCreatedAt());
	}
}
