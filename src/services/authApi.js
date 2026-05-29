import axios from 'axios';
import httpClient from './httpClient.js';

const API_URL = 'http://localhost:3000';

export async function loginUser(email, password) {
  try {
    const response = await httpClient.post('/auth/login', { email, password });

    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al iniciar sesión',
    };
  } catch (error) {
    console.error('Error en loginUser:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
    };
  }
}

export async function logoutUser() {
  try {
    const response = await httpClient.post('/auth/logout');
    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Error en logoutUser:', error);
    return {
      success: false,
      message: 'Error al cerrar sesión',
    };
  }
}

export async function refreshSession() {
  try {
    const response = await httpClient.post('/auth/refresh', {})

    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al renovar la sesión',
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
    };
  }
}

export async function fetchUsers() {
  try {
    const response = await httpClient.get('/auth/users');

    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al obtener los usuarios',
    };
  } catch (error) {
    console.error('Error en fetchUsers:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
    };
  }
}

export async function createUser(userData) {
  try {
    const response = await httpClient.post('/auth/users', userData);

    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al crear el usuario',
    };
  } catch (error) {
    console.error('Error en createUser:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
    };
  }
}

export async function updateUser(id, userData) {
  try {
    const response = await httpClient.put(`/auth/users/${id}`, userData);

    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: response.data.data,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al actualizar el usuario',
    };
  } catch (error) {
    console.error('Error en updateUser:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
    };
  }
}

export async function deleteUser(id) {
  try {
    const response = await httpClient.delete(`/auth/users/${id}`);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al eliminar el usuario',
    };
  } catch (error) {
    console.error('Error en deleteUser:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
    };
  }
}

export async function requestPasswordReset(email) {
  try {
    const response = await httpClient.post('/auth/request-reset', { email });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al verificar el correo',
    };
  } catch (error) {
    console.error('Error en requestPasswordReset:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
    };
  }
}

export async function recoverPassword(email) {
  try {
    const response = await httpClient.post('/auth/recover-password', { email });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al recuperar la contraseña',
    };
  } catch (error) {
    console.error('Error en recoverPassword:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
    };
  }
}

export async function verifyResetCode(email, code) {
  try {
    const response = await httpClient.post('/auth/verify-reset-code', { email, code });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Error al verificar el código',
    };
  } catch (error) {
    console.error('Error en verifyResetCode:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error de conexión con el servidor',
    };
  }
}
