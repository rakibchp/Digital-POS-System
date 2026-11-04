package com.example.pos.inventory;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {

	@Id
	private UUID id;

	@Column(nullable = false, updatable = false)
	private UUID productId;

	@Column(name = "purchase_receipt_id", updatable = false)
	private UUID purchaseReceiptId;

	@Column(nullable = false, updatable = false)
	private int quantityChange;

	@Column(nullable = false, length = 200, updatable = false)
	private String reason;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	protected InventoryMovement() {
	}

	public InventoryMovement(UUID productId, int quantityChange, String reason) {
		this(productId, quantityChange, reason, null);
	}

	public InventoryMovement(UUID productId, int quantityChange, String reason, UUID purchaseReceiptId) {
		this.id = UUID.randomUUID();
		this.productId = productId;
		this.purchaseReceiptId = purchaseReceiptId;
		this.quantityChange = quantityChange;
		this.reason = reason;
		this.createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public UUID getProductId() {
		return productId;
	}

	public UUID getPurchaseReceiptId() {
		return purchaseReceiptId;
	}

	public int getQuantityChange() {
		return quantityChange;
	}

	public String getReason() {
		return reason;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
