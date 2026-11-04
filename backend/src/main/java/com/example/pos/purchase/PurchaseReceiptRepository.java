package com.example.pos.purchase;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseReceiptRepository extends JpaRepository<PurchaseReceipt, UUID> {

	List<PurchaseReceipt> findTop50ByOrderByCreatedAtDesc();
}
