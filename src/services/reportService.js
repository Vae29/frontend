const API_BASE = import.meta.env.VITE_API_URL || '';

async function getJson(res) {
  const body = await res.text();
  if (!body) {
    return { success: false, error: 'Respuesta vacía del servidor' };
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    console.error('JSON parse error', error, body);
    return { success: false, error: 'Respuesta inválida del servidor' };
  }
}

function buildReportRequest(endpoint, filters = {}) {
  return fetch(`${API_BASE}/api/reportes/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
}

export async function fetchReportFilters(fincaId) {
  try {
    const query = fincaId ? `?fincaId=${encodeURIComponent(fincaId)}` : '';
    const res = await fetch(`${API_BASE}/api/reportes/filters${query}`);
    return await getJson(res);
  } catch (error) {
    console.error('fetchReportFilters error', error);
    return { success: false, error: 'Error de red' };
  }
}

export async function fetchReportPorCultivo(filters = {}) {
  try {
    const res = await buildReportRequest('por-cultivo', filters);
    return await getJson(res);
  } catch (error) {
    console.error('fetchReportPorCultivo error', error);
    return { success: false, error: 'Error de red' };
  }
}

export async function fetchReportCostos(filters = {}) {
  try {
    const res = await buildReportRequest('costos', filters);
    return await getJson(res);
  } catch (error) {
    console.error('fetchReportCostos error', error);
    return { success: false, error: 'Error de red' };
  }
}

export async function fetchReportProduccion(filters = {}) {
  try {
    const res = await buildReportRequest('produccion', filters);
    return await getJson(res);
  } catch (error) {
    console.error('fetchReportProduccion error', error);
    return { success: false, error: 'Error de red' };
  }
}

export async function fetchReportRentabilidad(filters = {}) {
  try {
    const res = await buildReportRequest('rentabilidad', filters);
    return await getJson(res);
  } catch (error) {
    console.error('fetchReportRentabilidad error', error);
    return { success: false, error: 'Error de red' };
  }
}

export async function fetchReportTrabajador(filters = {}) {
  try {
    const res = await buildReportRequest('trabajador', filters);
    return await getJson(res);
  } catch (error) {
    console.error('fetchReportTrabajador error', error);
    return { success: false, error: 'Error de red' };
  }
}

export async function fetchReportQuery(reportType, filters = {}) {
  try {
    const res = await fetch(`${API_BASE}/api/reportes/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportType, filters }),
    });
    return await getJson(res);
  } catch (error) {
    console.error('fetchReportQuery error', error);
    return { success: false, error: 'Error de red' };
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
};
