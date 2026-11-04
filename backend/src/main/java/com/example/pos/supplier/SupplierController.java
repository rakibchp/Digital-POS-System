package com.example.pos.supplier;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/suppliers")
public class SupplierController {

	private final SupplierService supplierService;

	public SupplierController(SupplierService supplierService) {
		this.supplierService = supplierService;
	}

	@GetMapping
	public List<SupplierResponse> findAll() {
		return supplierService.findAll();
	}

	@PostMapping
	public ResponseEntity<SupplierResponse> create(@Valid @RequestBody CreateSupplierRequest request) {
		SupplierResponse supplier = supplierService.create(request);
		return ResponseEntity.created(URI.create("/api/v1/suppliers/" + supplier.id())).body(supplier);
	}
}
