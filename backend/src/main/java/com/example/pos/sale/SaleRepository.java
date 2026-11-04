package com.example.pos.sale;

import java.util.List;
import java.util.UUID;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleRepository extends JpaRepository<Sale, UUID> {

	List<Sale> findTop50ByOrderByCreatedAtDesc();

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select sale from Sale sale where sale.id = :id")
	java.util.Optional<Sale> findByIdForUpdate(@Param("id") UUID id);
}
