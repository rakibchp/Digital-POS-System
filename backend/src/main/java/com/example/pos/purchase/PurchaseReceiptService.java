package com.example.pos.purchase;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pos.inventory.InventoryMovement;
import com.example.pos.inventory.InventoryRepository;
import com.example.pos.product.Product;
import com.example.pos.product.ProductRepository;
import com.example.pos.supplier.Supplier;
import com.example.pos.supplier.SupplierRepository;

@Service
public class PurchaseReceiptService {

	private final PurchaseReceiptRepository receiptRepository;
	private final SupplierRepository supplierRepository;
	private final ProductRepository productRepository;
	private final InventoryRepository inventoryRepository;

	public PurchaseReceiptService(
			PurchaseReceiptRepository receiptRepository,
			SupplierRepository supplierRepository,
			ProductRepository productRepository,
			InventoryRepository inventoryRepository) {
		this.receiptRepository = receiptRepository;
		this.supplierRepository = supplierRepository;
		this.productRepository = productRepository;
		this.inventoryRepository = inventoryRepository;
	}

	@Transactional(readOnly = true)
	public List<PurchaseReceiptResponse> findRecent() {
		return receiptRepository.findTop50ByOrderByCreatedAtDesc().stream()
				.map(PurchaseReceiptService::toResponse)
				.toList();
	}

	@Transactional
	public PurchaseReceiptResponse receive(CreatePurchaseReceiptRequest request) {
		var requestedItems = request.items();
		var productIds = requestedItems.stream()
				.map(CreatePurchaseReceiptRequest.PurchaseLineRequest::productId)
				.toList();
		if (new HashSet<>(productIds).size() != productIds.size()) {
			throw new DuplicatePurchaseProductException(
					productIds.stream()
							.filter(id -> productIds.indexOf(id) != productIds.lastIndexOf(id))
							.findFirst()
							.orElseThrow());
		}

		Supplier supplier = supplierRepository.findById(request.supplierId())
				.orElseThrow(() -> new SupplierNotFoundException(request.supplierId()));

		Map<UUID, Product> lockedProducts = new LinkedHashMap<>();
		productIds.stream().sorted(Comparator.comparing(UUID::toString)).forEach(productId -> {
			Product product = productRepository.findByIdForUpdate(productId)
					.orElseThrow(() -> new PurchaseProductNotFoundException(productId));
			lockedProducts.put(productId, product);
		});

		List<PurchaseReceipt.PurchaseReceiptLine> lines = new ArrayList<>();
		for (CreatePurchaseReceiptRequest.PurchaseLineRequest item : requestedItems) {
			Product product = lockedProducts.get(item.productId());
			BigDecimal lineCost = item.unitCost().multiply(BigDecimal.valueOf(item.quantity()));
			lines.add(new PurchaseReceipt.PurchaseReceiptLine(
					product.getId(),
					product.getSku(),
					product.getName(),
					item.quantity(),
					item.unitCost(),
					lineCost));
		}

		String supplierReference = normalizeReference(request.supplierReference());
		PurchaseReceipt receipt = receiptRepository.saveAndFlush(
				new PurchaseReceipt(supplier, supplierReference, lines));
		inventoryRepository.saveAll(lines.stream()
				.map(line -> new InventoryMovement(
						line.productId(),
						line.quantity(),
						"Supplier receipt " + receipt.getId(),
						receipt.getId()))
				.toList());
		return toResponse(receipt);
	}

	private static String normalizeReference(String reference) {
		return reference == null || reference.isBlank() ? null : reference.trim();
	}

	private static PurchaseReceiptResponse toResponse(PurchaseReceipt receipt) {
		return new PurchaseReceiptResponse(
				receipt.getId(),
				receipt.getSupplier().getId(),
				receipt.getSupplier().getName(),
				receipt.getSupplierReference(),
				receipt.getTotalCost(),
				receipt.getCreatedAt(),
				receipt.getItems().stream()
						.map(item -> new PurchaseReceiptItemResponse(
								item.getProductId(),
								item.getSku(),
								item.getProductName(),
								item.getQuantity(),
								item.getUnitCost(),
								item.getLineCost()))
						.toList());
	}
}
