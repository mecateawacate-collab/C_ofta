function buscarReportePaciente_(e) {
  var busqueda = normalizarTextoReporte_(getParam_(e, 'busqueda'));

  if (!busqueda) {
    return json_({
      success: false,
      message: 'Ingrese ID, DNI o nombre del paciente.'
    });
  }

  var hojaPacientes = getSheet_('Pacientes');
  var pacientes = hojaPacientes.getDataRange().getValues();
  var paciente = null;

  for (var i = 1; i < pacientes.length; i++) {
    var idPaciente = String(pacientes[i][0] || '').trim();
    var nombre = String(pacientes[i][1] || '').trim();
    var dni = String(pacientes[i][2] || '').trim();

    var idNormalizado = normalizarTextoReporte_(idPaciente);
    var nombreNormalizado = normalizarTextoReporte_(nombre);
    var dniNormalizado = normalizarTextoReporte_(dni);

    if (idNormalizado === busqueda || dniNormalizado === busqueda || nombreNormalizado.indexOf(busqueda) !== -1) {
      paciente = {
        idPaciente: idPaciente,
        nombre: nombre,
        dni: dni,
        direccion: String(pacientes[i][3] || ''),
        telefono: String(pacientes[i][4] || ''),
        fechaNacimiento: formatearFechaReporte_(pacientes[i][5])
      };
      break;
    }
  }

  if (!paciente) {
    return json_({
      success: false,
      message: 'No se encontró el paciente.'
    });
  }

  var historias = obtenerHistoriasReporte_(paciente.idPaciente);
  var citas = obtenerCitasReporte_(paciente.idPaciente);
  var pagos = obtenerPagosReporte_(citas);
  var consultas = obtenerConsultasReporte_(historias);
  var examenes = obtenerExamenesReporte_(consultas);

  return json_({
    success: true,
    message: 'Reporte encontrado correctamente.',
    data: {
      paciente: paciente,
      historias: historias,
      citas: citas,
      pagos: pagos,
      consultas: consultas,
      examenes: examenes
    }
  });
}

function registrarReporte_(e) {
  var hoja = getSheet_('Reportes');

  prepararFormatoReportes_(hoja);

  var idReporte = obtenerSiguienteIdReporte_(hoja);
  var idUsuario = getParam_(e, 'idUsuario') || '';
  var nombreUsuario = getParam_(e, 'nombreUsuario') || 'Usuario del sistema';
  var tipoReporte = getParam_(e, 'tipoReporte') || 'Historia clínica del paciente';
  var formato = getParam_(e, 'formato') || 'PDF';
  var fechaGeneracion = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  hoja.appendRow([
    Number(idReporte),
    idUsuario,
    nombreUsuario,
    tipoReporte,
    fechaGeneracion,
    formato
  ]);

  return json_({
    success: true,
    message: 'Reporte registrado correctamente.',
    idReporte: idReporte
  });
}

function obtenerHistoriasReporte_(idPacienteBuscado) {
  var hoja = getSheet_('Historias');
  var datos = hoja.getDataRange().getValues();
  var historias = [];

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][1]) === String(idPacienteBuscado)) {
      historias.push({
        idHistoria: datos[i][0],
        idPaciente: datos[i][1],
        fechaApertura: formatearFechaReporte_(datos[i][2])
      });
    }
  }

  return historias;
}

function obtenerCitasReporte_(idPacienteBuscado) {
  var hoja = getSheet_('Citas');
  var datos = hoja.getDataRange().getValues();
  var citas = [];

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][1]) === String(idPacienteBuscado)) {
      citas.push({
        idCita: datos[i][0],
        idPaciente: datos[i][1],
        idHistoria: datos[i][2],
        idMedico: datos[i][3],
        fecha: formatearFechaReporte_(datos[i][4]),
        hora: formatearHoraReporte_(datos[i][5]),
        estado: datos[i][6],
        motivoConsulta: datos[i][7],
        observaciones: datos[i][8]
      });
    }
  }

  return citas;
}

function obtenerPagosReporte_(citas) {
  var hoja = getSheet_('Pagos');
  var datos = hoja.getDataRange().getValues();
  var mapaCitas = {};
  var pagos = [];

  for (var i = 0; i < citas.length; i++) {
    mapaCitas[String(citas[i].idCita)] = true;
  }

  for (var j = 1; j < datos.length; j++) {
    if (mapaCitas[String(datos[j][1])]) {
      pagos.push({
        idPago: datos[j][0],
        idCita: datos[j][1],
        monto: datos[j][2],
        fechaPago: formatearFechaReporte_(datos[j][3]),
        estado: datos[j][4],
        comprobante: datos[j][5]
      });
    }
  }

  return pagos;
}

function obtenerConsultasReporte_(historias) {
  var hoja = getSheet_('Consultas');
  var datos = hoja.getDataRange().getValues();
  var mapaHistorias = {};
  var consultas = [];

  for (var i = 0; i < historias.length; i++) {
    mapaHistorias[String(historias[i].idHistoria)] = true;
  }

  for (var j = 1; j < datos.length; j++) {
    if (mapaHistorias[String(datos[j][1])]) {
      consultas.push({
        idConsulta: datos[j][0],
        idHistoria: datos[j][1],
        idCita: datos[j][2],
        idMedico: datos[j][3],
        fechaConsulta: formatearFechaReporte_(datos[j][4]),
        diagnosticoVisual: datos[j][5],
        agudezaVisual: datos[j][6],
        tratamiento: datos[j][7],
        receta: datos[j][8],
        observaciones: datos[j][9]
      });
    }
  }

  return consultas;
}

function obtenerExamenesReporte_(consultas) {
  var hoja = getSheet_('Examenes');
  var datos = hoja.getDataRange().getValues();
  var mapaConsultas = {};
  var examenes = [];

  for (var i = 0; i < consultas.length; i++) {
    mapaConsultas[String(consultas[i].idConsulta)] = true;
  }

  for (var j = 1; j < datos.length; j++) {
    if (mapaConsultas[String(datos[j][1])]) {
      examenes.push({
        idExamen: datos[j][0],
        idConsulta: datos[j][1],
        tipoExamen: datos[j][2],
        resultado: datos[j][3],
        fecha: formatearFechaReporte_(datos[j][4]),
        archivoAdjunto: datos[j][5]
      });
    }
  }

  return examenes;
}

function prepararFormatoReportes_(hoja) {
  hoja.getRange('A:B').setNumberFormat('0');
  hoja.getRange('C:D').setNumberFormat('@');
  hoja.getRange('E:E').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  hoja.getRange('F:F').setNumberFormat('@');
}

function obtenerSiguienteIdReporte_(hoja) {
  var ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return 1;
  }

  var valores = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();
  var mayor = 0;

  for (var i = 0; i < valores.length; i++) {
    var numero = Number(valores[i][0]);

    if (!isNaN(numero) && numero > mayor) {
      mayor = numero;
    }
  }

  return mayor + 1;
}

function normalizarTextoReporte_(valor) {
  return String(valor || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatearFechaReporte_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  return String(valor);
}

function formatearHoraReporte_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  }

  return String(valor);
}
