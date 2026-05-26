import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchDashboardForFinca(fincaId) {
  const response = await apiClient.get(`/dashboard/finca/${fincaId}`);
  return response.data;
}
