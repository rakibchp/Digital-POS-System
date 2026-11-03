package com.example.pos.product;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

	private final ProductService productService;

	public ProductController(ProductService productService) {
		this.productService = productService;
	}

	@GetMapping
	public List<ProductResponse> findAll() {
		return productService.findAll();
	}

	@PostMapping
	public ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest request) {
		ProductResponse product = productService.create(request);
		return ResponseEntity.created(URI.create("/api/v1/products/" + product.id())).body(product);
	}

	@ExceptionHandler(DuplicateProductSkuException.class)
	@ResponseStatus(HttpStatus.CONFLICT)
	public ProductError duplicateSku(DuplicateProductSkuException exception) {
		return new ProductError(exception.getMessage());
	}

	public record ProductError(String message) {
	}
}
