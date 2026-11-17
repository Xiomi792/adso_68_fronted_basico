const getSales = async () => {
  try {
    const res = await fetch('/api/ventas')
    const data = await res.json()
    return data.ventas ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

const getOrders = async () => {
  try {
    const res = await fetch('/api/pedidos')
    const data = await res.json()
    return data.pedidos ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

const createSale = async (saleData) => {
  try {
    const res = await fetch('/api/ventas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saleData),
    })
    const data = await res.json()
    return data
  } catch (error) {
    console.error(error)
    return { message: 'Error al registrar la venta' }
  }
}

const deleteSale = async (id) => {
  try {
    const res = await fetch(`/api/ventas/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al eliminar la venta')
    return data
  } catch (error) {
    console.error(error)
    return { message: error.message || 'Error al eliminar la venta' }
  }
}

export { getSales, getOrders, createSale, deleteSale }
