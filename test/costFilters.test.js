import assert from 'node:assert/strict'
import test from 'node:test'
import { filterCostsByCategoryId } from '../src/utils/costFilters.js'

const costs = [
  { id: 1, categoriaId: 1, categoria: 'Mano de Obra' },
  { id: 2, categoriaId: 2, categoria: 'Materia Prima' },
  { id: 3, categoriaId: 3, categoria: 'Servicios' },
  { id: 4, categoriaId: 4, categoria: 'Costos Indirectos' },
  { id: 5, categoriaId: 1, categoria: 'Jornales' },
]

test('filters each catalog category by its stable ID', () => {
  assert.deepEqual(filterCostsByCategoryId(costs, 1).map((cost) => cost.id), [1, 5])
  assert.deepEqual(filterCostsByCategoryId(costs, '2').map((cost) => cost.id), [2])
  assert.deepEqual(filterCostsByCategoryId(costs, 3).map((cost) => cost.id), [3])
  assert.deepEqual(filterCostsByCategoryId(costs, 4).map((cost) => cost.id), [4])
})

test('does not depend on the visible category or subcategory label', () => {
  assert.deepEqual(filterCostsByCategoryId(costs, 1).map((cost) => cost.id), [1, 5])
})

test('returns every cost for the all-categories option', () => {
  assert.deepEqual(filterCostsByCategoryId(costs, 'todos'), costs)
})

test('does not match rows without a category ID', () => {
  assert.deepEqual(filterCostsByCategoryId([{ id: 6, categoria: 'Servicios' }], 3), [])
})