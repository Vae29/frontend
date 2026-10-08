import httpClient from './httpClient.js';

async function getJson(response) {
  if (response.success === false) {
    return { success: false, error: response.message || 'Error en la respuesta' };
  }
  return response;
}

function normalizeReportFilters(filters = {}) {
  const normalized = { ...filters };
  for (const key of ['fincaId', 'cultivoId', 'categoriaId', 'subcategoriaId', 'usuarioId', 'estadoId']) {
    const value = filters[key];
    if (value === '' || value == null) {
      normalized[key] = null;
      continue;
    }
    const number = Number(value);
    normalized[key] = Number.isInteger(number) && number > 0 ? number : null;
  }
  normalized.fechaInicio = filters.fechaInicio || null;
  normalized.fechaFin = filters.fechaFin || null;
  return normalized;
}

export async function fetchReportFilters(fincaId) {
  try {
    const query = fincaId ? `?fincaId=${encodeURIComponent(fincaId)}` : '';
    const response = await httpClient.get(`/api/reportes/filters${query}`);
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportFilters error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportPorCultivo(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/por-cultivo', normalizeReportFilters(filters));
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportPorCultivo error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportCostos(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/costos', normalizeReportFilters(filters));
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportCostos error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportProduccion(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/produccion', normalizeReportFilters(filters));
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportProduccion error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportRentabilidad(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/rentabilidad', normalizeReportFilters(filters));
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportRentabilidad error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportTrabajador(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/trabajador', normalizeReportFilters(filters));
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportTrabajador error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportQuery(reportType, filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/query', {
      reportType,
      filters: normalizeReportFilters(filters),
    });
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportQuery error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function registerReportExport(reportType, formato, filtros = {}) {
  try {
    const response = await httpClient.post('/api/reportes/audit-export', { reportType, formato, filtros });
    return await getJson(response.data);
  } catch (error) {
    console.error('registerReportExport error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export default {
  fetchReportFilters,
  fetchReportPorCultivo,
  fetchReportCostos,
  fetchReportProduccion,
  fetchReportRentabilidad,
  fetchReportTrabajador,
  fetchReportQuery,
  registerReportExport,
};
