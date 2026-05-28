import axios from 'axios';
import { getAccessToken, setAccessToken, clearTokens } from './authSession.js';

const API_URL = 'http://localhost:3000';

// Crear instancia de axios
const httpClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Permite enviar cookies automáticamente
});

// Interceptor para agregar el Access Token en cada request
httpClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y renovar token si expira
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (token expirado) y no hemos intentado renovar
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar renovar el token usando el refresh token (en cookie)
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        if (response.data.success && response.data.data.accessToken) {
          // Guardar el nuevo access token
          setAccessToken(response.data.data.accessToken);

          // Reintentar la petición original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          return httpClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error al renovar token:', refreshError);
        // El refresh token también expiró, logout necesario
        clearTokens();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;
