package com.example.pos.inventory;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pos.product.Product;
import com.example.pos.product.ProductRepository;

@Service
public class InventoryService {

	private final InventoryRepository inventoryRepository;
	private final ProductRepository productRepository;

	public InventoryService(InventoryRepository inventoryRepository, ProductRepository productRepository) {
		this.inventoryRepository = inventoryRepository;
		this.productRepository = productRepository;
	}

	@Transactional(readOnly = true)
	public List<InventoryItemResponse> findInventory() {
		return inventoryRepository.findInventoryItems();
	}

	@Transactional
	public InventoryAdjustmentResponse adjust(UUID productId, InventoryAdjustmentRequest request) {
		Product product = productRepository.findByIdForUpdate(productId)
				.orElseThrow(() -> new InventoryProductNotFoundException(productId));
		long currentQuantity = inventoryRepository.sumQuantityChangeByProductId(productId);
		int quantityChange = request.direction() == InventoryAdjustmentRequest.Direction.RECEIVE
				? request.quantity()
				: -request.quantity();

		if (currentQuantity + quantityChange < 0) {
			throw new InsufficientStockException(
					"Cannot remove %d units; only %d are currently in stock"
							.formatted(request.quantity(), currentQuantity));
		}

		InventoryMovement movement = inventoryRepository.saveAndFlush(
				new InventoryMovement(productId, quantityChange, request.reason().trim()));
		return new InventoryAdjustmentResponse(
				movement.getId(),
				product.getId(),
				movement.getQuantityChange(),
				currentQuantity + quantityChange,
				movement.getReason(),
				movement.getCreatedAt());
	}

	@Transactional
	public InventoryItemResponse updateReorderPoint(UUID productId, ReorderPointRequest request) {
		Product product = productRepository.findByIdForUpdate(productId)
				.orElseThrow(() -> new InventoryProductNotFoundException(productId));
		product.setReorderPoint(request.reorderPoint());
		Product updatedProduct = productRepository.saveAndFlush(product);
		long quantityOnHand = inventoryRepository.sumQuantityChangeByProductId(productId);
		return new InventoryItemResponse(
				updatedProduct.getId(),
				updatedProduct.getSku(),
				updatedProduct.getName(),
				quantityOnHand,
				request.reorderPoint());
	}
}
