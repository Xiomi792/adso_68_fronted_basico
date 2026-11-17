const getInventory = async () => {
  try {
    const res = await fetch('/api/inventario')
    const data = await res.json()
    return data.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

const createProduct = async (producto) => {
  try {
    const res = await fetch('/api/inventario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(producto),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al guardar el producto')
    return data
  } catch (error) {
    console.error(error)
    return { message: 'Error al guardar el producto' }
  }
}

const editProduct = async (id, producto) => {
  try {
    const res = await fetch(`/api/inventario/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(producto),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al actualizar el producto')
    return data
  } catch (error) {
    console.error(error)
    return { message: error.message || 'Error al actualizar el producto' }
  }
}

const deleteProduct = async (id) => {
  try {
    const res = await fetch(`/api/inventario/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al eliminar el producto')
    return data
  } catch (error) {
    console.error(error)
    return { message: error.message || 'Error al eliminar el producto' }
  }
}

const updateInventoryStock = async (id, cambio) => {
  try {
    const res = await fetch('/api/inventario/stock', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, cambio }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al actualizar el stock')
    return data
  } catch (error) {
    console.error(error)
    return { message: error.message || 'Error al actualizar el stock' }
  }
}

export { getInventory, createProduct, editProduct, deleteProduct, updateInventoryStock }
