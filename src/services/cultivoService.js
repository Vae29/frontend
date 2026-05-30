import httpClient from './httpClient.js';

export async function fetchCultivosPorFinca(fincaId) {
  const response = await httpClient.get(`/api/cultivos/finca/${fincaId}`);
  return response.data?.data ?? response.data;
}

export async function fetchTiposCultivo() {
  const response = await httpClient.get('/api/tipos-cultivo');
  return response.data?.data ?? response.data;
}

export async function createCultivo({ nombre, idtipocultivo, idfinca }) {
  const response = await httpClient.post('/api/cultivos', {
    nombre,
    idtipocultivo,
    idfinca,
  });
  return response.data;
}

export async function fetchEstados() {
  const response = await httpClient.get('/api/estados');
  return response.data?.data ?? response.data;
}

export async function updateCultivo(id, { nombre, idtipocultivo, idestado, fecha_inicio }) {
  const response = await httpClient.put(`/api/cultivos/${id}`, {
    nombre,
    idtipocultivo,
    idestado,
    fecha_inicio,
  });
  return response.data;
}

export async function deleteCultivo(id) {
  const response = await httpClient.delete(`/api/cultivos/${id}`);
  return response.data;
}
