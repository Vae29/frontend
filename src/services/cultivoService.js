import httpClient from './httpClient.js';

export async function fetchCultivosPorFinca(fincaId) {
  const response = await httpClient.get(`/api/cultivos/finca/${fincaId}`);
  return response.data?.data ?? response.data;
}
