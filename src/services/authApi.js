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
