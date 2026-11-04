package com.example.pos.sale;

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
@Table(name = "sale_items")
public class SaleItem {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "sale_id", nullable = false, updatable = false)
	private Sale sale;

	@Column(name = "product_id", nullable = false, updatable = false)
	private UUID productId;

	@Column(nullable = false, length = 64, updatable = false)
	private String sku;

	@Column(name = "product_name", nullable = false, length = 200, updatable = false)
	private String productName;

	@Column(name = "unit_price", nullable = false, precision = 12, scale = 2, updatable = false)
	private BigDecimal unitPrice;

	@Column(nullable = false, updatable = false)
	private int quantity;

	@Column(name = "line_total", nullable = false, precision = 20, scale = 2, updatable = false)
	private BigDecimal lineTotal;

	protected SaleItem() {
	}

	SaleItem(Sale sale, Sale.SaleLineSnapshot line) {
		this.id = UUID.randomUUID();
		this.sale = sale;
		this.productId = line.productId();
		this.sku = line.sku();
		this.productName = line.productName();
		this.unitPrice = line.unitPrice();
		this.quantity = line.quantity();
		this.lineTotal = line.lineTotal();
	}

	public UUID getId() {
		return id;
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

	public BigDecimal getUnitPrice() {
		return unitPrice;
	}

	public int getQuantity() {
		return quantity;
	}

	public BigDecimal getLineTotal() {
		return lineTotal;
	}
}
