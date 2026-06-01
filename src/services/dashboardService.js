import httpClient from './httpClient.js';

export async function fetchDashboardForFinca(fincaId, filters = {}) {
  const { month, year } = filters;
  const params = {};

  if (month !== undefined && month !== null && month !== '') {
    params.month = Number(month);
  }

  if (year !== undefined && year !== null && year !== '') {
    params.year = Number(year);
  }

  const response = await httpClient.get(`/api/dashboard/finca/${fincaId}`, {
    params,
  });
  return response.data;
}
