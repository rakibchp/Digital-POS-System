package com.example.pos.sale;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;

import com.example.pos.customer.Customer;

@Entity
@Table(name = "sales")
public class Sale {

	@Id
	private UUID id;

	@Column(name = "total_amount", nullable = false, precision = 20, scale = 2)
	private BigDecimal totalAmount;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "customer_id")
	private Customer customer;

	@Enumerated(EnumType.STRING)
	@Column(name = "payment_method", length = 16)
	private PaymentMethod paymentMethod;

	@Column(name = "amount_tendered", precision = 20, scale = 2)
	private BigDecimal amountTendered;

	@Column(name = "change_due", precision = 20, scale = 2)
	private BigDecimal changeDue;

	@Column(name = "returned_at")
	private Instant returnedAt;

	@Column(name = "return_reason", length = 150)
	private String returnReason;

	@Column(name = "refund_amount", precision = 20, scale = 2)
	private BigDecimal refundAmount;

	@OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<SaleItem> items = new ArrayList<>();

	protected Sale() {
	}

	Sale(
			List<SaleLineSnapshot> lines,
			Customer customer,
			PaymentMethod paymentMethod,
			BigDecimal amountTendered,
			BigDecimal changeDue) {
		this.id = UUID.randomUUID();
		this.createdAt = Instant.now();
		this.customer = customer;
		this.paymentMethod = paymentMethod;
		this.amountTendered = amountTendered;
		this.changeDue = changeDue;
		this.totalAmount = lines.stream()
				.map(SaleLineSnapshot::lineTotal)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		this.items = new ArrayList<>(lines.stream().map(line -> new SaleItem(this, line)).toList());
	}

	public UUID getId() {
		return id;
	}

	public BigDecimal getTotalAmount() {
		return totalAmount;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public List<SaleItem> getItems() {
		return items;
	}

	public Customer getCustomer() {
		return customer;
	}

	public PaymentMethod getPaymentMethod() {
		return paymentMethod;
	}

	public BigDecimal getAmountTendered() {
		return amountTendered;
	}

	public BigDecimal getChangeDue() {
		return changeDue;
	}

	public Instant getReturnedAt() {
		return returnedAt;
	}

	public String getReturnReason() {
		return returnReason;
	}

	public BigDecimal getRefundAmount() {
		return refundAmount;
	}

	public void markReturned(String reason) {
		this.returnedAt = Instant.now();
		this.returnReason = reason;
		this.refundAmount = this.totalAmount;
	}

	record SaleLineSnapshot(
			UUID productId,
			String sku,
			String productName,
			BigDecimal unitPrice,
			int quantity,
			BigDecimal lineTotal) {
	}
}
