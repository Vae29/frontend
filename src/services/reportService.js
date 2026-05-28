import httpClient from './httpClient.js';

async function getJson(response) {
  if (response.success === false) {
    return { success: false, error: response.message || 'Error en la respuesta' };
  }
  return response;
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
    const response = await httpClient.post('/api/reportes/por-cultivo', filters);
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportPorCultivo error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportCostos(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/costos', filters);
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportCostos error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportProduccion(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/produccion', filters);
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportProduccion error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportRentabilidad(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/rentabilidad', filters);
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportRentabilidad error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportTrabajador(filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/trabajador', filters);
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportTrabajador error', error);
    return { success: false, error: error.response?.data?.message || 'Error de red' };
  }
}

export async function fetchReportQuery(reportType, filters = {}) {
  try {
    const response = await httpClient.post('/api/reportes/query', { reportType, filters });
    return await getJson(response.data);
  } catch (error) {
    console.error('fetchReportQuery error', error);
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
};
