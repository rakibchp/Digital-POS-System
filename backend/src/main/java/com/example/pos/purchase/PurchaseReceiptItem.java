package com.example.pos.purchase;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "purchase_receipt_items")
public class PurchaseReceiptItem {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "receipt_id", nullable = false, updatable = false)
	private PurchaseReceipt receipt;

	@Column(name = "product_id", nullable = false, updatable = false)
	private UUID productId;

	@Column(nullable = false, length = 64, updatable = false)
	private String sku;

	@Column(name = "product_name", nullable = false, length = 200, updatable = false)
	private String productName;

	@Column(nullable = false, updatable = false)
	private int quantity;

	@Column(name = "unit_cost", nullable = false, precision = 12, scale = 2, updatable = false)
	private BigDecimal unitCost;

	@Column(name = "line_cost", nullable = false, precision = 20, scale = 2, updatable = false)
	private BigDecimal lineCost;

	protected PurchaseReceiptItem() {
	}

	PurchaseReceiptItem(PurchaseReceipt receipt, PurchaseReceipt.PurchaseReceiptLine line) {
		this.id = UUID.randomUUID();
		this.receipt = receipt;
		this.productId = line.productId();
		this.sku = line.sku();
		this.productName = line.productName();
		this.quantity = line.quantity();
		this.unitCost = line.unitCost();
		this.lineCost = line.lineCost();
	}

	public UUID getProductId() {
		return productId;
	}

	public String getSku() {
		return sku;
	}

	public String getProductName() {
		return productName;
	}

	public int getQuantity() {
		return quantity;
	}

	public BigDecimal getUnitCost() {
		return unitCost;
	}

	public BigDecimal getLineCost() {
		return lineCost;
	}
}
