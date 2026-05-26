function doGet(e) {
  return router_(e);
}

function doPost(e) {
  return router_(e);
}

function router_(e) {
  var action = getAction_(e);

  try {
    if (action === 'login' || action === 'loginTrabajador') {
      return loginTrabajador_(e);
    }

    if (action === 'getPacientes') {
      return getPacientes_(e);
    }

    if (action === 'crearPaciente') {
      return crearPaciente_(e);
    }

    if (action === 'actualizarPaciente') {
      return actualizarPaciente_(e);
    }

    if (action === 'eliminarPaciente') {
      return eliminarPaciente_(e);
    }

    if (action === 'getCitas') {
      return getCitas_(e);
    }

    if (action === 'crearCita') {
      return crearCita_(e);
    }

    if (action === 'actualizarEstadoCita') {
      return actualizarEstadoCita_(e);
    }

    if (action === 'reprogramarCita') {
      return reprogramarCita_(e);
    }

    if (action === 'eliminarCita') {
      return eliminarCita_(e);
    }

    if (action === 'getHistoriasCita') {
      return getHistoriasCita_(e);
    }

    if (action === 'getMedicosCita') {
      return getMedicosCita_(e);
    }

    if (action === 'getUsuarios') {
      return getUsuarios_(e);
    }

    if (action === 'actualizarUsuario') {
      return actualizarUsuario_(e);
    }

    if (action === 'getHistorias') {
      return getHistorias_(e);
    }

    if (action === 'getPacientesSinHistoria') {
      return getPacientesSinHistoria_(e);
    }

    if (action === 'crearHistoria') {
      return crearHistoria_(e);
    }

    if (action === 'buscarHistorialPaciente') {
      return buscarHistorialPaciente_(e);
    }

    if (action === 'solicitarCita') {
      return solicitarCita_(e);
    }

    if (action === 'getPagos') {
      return getPagos_(e);
    }

    if (action === 'buscarCitaPago') {
      return buscarCitaPago_(e);
    }

    if (action === 'registrarPago') {
      return registrarPago_(e);
    }

    if (action === 'anularPago') {
      return anularPago_(e);
    }

    if (action === 'getConsultas') {
      return getConsultas_(e);
    }

    if (action === 'getCitasPagadasConsulta') {
      return getCitasPagadasConsulta_(e);
    }

    if (action === 'registrarConsulta') {
      return registrarConsulta_(e);
    }

    if (action === 'getExamenes') {
      return getExamenes_(e);
    }

    if (action === 'getConsultasExamen') {
      return getConsultasExamen_(e);
    }

    if (action === 'registrarExamen') {
      return registrarExamen_(e);
    }

    if (action === 'eliminarExamen') {
      return eliminarExamen_(e);
    }

    if (action === 'buscarReportePaciente') {
      return buscarReportePaciente_(e);
    }

    if (action === 'registrarReporte') {
      return registrarReporte_(e);
    }

    


    
    return json_({
      success: false,
      message: 'Acción no válida',
      actionRecibida: action
    });

  } catch (error) {
    return json_({
      success: false,
      message: 'Error interno del servidor',
      detail: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : ''
    });
  }
}

function getAction_(e) {
  if (e && e.parameter && e.parameter.action) {
    return String(e.parameter.action).trim();
  }

  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      if (data.action) {
        return String(data.action).trim();
      }
    } catch (err) {}
  }

  return '';
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}