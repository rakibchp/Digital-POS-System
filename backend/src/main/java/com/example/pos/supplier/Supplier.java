package com.example.pos.supplier;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "suppliers")
public class Supplier {

	@Id
	private UUID id;

	@Column(nullable = false, length = 200)
	private String name;

	@Column(length = 254)
	private String email;

	@Column(length = 32)
	private String phone;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected Supplier() {
	}

	public Supplier(String name, String email, String phone) {
		this.id = UUID.randomUUID();
		this.name = name;
		this.email = email;
		this.phone = phone;
		this.createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getEmail() {
		return email;
	}

	public String getPhone() {
		return phone;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
