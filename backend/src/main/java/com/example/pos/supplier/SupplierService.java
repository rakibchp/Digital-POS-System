package com.example.pos.supplier;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupplierService {

	private final SupplierRepository supplierRepository;

	public SupplierService(SupplierRepository supplierRepository) {
		this.supplierRepository = supplierRepository;
	}

	@Transactional(readOnly = true)
	public List<SupplierResponse> findAll() {
		return supplierRepository.findAllByOrderByNameAsc().stream()
				.map(SupplierService::toResponse)
				.toList();
	}

	@Transactional
	public SupplierResponse create(CreateSupplierRequest request) {
		Supplier supplier = new Supplier(
				request.name().trim(),
				normalizeOptional(request.email()),
				normalizeOptional(request.phone()));
		return toResponse(supplierRepository.save(supplier));
	}

	private static String normalizeOptional(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private static SupplierResponse toResponse(Supplier supplier) {
		return new SupplierResponse(
				supplier.getId(),
				supplier.getName(),
				supplier.getEmail(),
				supplier.getPhone(),
				supplier.getCreatedAt());
	}
}
