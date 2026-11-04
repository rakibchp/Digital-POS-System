package com.example.pos.sale;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sales")
public class SaleController {

	private final SaleService saleService;

	public SaleController(SaleService saleService) {
		this.saleService = saleService;
	}

	@GetMapping
	public List<SaleResponse> findRecent() {
		return saleService.findRecent();
	}

	@PostMapping
	public ResponseEntity<SaleResponse> create(@Valid @RequestBody CreateSaleRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(saleService.create(request));
	}

	@ExceptionHandler(InsufficientSaleStockException.class)
	@ResponseStatus(HttpStatus.CONFLICT)
	public SaleError insufficientStock(InsufficientSaleStockException exception) {
		return new SaleError(exception.getMessage());
	}

	@ExceptionHandler(SaleProductNotFoundException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public SaleError productNotFound(SaleProductNotFoundException exception) {
		return new SaleError(exception.getMessage());
	}

	@ExceptionHandler(DuplicateSaleProductException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public SaleError duplicateItem(DuplicateSaleProductException exception) {
		return new SaleError(exception.getMessage());
	}

	@ExceptionHandler(SaleCustomerNotFoundException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public SaleError customerNotFound(SaleCustomerNotFoundException exception) {
		return new SaleError(exception.getMessage());
	}

	@ExceptionHandler(InsufficientPaymentException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public SaleError insufficientPayment(InsufficientPaymentException exception) {
		return new SaleError(exception.getMessage());
	}

	public record SaleError(String message) {
	}
}
