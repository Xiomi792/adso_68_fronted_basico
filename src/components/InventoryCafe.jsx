import { useEffect, useMemo, useState } from 'react'
import {
  createProduct,
  deleteProduct,
  editProduct,
  getInventory,
  updateInventoryStock,
} from '../services/inventoryService.js'
import { createSale, deleteSale, getOrders, getSales } from '../services/salesService.js'

const InventoryCafe = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('inventario')
  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [formulario, setFormulario] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    stock: '',
    minimo: '',
  })
  const [ventaForm, setVentaForm] = useState({
    cliente: '',
    metodo_pago: 'Efectivo',
    producto_id: '',
    cantidad: '1',
  })
  const [carrito, setCarrito] = useState([])
  const [mensajeVenta, setMensajeVenta] = useState('')
  const [mensajeInventario, setMensajeInventario] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [productoEditando, setProductoEditando] = useState(null)
  const [fechaActual] = useState(() => {
    const fecha = new Date()
    fecha.setHours(0, 0, 0, 0)
    return fecha
  })

  const cargarDatos = async () => {
    const inventario = await getInventory()
    const ventasApi = await getSales()
    const pedidosApi = await getOrders()
    setProductos(inventario)
    setVentas(ventasApi)
    setPedidos(pedidosApi)
  }

  useEffect(() => {
    let activo = true
    Promise.all([getInventory(), getSales(), getOrders()]).then(([inventario, ventasApi, pedidosApi]) => {
      if (!activo) return
      setProductos(inventario)
      setVentas(ventasApi)
      setPedidos(pedidosApi)
    })

    return () => {
      activo = false
    }
  }, [])

  const resumen = useMemo(() => {
    const totalStock = productos.reduce((sum, item) => sum + Number(item.stock), 0)
    const bajoStock = productos.filter((item) => Number(item.stock) <= Number(item.minimo)).length
    const valorInventario = productos.reduce(
      (sum, item) => sum + Number(item.stock) * Number(item.precio),
      0,
    )

    const ingresos = ventas.reduce((sum, venta) => sum + Number(venta.total), 0)
    const promedioVenta = ventas.length ? ingresos / ventas.length : 0

    const dias = Array.from({ length: 7 }, (_, index) => {
      const fecha = new Date(fechaActual)
      fecha.setDate(fecha.getDate() - (6 - index))
      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
      const total = ventas.reduce((sum, venta) => {
        const fechaVenta = new Date(venta.fecha)
        const claveVenta = `${fechaVenta.getFullYear()}-${fechaVenta.getMonth()}-${fechaVenta.getDate()}`
        return claveVenta === clave ? sum + Number(venta.total) : sum
      }, 0)
      return {
        etiqueta: fecha.toLocaleDateString('es-CO', { weekday: 'short' }),
        total,
      }
    })

    return { totalStock, bajoStock, valorInventario, ingresos, promedioVenta, dias }
  }, [productos, ventas, fechaActual])

  const productosFiltrados = useMemo(() => {
    const filtro = busqueda.trim().toLocaleLowerCase('es')
    if (!filtro) return productos
    return productos.filter((producto) =>
      `${producto.nombre} ${producto.categoria}`.toLocaleLowerCase('es').includes(filtro),
    )
  }, [productos, busqueda])

  const maxIngresoDia = Math.max(...resumen.dias.map((dia) => dia.total), 1)
  const totalCarrito = carrito.reduce((sum, item) => sum + Number(item.precio) * Number(item.cantidad), 0)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  const handleVentaChange = (e) => {
    const { name, value } = e.target
    setVentaForm((actual) => ({ ...actual, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nuevoProducto = {
      nombre: formulario.nombre.trim(),
      categoria: formulario.categoria.trim() || 'General',
      precio: Number(formulario.precio) || 0,
      stock: Number(formulario.stock) || 0,
      minimo: Number(formulario.minimo) || 0,
    }

    if (!nuevoProducto.nombre || nuevoProducto.precio <= 0) {
      setMensajeInventario('Ingresa un nombre y un precio mayor que cero.')
      return
    }

    const respuesta = productoEditando
      ? await editProduct(productoEditando.id, nuevoProducto)
      : await createProduct(nuevoProducto)

    if (respuesta.producto) {
      setProductos((actual) =>
        productoEditando
          ? actual.map((producto) =>
              Number(producto.id) === Number(respuesta.producto.id) ? respuesta.producto : producto,
            )
          : [respuesta.producto, ...actual],
      )
      setMensajeInventario(respuesta.message)
      setProductoEditando(null)
      setFormulario({ nombre: '', categoria: '', precio: '', stock: '', minimo: '' })
      return
    }

    setMensajeInventario(respuesta.message || 'No se pudo guardar el producto.')
  }

  const comenzarEdicion = (producto) => {
    setProductoEditando(producto)
    setFormulario({
      nombre: producto.nombre,
      categoria: producto.categoria || '',
      precio: producto.precio,
      stock: producto.stock,
      minimo: producto.minimo,
    })
    setMensajeInventario('')
  }

  const cancelarEdicion = () => {
    setProductoEditando(null)
    setFormulario({ nombre: '', categoria: '', precio: '', stock: '', minimo: '' })
    setMensajeInventario('')
  }

  const borrarProducto = async (producto) => {
    if (!window.confirm(`¿Eliminar "${producto.nombre}" del inventario? El historial de ventas se conservará.`)) {
      return
    }

    const respuesta = await deleteProduct(producto.id)
    setMensajeInventario(respuesta.message)
    if (respuesta.success) {
      setProductos((actual) => actual.filter((item) => Number(item.id) !== Number(producto.id)))
      setCarrito((actual) => actual.filter((item) => Number(item.id) !== Number(producto.id)))
      if (Number(productoEditando?.id) === Number(producto.id)) cancelarEdicion()
    }
  }

  const actualizarStock = async (id, cambio) => {
    const respuesta = await updateInventoryStock(id, cambio)

    if (respuesta.producto) {
      setProductos((actual) =>
        actual.map((producto) =>
          producto.id === id ? { ...producto, stock: Number(respuesta.producto.stock) } : producto,
        ),
      )
    }
  }

  const agregarAlCarrito = () => {
    if (!ventaForm.producto_id) return

    const producto = productos.find((item) => Number(item.id) === Number(ventaForm.producto_id))
    if (!producto) return

    const cantidad = Number(ventaForm.cantidad) || 1
    const itemExistente = carrito.find((item) => Number(item.id) === Number(producto.id))

    if (itemExistente) {
      setCarrito((actual) =>
        actual.map((item) =>
          Number(item.id) === Number(producto.id)
            ? { ...item, cantidad: Number(item.cantidad) + cantidad }
            : item,
        ),
      )
    } else {
      setCarrito((actual) => [...actual, { ...producto, cantidad }])
    }

    setVentaForm((actual) => ({ ...actual, producto_id: '', cantidad: '1' }))
  }

  const removerDelCarrito = (id) => {
    setCarrito((actual) => actual.filter((item) => Number(item.id) !== Number(id)))
  }

  const registrarVenta = async () => {
    if (!carrito.length) {
      setMensajeVenta('Agrega productos al carrito antes de vender')
      return
    }

    const payload = {
      cliente: ventaForm.cliente || 'Cliente general',
      metodo_pago: ventaForm.metodo_pago || 'Efectivo',
      items: carrito.map((item) => ({
        producto_id: item.id,
        cantidad: item.cantidad,
      })),
    }

    const respuesta = await createSale(payload)
    setMensajeVenta(respuesta.message || 'Venta registrada')

    if (respuesta.venta) {
      setCarrito([])
      setVentaForm((actual) => ({ ...actual, cliente: '', producto_id: '', cantidad: '1' }))
      await cargarDatos()
    }
  }

  const borrarVenta = async (venta) => {
    if (!window.confirm(`¿Eliminar la venta #${venta.id} y sus pedidos? El stock vendido será restaurado.`)) {
      return
    }

    const respuesta = await deleteSale(venta.id)
    setMensajeVenta(respuesta.message)
    if (respuesta.success) {
      setVentas((actual) => actual.filter((item) => Number(item.id) !== Number(venta.id)))
      setPedidos((actual) => actual.filter((item) => Number(item.venta_id) !== Number(venta.id)))
      await cargarDatos()
    }
  }

  return (
    <div className="inventory-page">
      <header className="inventory-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Cafetería La Puerta</h2>
        </div>
        <button type="button" className="secondary-button" onClick={onBack}>
          Volver al login
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card accent">
          <span>Total de unidades</span>
          <strong>{resumen.totalStock}</strong>
        </div>
        <div className="stat-card">
          <span>Productos bajos</span>
          <strong>{resumen.bajoStock}</strong>
        </div>
        <div className="stat-card">
          <span>Valor del inventario</span>
          <strong>${resumen.valorInventario.toLocaleString('es-CO')}</strong>
        </div>
        <div className="stat-card">
          <span>Ventas registradas</span>
          <strong>{ventas.length}</strong>
        </div>
      </section>

      <nav className="tab-nav" aria-label="Navegación del dashboard">
        <button type="button" className={activeTab === 'inventario' ? 'tab active' : 'tab'} onClick={() => setActiveTab('inventario')}>
          Inventario
        </button>
        <button type="button" className={activeTab === 'ventas' ? 'tab active' : 'tab'} onClick={() => setActiveTab('ventas')}>
          Ventas
        </button>
        <button type="button" className={activeTab === 'pedidos' ? 'tab active' : 'tab'} onClick={() => setActiveTab('pedidos')}>
          Pedidos
        </button>
      </nav>

      {activeTab === 'inventario' && (
        <div className="inventory-grid">
          <form className="panel form-panel" onSubmit={handleSubmit}>
            <h3>{productoEditando ? 'Editar producto' : 'Agregar producto'}</h3>

            <label>
              Nombre
              <input
                type="text"
                name="nombre"
                value={formulario.nombre}
                onChange={handleChange}
                placeholder="Ej. Café frío"
              />
            </label>

            <label>
              Categoría
              <input
                type="text"
                name="categoria"
                value={formulario.categoria}
                onChange={handleChange}
                placeholder="Ej. Bebidas"
              />
            </label>

            <div className="two-columns">
              <label>
                Precio
                <input
                  type="number"
                  name="precio"
                  value={formulario.precio}
                  onChange={handleChange}
                  min="0"
                />
              </label>

              <label>
                Stock
                <input
                  type="number"
                  name="stock"
                  value={formulario.stock}
                  onChange={handleChange}
                  min="0"
                />
              </label>
            </div>

            <label>
              Stock mínimo
              <input
                type="number"
                name="minimo"
                value={formulario.minimo}
                onChange={handleChange}
                min="0"
              />
            </label>

            <button type="submit" className="primary-button">
              {productoEditando ? 'Guardar cambios' : 'Guardar producto'}
            </button>
            {productoEditando && (
              <button type="button" className="secondary-button" onClick={cancelarEdicion}>
                Cancelar edición
              </button>
            )}
            {mensajeInventario && <p className="feedback-message">{mensajeInventario}</p>}
          </form>

          <div className="panel table-panel">
            <div className="panel-heading">
              <h3>Productos actuales</h3>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o categoría"
                aria-label="Buscar productos"
              />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Stock</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto) => (
                    <tr key={producto.id}>
                      <td>
                        <div className="product-name">
                          <strong>{producto.nombre}</strong>
                          <span>{producto.categoria}</span>
                        </div>
                      </td>
                      <td>{producto.stock}</td>
                      <td>${Number(producto.precio).toLocaleString('es-CO')}</td>
                      <td>
                        <div className="stock-actions">
                          <button type="button" onClick={() => actualizarStock(producto.id, -1)}>-1</button>
                          <button type="button" onClick={() => actualizarStock(producto.id, 1)}>+1</button>
                          <button type="button" onClick={() => comenzarEdicion(producto)}>Editar</button>
                          <button type="button" className="danger-button" onClick={() => borrarProducto(producto)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {productosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-state">No se encontraron productos.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ventas' && (
        <>
        <section className="report-grid">
          <div className="stat-card accent">
            <span>Ingresos registrados</span>
            <strong>${resumen.ingresos.toLocaleString('es-CO')}</strong>
          </div>
          <div className="stat-card">
            <span>Promedio por venta</span>
            <strong>${Math.round(resumen.promedioVenta).toLocaleString('es-CO')}</strong>
          </div>
          <div className="panel chart-panel">
            <h3>Ingresos de los últimos 7 días</h3>
            <div className="sales-chart">
              {resumen.dias.map((dia, index) => (
                <div className="chart-column" key={`${dia.etiqueta}-${index}`}>
                  <span className="chart-value">${dia.total.toLocaleString('es-CO')}</span>
                  <div className="chart-track">
                    <div
                      className="chart-bar"
                      style={{ height: `${dia.total ? Math.max((dia.total / maxIngresoDia) * 100, 5) : 0}%` }}
                    />
                  </div>
                  <span className="chart-label">{dia.etiqueta}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="sales-layout">
          <div className="panel sale-form-panel">
            <h3>Registrar venta</h3>

            <label>
              Cliente
              <input type="text" name="cliente" value={ventaForm.cliente} onChange={handleVentaChange} placeholder="Nombre del cliente" />
            </label>

            <label>
              Método de pago
              <select name="metodo_pago" value={ventaForm.metodo_pago} onChange={handleVentaChange}>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Nequi">Nequi</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </label>

            <div className="two-columns">
              <label>
                Producto
                <select name="producto_id" value={ventaForm.producto_id} onChange={handleVentaChange}>
                  <option value="">Selecciona</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} ({producto.stock})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Cantidad
                <input type="number" name="cantidad" min="1" value={ventaForm.cantidad} onChange={handleVentaChange} />
              </label>
            </div>

            <button type="button" className="primary-button" onClick={agregarAlCarrito}>
              Agregar al carrito
            </button>

            <div className="cart-box">
              {carrito.length === 0 ? (
                <p>El carrito está vacío.</p>
              ) : (
                <ul>
                  {carrito.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.nombre} x {item.cantidad}
                      </span>
                      <span>${(Number(item.precio) * Number(item.cantidad)).toLocaleString('es-CO')}</span>
                      <button type="button" onClick={() => removerDelCarrito(item.id)}>Quitar</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="sale-total">
              <strong>Total:</strong>
              <span>${totalCarrito.toLocaleString('es-CO')}</span>
            </div>

            <button type="button" className="primary-button" onClick={registrarVenta}>
              Confirmar venta
            </button>
            <p className="auth-message">{mensajeVenta}</p>
          </div>

          <div className="panel table-panel">
            <h3>Ventas recientes</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Fecha</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((venta) => (
                    <tr key={venta.id}>
                      <td>{venta.cliente}</td>
                      <td>${Number(venta.total).toLocaleString('es-CO')}</td>
                      <td>{venta.metodo_pago}</td>
                      <td>{new Date(venta.fecha).toLocaleString('es-CO')}</td>
                      <td>
                        <button type="button" className="danger-button" onClick={() => borrarVenta(venta)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </>
      )}

      {activeTab === 'pedidos' && (
        <div className="panel orders-panel">
          <h3>Pedidos registrados</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>{pedido.producto_nombre}</td>
                    <td>{pedido.cantidad}</td>
                    <td>${Number(pedido.precio_unitario).toLocaleString('es-CO')}</td>
                    <td>${Number(pedido.subtotal).toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export { InventoryCafe }
