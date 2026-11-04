package com.example.pos.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class Product {

	@Id
	private UUID id;

	@Column(nullable = false, length = 64)
	private String sku;

	@Column(nullable = false, length = 200)
	private String name;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal price;

	@Column(name = "reorder_point", nullable = false)
	private int reorderPoint;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected Product() {
	}

	Product(String sku, String name, BigDecimal price) {
		this.id = UUID.randomUUID();
		this.sku = sku;
		this.name = name;
		this.price = price;
		this.createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public String getSku() {
		return sku;
	}

	public String getName() {
		return name;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public int getReorderPoint() {
		return reorderPoint;
	}

	public void setReorderPoint(int reorderPoint) {
		this.reorderPoint = reorderPoint;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
