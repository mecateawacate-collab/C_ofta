function getHistorias_(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const shHistorias = ss.getSheetByName('Historias');
  const shPacientes = ss.getSheetByName('Pacientes');

  const historias = leerTabla_(shHistorias);
  const pacientes = leerTabla_(shPacientes);

  const resultado = historias.map(historia => {
    const paciente = pacientes.find(p =>
      String(p.idPaciente) === String(historia.idPaciente)
    );

    return {
      idHistoria: historia.idHistoria || '',
      idPaciente: historia.idPaciente || '',
      fechaApertura: formatearFecha_(historia.fechaApertura),
      pacienteNombre: paciente ? paciente.nombre : '',
      pacienteDni: paciente ? paciente.dni : '',
      pacienteTelefono: paciente ? paciente.telefono : '',
      pacienteDireccion: paciente ? paciente.direccion : ''
    };
  });

  return responderJson_({
    ok: true,
    historias: resultado
  });
}


function getPacientesSinHistoria_(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const shPacientes = ss.getSheetByName('Pacientes');
  const shHistorias = ss.getSheetByName('Historias');

  const pacientes = leerTabla_(shPacientes);
  const historias = leerTabla_(shHistorias);

  const idsConHistoria = historias.map(h => String(h.idPaciente));

  const pacientesSinHistoria = pacientes
    .filter(p => !idsConHistoria.includes(String(p.idPaciente)))
    .map(p => ({
      idPaciente: p.idPaciente || '',
      nombre: p.nombre || '',
      dni: p.dni || '',
      direccion: p.direccion || '',
      telefono: p.telefono || '',
      fechaNacimiento: formatearFecha_(p.fechaNacimiento || p.fecha || '')
    }));

  return responderJson_({
    ok: true,
    pacientes: pacientesSinHistoria
  });
}


function crearHistoria_(e) {
  const idPaciente = obtenerParametro_(e, 'idPaciente');

  if (!idPaciente) {
    return responderJson_({
      ok: false,
      mensaje: 'Falta el idPaciente.'
    });
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const shPacientes = ss.getSheetByName('Pacientes');
  const shHistorias = ss.getSheetByName('Historias');

  const pacientes = leerTabla_(shPacientes);
  const historias = leerTabla_(shHistorias);

  const pacienteExiste = pacientes.some(p =>
    String(p.idPaciente) === String(idPaciente)
  );

  if (!pacienteExiste) {
    return responderJson_({
      ok: false,
      mensaje: 'El paciente no existe.'
    });
  }

  const yaTieneHistoria = historias.some(h =>
    String(h.idPaciente) === String(idPaciente)
  );

  if (yaTieneHistoria) {
    return responderJson_({
      ok: false,
      mensaje: 'Este paciente ya tiene una historia clínica.'
    });
  }

  const nuevoId = obtenerSiguienteId_(shHistorias, 'idHistoria');

  const fechaActual = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );

  shHistorias.appendRow([
    nuevoId,
    idPaciente,
    fechaActual
  ]);

  return responderJson_({
    ok: true,
    mensaje: 'Historia clínica creada correctamente.',
    historia: {
      idHistoria: nuevoId,
      idPaciente: idPaciente,
      fechaApertura: fechaActual
    }
  });
}


function buscarHistorialPaciente_(e) {
  const texto = obtenerParametro_(e, 'texto');

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const shPacientes = ss.getSheetByName('Pacientes');
  const shHistorias = ss.getSheetByName('Historias');
  const shCitas = ss.getSheetByName('Citas');

  const pacientes = leerTabla_(shPacientes);
  const historias = leerTabla_(shHistorias);
  const citas = leerTabla_(shCitas);

  const busqueda = normalizarTexto_(texto || '');

  let pacientesFiltrados = pacientes;

  if (busqueda) {
    pacientesFiltrados = pacientes.filter(p => {
      const idPaciente = normalizarTexto_(p.idPaciente);
      const nombre = normalizarTexto_(p.nombre);
      const dni = normalizarTexto_(p.dni);

      return idPaciente.includes(busqueda) ||
             nombre.includes(busqueda) ||
             dni.includes(busqueda);
    });
  }

  const resultado = pacientesFiltrados.map(paciente => {
    const historia = historias.find(h =>
      String(h.idPaciente) === String(paciente.idPaciente)
    );

    const citasPaciente = citas
      .filter(c => String(c.idPaciente) === String(paciente.idPaciente))
      .map(c => ({
        idCita: c.idCita || '',
        idHistoria: c.idHistoria || '',
        idMedico: c.idMedico || '',
        fecha: formatearFecha_(c.fecha),
        hora: formatearHora_(c.hora),
        estado: c.estado || '',
        motivoConsulta: c.motivoConsulta || '',
        observaciones: c.observaciones || ''
      }));

    return {
      idPaciente: paciente.idPaciente || '',
      nombre: paciente.nombre || '',
      dni: paciente.dni || '',
      direccion: paciente.direccion || '',
      telefono: paciente.telefono || '',
      fechaNacimiento: formatearFecha_(paciente.fechaNacimiento || paciente.fecha || ''),
      tieneHistoria: historia ? true : false,
      idHistoria: historia ? historia.idHistoria : '',
      fechaApertura: historia ? formatearFecha_(historia.fechaApertura) : '',
      citas: citasPaciente
    };
  });

  return responderJson_({
    ok: true,
    pacientes: resultado
  });
}

function leerTabla_(hoja) {
  const datos = hoja.getDataRange().getValues();

  if (datos.length <= 1) {
    return [];
  }

  const cabeceras = datos[0];

  return datos.slice(1).map(fila => {
    const obj = {};

    cabeceras.forEach((cabecera, index) => {
      obj[cabecera] = fila[index];
    });

    return obj;
  });
}


function obtenerSiguienteId_(hoja, nombreColumnaId) {
  const datos = hoja.getDataRange().getValues();

  if (datos.length <= 1) {
    return 1;
  }

  const cabeceras = datos[0];
  const indexId = cabeceras.indexOf(nombreColumnaId);

  if (indexId === -1) {
    return datos.length;
  }

  const ids = datos
    .slice(1)
    .map(fila => Number(fila[indexId]))
    .filter(id => !isNaN(id));

  if (ids.length === 0) {
    return 1;
  }

  return Math.max(...ids) + 1;
}


function obtenerParametro_(e, nombre) {
  if (e && e.parameter && e.parameter[nombre] !== undefined) {
    return e.parameter[nombre];
  }

  if (e && e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      return body[nombre];
    } catch (error) {
      return '';
    }
  }

  return '';
}


function responderJson_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


function normalizarTexto_(valor) {
  return String(valor || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}


function formatearFecha_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd'
    );
  }

  return String(valor);
}


function formatearHora_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      'HH:mm'
    );
  }

  return String(valor);
}