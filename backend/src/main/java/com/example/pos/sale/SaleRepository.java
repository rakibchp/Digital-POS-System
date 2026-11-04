package com.example.pos.sale;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleRepository extends JpaRepository<Sale, UUID> {

	List<Sale> findTop50ByOrderByCreatedAtDesc();
}
