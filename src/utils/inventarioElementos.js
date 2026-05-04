import { formatCOP } from '../services/agroData'

/** Filas de inventario simuladas según descripción (lógica de admin-panel / worker-panel) */
export function getInventarioElementos(descripcion, variant = 'cultivo') {
  const d = (descripcion || '').toLowerCase()
  let elementosData

  if (d.includes('semillas')) {
    elementosData =
      variant === 'generales'
        ? [
            { producto: 'Semillas certificadas - lote A', precio: 15000, cantidad: 18, medida: 'Kg', total: 270000 },
            { producto: 'Semillas respaldo - lote B', precio: 18000, cantidad: 2, medida: 'Kg', total: 36000 },
          ]
        : [
            { producto: 'Semillas de Naranja Calidad A', precio: 15000, cantidad: 18, medida: 'Kg', total: 270000 },
            { producto: 'Semillas Backup Premium', precio: 18000, cantidad: 2, medida: 'Kg', total: 36000 },
          ]
  } else if (d.includes('fertilizante') || d.includes('fertiliz')) {
    elementosData = [
      { producto: 'NPK 15-15-15', precio: 45000, cantidad: 10, medida: 'Kg', total: 450000 },
      { producto: 'Micronutrientes Foliares', precio: 28000, cantidad: 3, medida: 'L', total: 84000 },
    ]
    if (variant === 'generales') {
      elementosData[1] = { ...elementosData[1], producto: 'Micronutrientes foliares' }
    }
  } else if (d.includes('abono') || d.includes('orgánico')) {
    elementosData =
      variant === 'generales'
        ? [
            { producto: 'Compost orgánico', precio: 12000, cantidad: 25, medida: 'Kg', total: 300000 },
            { producto: 'Humus de lombriz', precio: 8000, cantidad: 15, medida: 'Kg', total: 120000 },
          ]
        : [
            { producto: 'Compost Orgánico Premium', precio: 12000, cantidad: 25, medida: 'Kg', total: 300000 },
            { producto: 'Humus de Lombriz', precio: 8000, cantidad: 15, medida: 'Kg', total: 120000 },
          ]
  } else if (d.includes('plántulas') || d.includes('plantulas')) {
    elementosData = [
      { producto: 'Plántulas de Tomate Calidad Premium', precio: 3500, cantidad: 350, medida: 'Unidad', total: 122500 },
      { producto: 'Macetas para trasplante', precio: 1200, cantidad: 350, medida: 'Unidad', total: 27500 },
    ]
  } else if (d.includes('pesticida') || d.includes('insecticida')) {
    elementosData =
      variant === 'generales'
        ? [
            { producto: 'Insecticida orgánico 500ml', precio: 32000, cantidad: 5, medida: 'Unidad', total: 160000 },
            { producto: 'Fungicida preventivo 1L', precio: 48000, cantidad: 2, medida: 'Unidad', total: 96000 },
          ]
        : [
            { producto: 'Insecticida Orgánico 500ml', precio: 32000, cantidad: 5, medida: 'Unidad', total: 160000 },
            { producto: 'Fungicida Preventivo 1L', precio: 48000, cantidad: 2, medida: 'Unidad', total: 96000 },
          ]
  } else if (d.includes('herbicida')) {
    elementosData = [
      { producto: 'Herbicida Selectivo 2L', precio: 55000, cantidad: 3, medida: 'Unidad', total: 165000 },
      { producto: 'Sulfato de Amonio 50kg', precio: 35000, cantidad: 1, medida: 'Kg', total: 35000 },
    ]
  } else {
    elementosData =
      variant === 'generales'
        ? [
            { producto: 'Insumo agrícola tipo A', precio: 20000, cantidad: 10, medida: 'Kg', total: 200000 },
            { producto: 'Insumo agrícola tipo B', precio: 25000, cantidad: 8, medida: 'L', total: 200000 },
          ]
        : [
            { producto: 'Insumo Agrícola Tipo A', precio: 20000, cantidad: 10, medida: 'Kg', total: 200000 },
            { producto: 'Insumo Agrícola Tipo B', precio: 25000, cantidad: 8, medida: 'L', total: 200000 },
          ]
  }

  return elementosData.map((el) => ({
    ...el,
    precioFmt: formatCOP(el.precio),
    totalFmt: formatCOP(el.total),
  }))
}
