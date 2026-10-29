-- =====================================================================
--  Diagnóstico (SOLO LECTURA) de la migración
--  2026_10_19_000001_normalizar_catalogo_inventario.sql
--
--  Pégalo en phpMyAdmin > SQL con la base de GeekPoint seleccionada.
--  No modifica nada: solo dice qué pasos de la migración quedaron hechos.
-- =====================================================================
SELECT paso, revision, resultado FROM (
  SELECT 1 AS orden, '0-1' AS paso, 'products_legacy existe' AS revision,
         (SELECT COUNT(*) FROM information_schema.TABLES
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products_legacy') AS resultado
  UNION ALL SELECT 2, '1', 'products nuevo (sin branch_id)',
         (SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'branch_id')
  UNION ALL SELECT 3, '1', 'filas en products', (SELECT COUNT(*) FROM products)
  UNION ALL SELECT 4, '1', 'SKUs distintos en products_legacy', (SELECT COUNT(DISTINCT sku) FROM products_legacy)
  UNION ALL SELECT 5, '2', 'filas en inventory', (SELECT COUNT(*) FROM inventory)
  UNION ALL SELECT 6, '2', 'filas en products_legacy', (SELECT COUNT(*) FROM products_legacy)
  UNION ALL SELECT 7, '3', 'filas en product_images', (SELECT COUNT(*) FROM product_images)
  UNION ALL SELECT 8, '4', 'filas en tags', (SELECT COUNT(*) FROM tags)
  UNION ALL SELECT 9, '4', 'filas en product_tags', (SELECT COUNT(*) FROM product_tags)

  -- Paso 5: a qué tabla apuntan las FK de ventas / movimientos
  UNION ALL SELECT 10, '5', 'FK sale_items -> (tabla)',
         COALESCE((SELECT REFERENCED_TABLE_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS
                    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_sale_items_product'), 'SIN FK')
  UNION ALL SELECT 11, '5', 'FK stock_movements -> (tabla)',
         COALESCE((SELECT REFERENCED_TABLE_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS
                    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_mov_product'), 'SIN FK')
  UNION ALL SELECT 12, '5', 'sale_items: product_id que NO existe en products',
         (SELECT COUNT(*) FROM sale_items si LEFT JOIN products p ON p.id = si.product_id
           WHERE si.product_id IS NOT NULL AND p.id IS NULL)
  UNION ALL SELECT 13, '5', 'sale_items: product_id que SÍ es id de inventory',
         (SELECT COUNT(*) FROM sale_items si JOIN inventory i ON i.id = si.product_id)
  UNION ALL SELECT 14, '5', 'sale_items: product_id cuyo SKU no coincide con products',
         (SELECT COUNT(*) FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sku <> p.sku)
  UNION ALL SELECT 15, '5', 'stock_movements: product_id que NO existe en products',
         (SELECT COUNT(*) FROM stock_movements m LEFT JOIN products p ON p.id = m.product_id
           WHERE m.product_id IS NOT NULL AND p.id IS NULL)
  UNION ALL SELECT 16, '5', 'stock_movements: índice ix_mov_type',
         (SELECT COUNT(*) FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stock_movements' AND INDEX_NAME = 'ix_mov_type')

  -- Paso 6
  UNION ALL SELECT 17, '6', 'reservation_items.product_id existe',
         (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservation_items' AND COLUMN_NAME = 'product_id')

  -- Paso 7
  UNION ALL SELECT 18, '7', 'FK stock_alerts -> products(sku)',
         (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_alert_product_sku')

  -- Paso 8
  UNION ALL SELECT 19, '8', 'sales: índice ix_sales_date',
         (SELECT COUNT(*) FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales' AND INDEX_NAME = 'ix_sales_date')
  UNION ALL SELECT 20, '8', 'reservations: FK vieja fk_reservations_user',
         (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_reservations_user')
  UNION ALL SELECT 21, '8', 'reservations: FK nueva fk_reservations_resolved_by',
         (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
           WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_reservations_resolved_by')
  UNION ALL SELECT 22, '8', 'reservations: índice uq_reservations_sale',
         (SELECT COUNT(*) FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reservations' AND INDEX_NAME = 'uq_reservations_sale')
  UNION ALL SELECT 23, '8', 'reservations: sale_id repetidos (impiden el índice único)',
         (SELECT COUNT(*) FROM (SELECT sale_id FROM reservations WHERE sale_id IS NOT NULL
                                 GROUP BY sale_id HAVING COUNT(*) > 1) d)
  UNION ALL SELECT 24, '8', 'registers: índice uq_registers_branch_name',
         (SELECT COUNT(*) FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registers' AND INDEX_NAME = 'uq_registers_branch_name')
  UNION ALL SELECT 25, '8', 'registers: nombres repetidos por sucursal (impiden el índice)',
         (SELECT COUNT(*) FROM (SELECT branch_id, name FROM registers GROUP BY branch_id, name HAVING COUNT(*) > 1) d)
  UNION ALL SELECT 26, '8', 'sessions: índice ix_sessions_expires',
         (SELECT COUNT(*) FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sessions' AND INDEX_NAME = 'ix_sessions_expires')

  -- Paso 9
  UNION ALL SELECT 27, '9', 'vista v_inventory',
         (SELECT COUNT(*) FROM information_schema.VIEWS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'v_inventory')
  UNION ALL SELECT 28, '9', 'vista v_consolidated_inventory nueva (tiene product_id)',
         (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'v_consolidated_inventory' AND COLUMN_NAME = 'product_id')
  UNION ALL SELECT 29, '-', 'versión del servidor', VERSION()
) chequeo
ORDER BY orden;
