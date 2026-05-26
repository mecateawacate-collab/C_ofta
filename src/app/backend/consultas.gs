function getConsultas_(e) {
  var hojaConsultas = getSheet_('Consultas');
  var hojaHistorias = getSheet_('Historias');
  var hojaPacientes = getSheet_('Pacientes');
  var hojaMedicos = getSheet_('Medicos');
  var hojaUsuarios = getSheet_('Usuarios');

  prepararFormatoConsultas_(hojaConsultas);

  var consultasDatos = hojaConsultas.getDataRange().getValues();
  var historiasMapa = crearMapaHistoriasConsulta_(hojaHistorias);
  var pacientesMapa = crearMapaPacientesConsulta_(hojaPacientes);
  var medicosMapa = crearMapaMedicosConsulta_(hojaMedicos, hojaUsuarios);
  var consultas = [];

  for (var i = 1; i < consultasDatos.length; i++) {
    var idHistoria = consultasDatos[i][1];
    var idMedico = consultasDatos[i][3];
    var historia = historiasMapa[String(idHistoria)];
    var paciente = historia ? pacientesMapa[String(historia.idPaciente)] : null;
    var medico = medicosMapa[String(idMedico)] || null;

    consultas.push({
      idConsulta: Number(consultasDatos[i][0]),
      idHistoria: Number(idHistoria),
      idCita: Number(consultasDatos[i][2]),
      idMedico: Number(idMedico),
      fechaConsulta: formatearFechaConsulta_(consultasDatos[i][4]),
      diagnosticoVisual: String(consultasDatos[i][5] || ''),
      agudezaVisual: String(consultasDatos[i][6] || ''),
      tratamiento: String(consultasDatos[i][7] || ''),
      receta: String(consultasDatos[i][8] || ''),
      observaciones: String(consultasDatos[i][9] || ''),
      nombrePaciente: paciente ? paciente.nombre : '',
      dniPaciente: paciente ? paciente.dni : '',
      nombreMedico: medico ? medico.nombre : ''
    });
  }

  return json_({
    success: true,
    consultas: consultas
  });
}

function getCitasPagadasConsulta_(e) {
  var hojaCitas = getSheet_('Citas');
  var hojaConsultas = getSheet_('Consultas');
  var hojaHistorias = getSheet_('Historias');
  var hojaPacientes = getSheet_('Pacientes');
  var hojaMedicos = getSheet_('Medicos');
  var hojaUsuarios = getSheet_('Usuarios');

  var citasDatos = hojaCitas.getDataRange().getValues();
  var consultasDatos = hojaConsultas.getDataRange().getValues();
  var historiasMapa = crearMapaHistoriasConsulta_(hojaHistorias);
  var pacientesMapa = crearMapaPacientesConsulta_(hojaPacientes);
  var medicosMapa = crearMapaMedicosConsulta_(hojaMedicos, hojaUsuarios);
  var citasConConsulta = {};
  var citas = [];

  for (var c = 1; c < consultasDatos.length; c++) {
    citasConConsulta[String(consultasDatos[c][2])] = true;
  }

  for (var i = 1; i < citasDatos.length; i++) {
    var idCita = citasDatos[i][0];
    var estado = normalizarTextoConsulta_(citasDatos[i][6]);

    if (estado !== 'pagada') {
      continue;
    }

    if (citasConConsulta[String(idCita)]) {
      continue;
    }

    var idHistoria = citasDatos[i][2];
    var idMedico = citasDatos[i][3];
    var historia = historiasMapa[String(idHistoria)];
    var paciente = historia ? pacientesMapa[String(historia.idPaciente)] : null;
    var medico = medicosMapa[String(idMedico)] || null;

    citas.push({
      idCita: Number(idCita),
      idPaciente: Number(citasDatos[i][1]),
      idHistoria: Number(idHistoria),
      idMedico: Number(idMedico),
      fecha: formatearFechaConsulta_(citasDatos[i][4]),
      hora: formatearHoraConsulta_(citasDatos[i][5]),
      estado: String(citasDatos[i][6] || ''),
      motivoConsulta: String(citasDatos[i][7] || ''),
      observaciones: String(citasDatos[i][8] || ''),
      nombrePaciente: paciente ? paciente.nombre : 'Paciente no encontrado',
      dniPaciente: paciente ? paciente.dni : '',
      nombreMedico: medico ? medico.nombre : 'Médico no encontrado'
    });
  }

  return json_({
    success: true,
    citas: citas
  });
}

function registrarConsulta_(e) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    var idCita = getParam_(e, 'idCita');
    var idHistoria = getParam_(e, 'idHistoria');
    var idMedico = getParam_(e, 'idMedico');
    var fechaConsulta = String(getParam_(e, 'fechaConsulta') || '').trim();
    var diagnosticoVisual = String(getParam_(e, 'diagnosticoVisual') || '').trim();
    var agudezaVisual = String(getParam_(e, 'agudezaVisual') || '').trim();
    var tratamiento = String(getParam_(e, 'tratamiento') || '').trim();
    var receta = String(getParam_(e, 'receta') || '').trim();
    var observaciones = String(getParam_(e, 'observaciones') || '').trim();

    if (!idCita || !idHistoria || !idMedico || !fechaConsulta || !diagnosticoVisual || !agudezaVisual || !tratamiento || !receta) {
      return json_({
        success: false,
        message: 'Complete cita, fecha, diagnóstico, agudeza visual, tratamiento y receta.'
      });
    }

    var hojaConsultas = getSheet_('Consultas');
    var hojaCitas = getSheet_('Citas');

    prepararFormatoConsultas_(hojaConsultas);

    var filaCita = buscarFilaCitaConsulta_(hojaCitas, idCita);

    if (filaCita === -1) {
      return json_({
        success: false,
        message: 'No se encontró la cita.'
      });
    }

    var estadoCita = normalizarTextoConsulta_(hojaCitas.getRange(filaCita, 7).getValue());

    if (estadoCita !== 'pagada') {
      return json_({
        success: false,
        message: 'Solo se pueden registrar consultas de citas pagadas.'
      });
    }

    if (existeConsultaParaCita_(hojaConsultas, idCita)) {
      return json_({
        success: false,
        message: 'Esta cita ya tiene una consulta registrada.'
      });
    }

    var idConsulta = generarIdConsulta_(hojaConsultas);

    hojaConsultas.appendRow([
      Number(idConsulta),
      Number(idHistoria),
      Number(idCita),
      Number(idMedico),
      fechaConsulta,
      diagnosticoVisual,
      agudezaVisual,
      tratamiento,
      receta,
      observaciones
    ]);

    var filaConsulta = hojaConsultas.getLastRow();
    hojaConsultas.getRange(filaConsulta, 1, 1, 4).setNumberFormat('0');
    hojaConsultas.getRange(filaConsulta, 5).setNumberFormat('yyyy-mm-dd');
    hojaConsultas.getRange(filaConsulta, 6, 1, 5).setNumberFormat('@');

    hojaCitas.getRange(filaCita, 7).setValue('Atendida');

    return json_({
      success: true,
      message: 'Consulta registrada correctamente. La cita pasó a Atendida.',
      consulta: {
        idConsulta: Number(idConsulta),
        idHistoria: Number(idHistoria),
        idCita: Number(idCita),
        idMedico: Number(idMedico),
        fechaConsulta: fechaConsulta,
        diagnosticoVisual: diagnosticoVisual,
        agudezaVisual: agudezaVisual,
        tratamiento: tratamiento,
        receta: receta,
        observaciones: observaciones
      }
    });
  } catch (error) {
    return json_({
      success: false,
      message: error && error.message ? error.message : String(error)
    });
  } finally {
    lock.releaseLock();
  }
}

function prepararFormatoConsultas_(hoja) {
  hoja.getRange('A:D').setNumberFormat('0');
  hoja.getRange('E:E').setNumberFormat('yyyy-mm-dd');
  hoja.getRange('F:J').setNumberFormat('@');
}

function generarIdConsulta_(hoja) {
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

function existeConsultaParaCita_(hoja, idCita) {
  var ultimaFila = hoja.getLastRow();

  if (ultimaFila <= 1) {
    return false;
  }

  var datos = hoja.getRange(2, 3, ultimaFila - 1, 1).getValues();

  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][0]) === String(idCita)) {
      return true;
    }
  }

  return false;
}

function buscarFilaCitaConsulta_(hoja, idCita) {
  var datos = hoja.getDataRange().getValues();

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]) === String(idCita)) {
      return i + 1;
    }
  }

  return -1;
}

function crearMapaHistoriasConsulta_(hoja) {
  var datos = hoja.getDataRange().getValues();
  var mapa = {};

  for (var i = 1; i < datos.length; i++) {
    mapa[String(datos[i][0])] = {
      idHistoria: datos[i][0],
      idPaciente: datos[i][1],
      fechaApertura: datos[i][2]
    };
  }

  return mapa;
}

function crearMapaPacientesConsulta_(hoja) {
  var datos = hoja.getDataRange().getValues();
  var mapa = {};

  for (var i = 1; i < datos.length; i++) {
    mapa[String(datos[i][0])] = {
      idPaciente: datos[i][0],
      nombre: datos[i][1],
      dni: datos[i][2],
      direccion: datos[i][3],
      telefono: datos[i][4],
      fechaNacimiento: datos[i][5]
    };
  }

  return mapa;
}

function crearMapaMedicosConsulta_(hojaMedicos, hojaUsuarios) {
  var medicosDatos = hojaMedicos.getDataRange().getValues();
  var usuariosDatos = hojaUsuarios.getDataRange().getValues();
  var usuarios = {};
  var medicos = {};

  for (var i = 1; i < usuariosDatos.length; i++) {
    usuarios[String(usuariosDatos[i][0])] = {
      idUsuario: usuariosDatos[i][0],
      nombre: usuariosDatos[i][1],
      correo: usuariosDatos[i][2],
      rol: usuariosDatos[i][4]
    };
  }

  for (var j = 1; j < medicosDatos.length; j++) {
    var idMedico = String(medicosDatos[j][0]);
    var idUsuario = String(medicosDatos[j][1]);
    var usuario = usuarios[idUsuario];

    medicos[idMedico] = {
      idMedico: medicosDatos[j][0],
      idUsuario: medicosDatos[j][1],
      nombre: usuario ? usuario.nombre : 'Médico',
      especialidad: medicosDatos[j][2],
      telefono: medicosDatos[j][3]
    };
  }

  return medicos;
}

function normalizarTextoConsulta_(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function formatearFechaConsulta_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  return String(valor);
}

function formatearHoraConsulta_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  }

  return String(valor);
}
