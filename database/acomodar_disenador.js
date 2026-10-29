// Acomoda las tablas del Diseñador de phpMyAdmin (5.2) por grupos relacionados.
// Uso: abrir el Diseñador, F12 > Consola, pegar este script, Enter, y luego "Guardar página".
(() => {
  const columnas = [
    ['categories', 'tags', 'product_tags', 'product_images'],          // catálogo
    ['products', 'inventory', 'stock_movements'],                       // producto e inventario
    ['branches', 'registers', 'sales', 'sale_items'],                   // sucursal y ventas
    ['users', 'sessions', 'stock_alerts'],                              // usuarios
    ['reservations', 'reservation_items'],                              // apartados
    ['v_inventory', 'v_consolidated_inventory', 'catalog_cache',
     'products_legacy', 'schema_migrations'],                           // vistas y auxiliares
  ];
  const X0 = 20, Y0 = 20, GAP_X = 60, GAP_Y = 30;

  const porNombre = {};
  document.querySelectorAll('table.designer_tab').forEach(t => {
    if (t.style.display === 'none') return;
    porNombre[decodeURIComponent(t.getAttribute('table_name_url'))] = t;
  });

  const usadas = new Set(columnas.flat());
  const extra = Object.keys(porNombre).filter(n => !usadas.has(n)).sort();
  const layout = columnas.map(c => c.filter(n => porNombre[n]));
  if (extra.length) layout.push(extra);

  let x = X0;
  layout.filter(c => c.length).forEach(col => {
    let y = Y0, ancho = 0;
    col.forEach(n => {
      const t = porNombre[n];
      t.style.left = x + 'px';
      t.style.top = y + 'px';
      y += t.offsetHeight + GAP_Y;
      ancho = Math.max(ancho, t.offsetWidth);
    });
    x += ancho + GAP_X;
  });

  DesignerMove.reload();
  DesignerMove.markUnsaved();
  console.log('Diseñador acomodado:', Object.keys(porNombre).length, 'tablas. Ahora da clic en "Guardar página".');
})();
