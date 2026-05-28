import httpClient from './httpClient.js';

export async function fetchDashboardForFinca(fincaId) {
  const response = await httpClient.get(`/api/dashboard/finca/${fincaId}`);
  return response.data;
}
