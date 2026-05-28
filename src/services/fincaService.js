import httpClient from './httpClient.js';

export async function fetchFincas(search = '') {
  const params = {};
  if (search && search.trim()) {
    params.search = search.trim();
  }
  const response = await httpClient.get('/api/fincas', { params });
  return response.data?.data ?? response.data;
}

export async function createFinca({ nombre, ubicacion }) {
  const response = await httpClient.post('/api/fincas', { nombre, ubicacion });
  return response.data;
}

export async function updateFinca(id, { nombre, ubicacion }) {
  const response = await httpClient.put(`/api/fincas/${id}`, { nombre, ubicacion });
  return response.data;
}

export async function deleteFinca(id) {
  const response = await httpClient.delete(`/api/fincas/${id}`);
  return response.data;
}
