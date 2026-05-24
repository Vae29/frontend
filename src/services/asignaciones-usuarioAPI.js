const API_URL = 'http://localhost:3000/api';

export async function fetchFincas() {
  try {
    const response = await fetch(`${API_URL}/fincas`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error al obtener fincas',
        data: [],
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error en fetchFincas:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
      data: [],
    };
  }
}

export async function fetchCultivosEnProceso() {
  try {
    const response = await fetch(`${API_URL}/cultivos-en-proceso`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error al obtener cultivos',
        data: [],
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error en fetchCultivosEnProceso:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
      data: [],
    };
  }
}
