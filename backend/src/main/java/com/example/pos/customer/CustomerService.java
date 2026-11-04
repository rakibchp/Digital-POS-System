package com.example.pos.customer;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

	private final CustomerRepository customerRepository;

	public CustomerService(CustomerRepository customerRepository) {
		this.customerRepository = customerRepository;
	}

	@Transactional(readOnly = true)
	public List<CustomerResponse> findAll() {
		return customerRepository.findAllByOrderByNameAsc().stream()
				.map(CustomerService::toResponse)
				.toList();
	}

	@Transactional
	public CustomerResponse create(CreateCustomerRequest request) {
		Customer customer = new Customer(
				request.name().trim(),
				normalizeOptional(request.email()),
				normalizeOptional(request.phone()));
		return toResponse(customerRepository.save(customer));
	}

	private static String normalizeOptional(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private static CustomerResponse toResponse(Customer customer) {
		return new CustomerResponse(
				customer.getId(),
				customer.getName(),
				customer.getEmail(),
				customer.getPhone(),
				customer.getCreatedAt());
	}
}
