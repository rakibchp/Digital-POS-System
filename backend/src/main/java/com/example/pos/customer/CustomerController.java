package com.example.pos.customer;

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
@RequestMapping("/api/v1/customers")
public class CustomerController {

	private final CustomerService customerService;

	public CustomerController(CustomerService customerService) {
		this.customerService = customerService;
	}

	@GetMapping
	public List<CustomerResponse> findAll() {
		return customerService.findAll();
	}

	@PostMapping
	public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CreateCustomerRequest request) {
		CustomerResponse customer = customerService.create(request);
		return ResponseEntity.created(URI.create("/api/v1/customers/" + customer.id())).body(customer);
	}
}
