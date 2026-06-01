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

export async function fetchCultivoDetalle(idcultivo) {
  const response = await httpClient.get(`/api/cultivos/${idcultivo}/detalle`);
  return response.data?.data ?? response.data;
}

export async function fetchCategoriasCosto() {
  const response = await httpClient.get('/api/categorias-costo');
  return response.data?.data ?? response.data;
}

export async function fetchSubcategoriasPorCategoria(categoriaId) {
  const response = await httpClient.get(`/api/subcategorias-costo/${categoriaId}`);
  return response.data?.data ?? response.data;
}

export async function fetchEstadosPago() {
  const response = await httpClient.get('/api/estados-pago');
  return response.data?.data ?? response.data;
}

export async function fetchUnidadesMedida() {
  const response = await httpClient.get('/api/unidades-medida');
  return response.data?.data ?? response.data;
}

export async function fetchTiposPrecio() {
  const response = await httpClient.get('/api/tipos-precio');
  return response.data?.data ?? response.data;
}

export async function fetchEtapaEnProcesoPorCultivo(cultivoId) {
  const response = await httpClient.get(`/api/cultivos/${cultivoId}/etapa-en-proceso`);
  return response.data?.data ?? response.data;
}

export async function fetchEtapasPorCultivo(cultivoId) {
  const response = await httpClient.get(`/api/cultivos/${cultivoId}/etapas`);
  return response.data?.data ?? response.data;
}

export async function fetchAllEtapasCatalog() {
  const response = await httpClient.get('/api/etapas');
  return response.data?.data ?? response.data;
}

export async function createEtapaForCultivo(cultivoId, { idetapa, descripcion, forceFinalize = false }) {
  const response = await httpClient.post(`/api/cultivos/${cultivoId}/etapas`, {
    idetapa,
    descripcion,
    forceFinalize,
  });
  return response.data;
}

export async function updateEtapaForCultivo(etapaCultivoId, { descripcion, idestado }, { forceFinalize = false, forceEnProceso = false } = {}) {
  const response = await httpClient.put(`/api/cultivos/etapas/${etapaCultivoId}`, {
    descripcion,
    idestado,
    forceFinalize,
    forceEnProceso,
  });
  return response.data;
}

export async function deleteEtapaForCultivo(etapaCultivoId) {
  const response = await httpClient.delete(`/api/cultivos/etapas/${etapaCultivoId}`);
  return response.data;
}

export async function validateCultivoForCost(cultivoId) {
  const response = await httpClient.get(`/api/cultivos/${cultivoId}/validate-for-cost`);
  return response.data;
}

export async function createCosto({ descripcion, valor, idcultivo, idetapa_cultivo, idusuario, idsubcategoria, idfinca, idestado_pago }) {
  const response = await httpClient.post('/api/costos', {
    descripcion: descripcion?.trim() || null,
    valor: Number(valor),
    idcultivo: Number(idcultivo),
    idetapa_cultivo: Number(idetapa_cultivo),
    idusuario: Number(idusuario),
    idsubcategoria: Number(idsubcategoria),
    idfinca: Number(idfinca),
    idestado_pago: Number(idestado_pago),
  })
  return response.data
}

export async function updateCosto(idcosto, { descripcion, valor, idsubcategoria, idestado_pago }) {
  const response = await httpClient.put(`/api/costos/${idcosto}`, {
    descripcion: descripcion?.trim() || null,
    valor: Number(valor),
    idsubcategoria: Number(idsubcategoria),
    idestado_pago: Number(idestado_pago),
  })
  return response.data
}

export async function deleteCosto(idcosto) {
  const response = await httpClient.delete(`/api/costos/${idcosto}`)
  return response.data
}

export async function fetchCosechasPorCultivo(cultivoId) {
  const response = await httpClient.get(`/api/cultivos/${cultivoId}/cosechas`)
  return response.data?.data ?? response.data
}

export async function createCosecha(cultivoId, { cantidad, idunidadmedida, precio, idtipo_precio }) {
  const response = await httpClient.post(`/api/cultivos/${cultivoId}/cosechas`, {
    cantidad,
    idunidadmedida,
    precio,
    idtipo_precio,
  })
  return response.data
}

export async function updateCosecha(idcosecha, { cantidad, idunidadmedida, precio, idtipo_precio }) {
  const response = await httpClient.put(`/api/cosechas/${idcosecha}`, {
    cantidad,
    idunidadmedida,
    precio,
    idtipo_precio,
  })
  return response.data
}

export async function deleteCosecha(idcosecha) {
  const response = await httpClient.delete(`/api/cosechas/${idcosecha}`)
  return response.data
}
