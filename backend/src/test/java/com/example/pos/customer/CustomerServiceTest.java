package com.example.pos.customer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

	@Mock
	private CustomerRepository customerRepository;

	@InjectMocks
	private CustomerService customerService;

	@Test
	void trimsCustomerDetailsAndNormalizesBlankContactValues() {
		given(customerRepository.save(org.mockito.ArgumentMatchers.any(Customer.class)))
				.willAnswer(invocation -> {
					Customer customer = invocation.getArgument(0);
					return customer;
				});

		CustomerResponse response = customerService.create(
				new CreateCustomerRequest("  Sam Customer  ", " sam@example.com ", "   "));

		assertEquals("Sam Customer", response.name());
		assertEquals("sam@example.com", response.email());
		assertEquals(null, response.phone());
		verify(customerRepository).save(org.mockito.ArgumentMatchers.any(Customer.class));
	}
}
