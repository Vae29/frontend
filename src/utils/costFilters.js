export function filterCostsByCategoryId(costs, categoryId) {
  if (!Array.isArray(costs)) return []
  if (categoryId == null || categoryId === '' || categoryId === 'todos') return costs

  return costs.filter((cost) =>
    cost.categoriaId != null && String(cost.categoriaId) === String(categoryId)
  )
}