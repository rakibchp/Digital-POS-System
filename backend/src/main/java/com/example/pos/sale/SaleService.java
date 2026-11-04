package com.example.pos.sale;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.pos.customer.Customer;
import com.example.pos.customer.CustomerRepository;
import com.example.pos.inventory.InventoryMovement;
import com.example.pos.inventory.InventoryRepository;
import com.example.pos.product.Product;
import com.example.pos.product.ProductRepository;

@Service
public class SaleService {

	private final SaleRepository saleRepository;
	private final CustomerRepository customerRepository;
	private final ProductRepository productRepository;
	private final InventoryRepository inventoryRepository;

	public SaleService(
			SaleRepository saleRepository,
			CustomerRepository customerRepository,
			ProductRepository productRepository,
			InventoryRepository inventoryRepository) {
		this.saleRepository = saleRepository;
		this.customerRepository = customerRepository;
		this.productRepository = productRepository;
		this.inventoryRepository = inventoryRepository;
	}

	@Transactional
	public SaleResponse create(CreateSaleRequest request) {
		Customer customer = request.customerId() == null
				? null
				: customerRepository.findById(request.customerId())
						.orElseThrow(() -> new SaleCustomerNotFoundException(request.customerId()));
		var requestedItems = request.items();
		var productIds = requestedItems.stream()
				.map(CreateSaleRequest.SaleLineRequest::productId)
				.toList();
		if (new HashSet<>(productIds).size() != productIds.size()) {
			throw new DuplicateSaleProductException(
					productIds.stream()
							.filter(id -> productIds.indexOf(id) != productIds.lastIndexOf(id))
							.findFirst()
							.orElseThrow());
		}

		Map<UUID, Product> lockedProducts = new LinkedHashMap<>();
		productIds.stream().sorted(Comparator.comparing(UUID::toString)).forEach(productId -> {
			Product product = productRepository.findByIdForUpdate(productId)
					.orElseThrow(() -> new SaleProductNotFoundException(productId));
			lockedProducts.put(productId, product);
		});

		List<Sale.SaleLineSnapshot> saleLines = new ArrayList<>();
		for (CreateSaleRequest.SaleLineRequest item : requestedItems) {
			Product product = lockedProducts.get(item.productId());
			long available = inventoryRepository.sumQuantityChangeByProductId(item.productId());
			if (available < item.quantity()) {
				throw new InsufficientSaleStockException(item.productId(), available, item.quantity());
			}
			var lineTotal = product.getPrice().multiply(java.math.BigDecimal.valueOf(item.quantity()));
			saleLines.add(new Sale.SaleLineSnapshot(
					product.getId(),
					product.getSku(),
					product.getName(),
					product.getPrice(),
					item.quantity(),
					lineTotal));
		}

		Sale sale = saleRepository.saveAndFlush(new Sale(saleLines, customer));
		inventoryRepository.saveAll(saleLines.stream()
				.map(line -> new InventoryMovement(
						line.productId(),
						-line.quantity(),
						"Sale " + sale.getId()))
				.toList());
		return toResponse(sale);
	}

	@Transactional(readOnly = true)
	public List<SaleResponse> findRecent() {
		return saleRepository.findTop50ByOrderByCreatedAtDesc().stream()
				.map(SaleService::toResponse)
				.toList();
	}

	private static SaleResponse toResponse(Sale sale) {
		return new SaleResponse(
				sale.getId(),
				sale.getTotalAmount(),
				sale.getCreatedAt(),
				sale.getCustomer() == null ? null : sale.getCustomer().getId(),
				sale.getCustomer() == null ? null : sale.getCustomer().getName(),
				sale.getItems().stream()
						.map(item -> new SaleItemResponse(
								item.getProductId(),
								item.getSku(),
								item.getProductName(),
								item.getUnitPrice(),
								item.getQuantity(),
								item.getLineTotal()))
						.toList());
	}
}
