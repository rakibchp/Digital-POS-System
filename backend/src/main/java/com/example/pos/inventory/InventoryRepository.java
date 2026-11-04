package com.example.pos.inventory;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InventoryRepository extends JpaRepository<InventoryMovement, UUID> {

	@Query("""
			select new com.example.pos.inventory.InventoryItemResponse(
				p.id, p.sku, p.name, coalesce(sum(m.quantityChange), 0), p.reorderPoint)
			from Product p
			left join InventoryMovement m on m.productId = p.id
			group by p.id, p.sku, p.name, p.reorderPoint
			order by p.name asc, p.sku asc
			""")
	List<InventoryItemResponse> findInventoryItems();

	@Query("select coalesce(sum(m.quantityChange), 0) from InventoryMovement m where m.productId = :productId")
	long sumQuantityChangeByProductId(UUID productId);

	List<InventoryMovement> findTop20ByProductIdOrderByCreatedAtDesc(UUID productId);
}
