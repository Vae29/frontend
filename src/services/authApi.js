const API_URL = 'http://localhost:3000/auth';

export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error en la autenticación',
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error en loginUser:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    };
  }
}

export async function fetchUsers() {
  try {
    const response = await fetch(`${API_URL}/users`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error al obtener los usuarios',
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error en fetchUsers:', error);
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    };
  }
}

export async function createUser(userData) {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error al crear el usuario',
      }
    }

    return {
      success: true,
      data: data.data,
    }
  } catch (error) {
    console.error('Error en createUser:', error)
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    }
  }
}

export async function updateUser(id, userData) {
  try {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error al actualizar el usuario',
      }
    }

    return {
      success: true,
      data: data.data,
    }
  } catch (error) {
    console.error('Error en updateUser:', error)
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    }
  }
}

export async function deleteUser(id) {
  try {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error al eliminar el usuario',
      }
    }

    return {
      success: true,
      data: data.data,
    }
  } catch (error) {
    console.error('Error en deleteUser:', error)
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    }
  }
}

export async function requestPasswordReset(email) {
  try {
    const response = await fetch(`${API_URL}/request-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error al verificar el correo',
      }
    }

    return {
      success: true,
      message: data.message,
    }
  } catch (error) {
    console.error('Error en requestPasswordReset:', error)
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    }
  }
}

export async function recoverPassword(email) {
  try {
    const response = await fetch(`${API_URL}/recover-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error al recuperar la contraseña',
      }
    }

    return {
      success: true,
      data: data.data,
      message: data.message,
    }
  } catch (error) {
    console.error('Error en recoverPassword:', error)
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    }
  }
}

export async function verifyResetCode(email, code) {
  try {
    const response = await fetch(`${API_URL}/verify-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Error al verificar el código',
      }
    }

    return {
      success: true,
      data: data.data,
      message: data.message,
    }
  } catch (error) {
    console.error('Error en verifyResetCode:', error)
    return {
      success: false,
      message: 'Error de conexión con el servidor',
    }
  }
}
