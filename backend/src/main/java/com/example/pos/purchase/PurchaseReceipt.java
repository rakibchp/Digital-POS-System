package com.example.pos.purchase;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.example.pos.supplier.Supplier;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "purchase_receipts")
public class PurchaseReceipt {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "supplier_id", nullable = false, updatable = false)
	private Supplier supplier;

	@Column(name = "supplier_reference", length = 64, updatable = false)
	private String supplierReference;

	@Column(nullable = false, precision = 20, scale = 2, updatable = false)
	private BigDecimal totalCost;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<PurchaseReceiptItem> items = new ArrayList<>();

	protected PurchaseReceipt() {
	}

	public PurchaseReceipt(
			Supplier supplier,
			String supplierReference,
			List<PurchaseReceiptLine> lines) {
		this.id = UUID.randomUUID();
		this.supplier = supplier;
		this.supplierReference = supplierReference;
		this.totalCost = lines.stream()
				.map(PurchaseReceiptLine::lineCost)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		this.createdAt = Instant.now();
		this.items = new ArrayList<>(lines.stream()
				.map(line -> new PurchaseReceiptItem(this, line))
				.toList());
	}

	public UUID getId() {
		return id;
	}

	public Supplier getSupplier() {
		return supplier;
	}

	public String getSupplierReference() {
		return supplierReference;
	}

	public BigDecimal getTotalCost() {
		return totalCost;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public List<PurchaseReceiptItem> getItems() {
		return items;
	}

	public record PurchaseReceiptLine(
			UUID productId,
			String sku,
			String productName,
			int quantity,
			BigDecimal unitCost,
			BigDecimal lineCost) {
	}
}
