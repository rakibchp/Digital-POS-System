package com.example.pos.inventory;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

	private final InventoryService inventoryService;

	public InventoryController(InventoryService inventoryService) {
		this.inventoryService = inventoryService;
	}

	@GetMapping
	public List<InventoryItemResponse> findInventory() {
		return inventoryService.findInventory();
	}

	@PostMapping("/{productId}/adjustments")
	public ResponseEntity<InventoryAdjustmentResponse> adjust(
			@PathVariable UUID productId,
			@Valid @RequestBody InventoryAdjustmentRequest request) {
		InventoryAdjustmentResponse adjustment = inventoryService.adjust(productId, request);
		return ResponseEntity.ok(adjustment);
	}

	@PutMapping("/{productId}/reorder-point")
	public InventoryItemResponse updateReorderPoint(
			@PathVariable UUID productId,
			@Valid @RequestBody ReorderPointRequest request) {
		return inventoryService.updateReorderPoint(productId, request);
	}

	@ExceptionHandler(InsufficientStockException.class)
	public ResponseEntity<InventoryError> insufficientStock(InsufficientStockException exception) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(new InventoryError(exception.getMessage()));
	}

	@ExceptionHandler(InventoryProductNotFoundException.class)
	public ResponseEntity<InventoryError> productNotFound(InventoryProductNotFoundException exception) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new InventoryError(exception.getMessage()));
	}

	public record InventoryError(String message) {
	}
}
