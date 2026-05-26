function getExamenes_(e) {
  var hojaExamenes = getSheet_('Examenes');
  var datos = hojaExamenes.getDataRange().getValues();
  var consultas = mapaConsultasParaExamen_();
  var examenes = [];

  for (var i = 1; i < datos.length; i++) {
    var idConsulta = String(datos[i][1]);
    var consulta = consultas[idConsulta] || {};

    examenes.push({
      idExamen: Number(datos[i][0]),
      idConsulta: Number(datos[i][1]),
      tipoExamen: datos[i][2] || '',
      resultado: datos[i][3] || '',
      fecha: formatearFechaExamen_(datos[i][4]),
      archivoAdjunto: datos[i][5] || '',
      nombrePaciente: consulta.nombrePaciente || '',
      dniPaciente: consulta.dniPaciente || '',
      fechaConsulta: consulta.fechaConsulta || '',
      diagnosticoVisual: consulta.diagnosticoVisual || ''
    });
  }

  return json_({
    success: true,
    examenes: examenes
  });
}

function getConsultasExamen_(e) {
  var mapa = mapaConsultasParaExamen_();
  var consultas = [];

  for (var id in mapa) {
    consultas.push(mapa[id]);
  }

  consultas.sort(function(a, b) {
    return Number(b.idConsulta) - Number(a.idConsulta);
  });

  return json_({
    success: true,
    consultas: consultas
  });
}

function registrarExamen_(e) {
  var hoja = getSheet_('Examenes');
  prepararFormatoExamenes_(hoja);

  var idConsulta = getParam_(e, 'idConsulta');
  var tipoExamen = String(getParam_(e, 'tipoExamen') || '').trim();
  var resultado = String(getParam_(e, 'resultado') || '').trim();
  var fecha = String(getParam_(e, 'fecha') || '').trim();
  var archivoAdjunto = String(getParam_(e, 'archivoAdjunto') || '').trim();

  if (!idConsulta || !tipoExamen || !resultado || !fecha) {
    return json_({
      success: false,
      message: 'Complete consulta, tipo de examen, resultado y fecha.'
    });
  }

  var consulta = buscarConsultaExamen_(idConsulta);

  if (!consulta) {
    return json_({
      success: false,
      message: 'No se encontró la consulta seleccionada.'
    });
  }

  var idExamen = generarIdExamen_();

  hoja.appendRow([
    Number(idExamen),
    Number(idConsulta),
    tipoExamen,
    resultado,
    fecha,
    archivoAdjunto
  ]);

  var fila = hoja.getLastRow();
  hoja.getRange(fila, 1, 1, 2).setNumberFormat('0');
  hoja.getRange(fila, 3, 1, 2).setNumberFormat('@');
  hoja.getRange(fila, 5).setNumberFormat('yyyy-mm-dd');
  hoja.getRange(fila, 6).setNumberFormat('@');

  return json_({
    success: true,
    message: 'Examen registrado correctamente.',
    idExamen: Number(idExamen)
  });
}

function eliminarExamen_(e) {
  var hoja = getSheet_('Examenes');
  var idExamen = getParam_(e, 'idExamen');

  if (!idExamen) {
    return json_({
      success: false,
      message: 'Falta el ID del examen.'
    });
  }

  var fila = buscarFilaExamen_(idExamen);

  if (fila === -1) {
    return json_({
      success: false,
      message: 'No se encontró el examen.'
    });
  }

  hoja.deleteRow(fila);

  return json_({
    success: true,
    message: 'Examen eliminado correctamente.'
  });
}

function mapaConsultasParaExamen_() {
  var hojaConsultas = getSheet_('Consultas');
  var hojaHistorias = getSheet_('Historias');
  var hojaPacientes = getSheet_('Pacientes');
  var hojaMedicos = getSheet_('Medicos');
  var hojaUsuarios = getSheet_('Usuarios');

  var consultasDatos = hojaConsultas.getDataRange().getValues();
  var historiasDatos = hojaHistorias.getDataRange().getValues();
  var pacientesDatos = hojaPacientes.getDataRange().getValues();
  var medicosDatos = hojaMedicos.getDataRange().getValues();
  var usuariosDatos = hojaUsuarios.getDataRange().getValues();

  var pacientes = {};
  var historias = {};
  var usuarios = {};
  var medicos = {};
  var consultas = {};

  for (var i = 1; i < pacientesDatos.length; i++) {
    pacientes[String(pacientesDatos[i][0])] = {
      idPaciente: pacientesDatos[i][0],
      nombre: pacientesDatos[i][1] || '',
      dni: pacientesDatos[i][2] || ''
    };
  }

  for (var j = 1; j < historiasDatos.length; j++) {
    historias[String(historiasDatos[j][0])] = {
      idHistoria: historiasDatos[j][0],
      idPaciente: historiasDatos[j][1]
    };
  }

  for (var k = 1; k < usuariosDatos.length; k++) {
    usuarios[String(usuariosDatos[k][0])] = {
      idUsuario: usuariosDatos[k][0],
      nombre: usuariosDatos[k][1] || ''
    };
  }

  for (var m = 1; m < medicosDatos.length; m++) {
    var usuario = usuarios[String(medicosDatos[m][1])] || {};
    medicos[String(medicosDatos[m][0])] = {
      idMedico: medicosDatos[m][0],
      nombre: usuario.nombre || 'Médico no encontrado'
    };
  }

  for (var c = 1; c < consultasDatos.length; c++) {
    var idConsulta = consultasDatos[c][0];
    var idHistoria = consultasDatos[c][1];
    var idMedico = consultasDatos[c][3];
    var historia = historias[String(idHistoria)] || {};
    var paciente = pacientes[String(historia.idPaciente)] || {};
    var medico = medicos[String(idMedico)] || {};

    consultas[String(idConsulta)] = {
      idConsulta: Number(idConsulta),
      idHistoria: Number(idHistoria),
      idCita: Number(consultasDatos[c][2]),
      idMedico: Number(idMedico),
      fechaConsulta: formatearFechaExamen_(consultasDatos[c][4]),
      diagnosticoVisual: consultasDatos[c][5] || '',
      agudezaVisual: consultasDatos[c][6] || '',
      tratamiento: consultasDatos[c][7] || '',
      receta: consultasDatos[c][8] || '',
      observaciones: consultasDatos[c][9] || '',
      nombrePaciente: paciente.nombre || '',
      dniPaciente: paciente.dni || '',
      nombreMedico: medico.nombre || ''
    };
  }

  return consultas;
}

function buscarConsultaExamen_(idConsulta) {
  var mapa = mapaConsultasParaExamen_();
  return mapa[String(idConsulta)] || null;
}

function generarIdExamen_() {
  var hoja = getSheet_('Examenes');
  var ultimaFila = hoja.getLastRow();

  if (ultimaFila <= 1) {
    return 1;
  }

  var ids = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();
  var mayor = 0;

  for (var i = 0; i < ids.length; i++) {
    var id = Number(ids[i][0]);

    if (!isNaN(id) && id > mayor) {
      mayor = id;
    }
  }

  return mayor + 1;
}

function buscarFilaExamen_(idExamen) {
  var hoja = getSheet_('Examenes');
  var datos = hoja.getDataRange().getValues();

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]) === String(idExamen)) {
      return i + 1;
    }
  }

  return -1;
}

function prepararFormatoExamenes_(hoja) {
  hoja.getRange('A:B').setNumberFormat('0');
  hoja.getRange('C:D').setNumberFormat('@');
  hoja.getRange('E:E').setNumberFormat('yyyy-mm-dd');
  hoja.getRange('F:F').setNumberFormat('@');
}

function formatearFechaExamen_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  return String(valor);
}
