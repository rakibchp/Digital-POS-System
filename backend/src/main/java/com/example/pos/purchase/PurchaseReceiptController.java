package com.example.pos.purchase;

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
@RequestMapping("/api/v1/purchases/receipts")
public class PurchaseReceiptController {

	private final PurchaseReceiptService receiptService;

	public PurchaseReceiptController(PurchaseReceiptService receiptService) {
		this.receiptService = receiptService;
	}

	@GetMapping
	public List<PurchaseReceiptResponse> findRecent() {
		return receiptService.findRecent();
	}

	@PostMapping
	public ResponseEntity<PurchaseReceiptResponse> receive(
			@Valid @RequestBody CreatePurchaseReceiptRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(receiptService.receive(request));
	}

	@ExceptionHandler(SupplierNotFoundException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public PurchaseError supplierNotFound(SupplierNotFoundException exception) {
		return new PurchaseError(exception.getMessage());
	}

	@ExceptionHandler(PurchaseProductNotFoundException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public PurchaseError productNotFound(PurchaseProductNotFoundException exception) {
		return new PurchaseError(exception.getMessage());
	}

	@ExceptionHandler(DuplicatePurchaseProductException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public PurchaseError duplicateProduct(DuplicatePurchaseProductException exception) {
		return new PurchaseError(exception.getMessage());
	}

	public record PurchaseError(String message) {
	}
}
