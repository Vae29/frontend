import httpClient from './httpClient.js';

export async function fetchFincas() {
  try {
    const response = await httpClient.get('/api/fincas');

    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al obtener fincas',
      data: [],
    };
  } catch (error) {
    console.error('Error en fetchFincas:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
      data: [],
    };
  }
}

export async function fetchCultivosEnProceso() {
  try {
    const response = await httpClient.get('/api/cultivos-en-proceso');

    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al obtener cultivos',
      data: [],
    };
  } catch (error) {
    console.error('Error en fetchCultivosEnProceso:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
      data: [],
    };
  }
}
