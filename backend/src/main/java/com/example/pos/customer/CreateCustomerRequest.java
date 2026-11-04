package com.example.pos.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCustomerRequest(
		@NotBlank @Size(max = 200) String name,
		@Email @Size(max = 254) String email,
		@Size(max = 32) String phone) {
}
