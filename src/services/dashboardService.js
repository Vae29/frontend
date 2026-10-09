import httpClient from './httpClient.js';

export async function fetchDashboardForFinca(fincaId, filters = {}) {
  const numericFincaId = Number(fincaId);
  if (!Number.isInteger(numericFincaId) || numericFincaId <= 0) {
    throw new Error('Selecciona una finca válida para cargar el dashboard.');
  }

  const { month, year } = filters;
  const params = {};

  if (month !== undefined && month !== null && month !== '') {
    params.month = Number(month);
  }

  if (year !== undefined && year !== null && year !== '') {
    params.year = Number(year);
  }

  try {
    const response = await httpClient.get(`/api/dashboard/finca/${numericFincaId}`, {
      params,
    });
    const data = response.data;
    if (!data || !Array.isArray(data.rentability)) {
      throw new Error('La respuesta del dashboard no contiene datos de rentabilidad válidos.');
    }
    return data;
  } catch (error) {
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    throw new Error(message || 'No se pudo cargar el dashboard.', { cause: error });
  }
}
