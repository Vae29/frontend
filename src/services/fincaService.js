import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchFincas(search = '') {
  const params = {};
  if (search && search.trim()) {
    params.search = search.trim();
  }
  const response = await apiClient.get('/fincas', { params });
  return response.data;
}

export async function createFinca({ nombre, ubicacion }) {
  const response = await apiClient.post('/fincas', { nombre, ubicacion });
  return response.data;
}

export async function updateFinca(id, { nombre, ubicacion }) {
  const response = await apiClient.put(`/fincas/${id}`, { nombre, ubicacion });
  return response.data;
}

export async function deleteFinca(id) {
  const response = await apiClient.delete(`/fincas/${id}`);
  return response.data;
}
