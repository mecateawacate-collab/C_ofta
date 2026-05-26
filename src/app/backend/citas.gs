function getCitas_(e) {
  var hoja = getSheet_('Citas');
  var datos = hoja.getDataRange().getValues();

  if (datos.length <= 1) {
    return json_({
      success: true,
      citas: []
    });
  }

  var citas = [];

  for (var i = 1; i < datos.length; i++) {
    citas.push({
      idCita: datos[i][0],
      idPaciente: datos[i][1],
      idHistoria: datos[i][2],
      idMedico: datos[i][3],
      fecha: formatearFechaCita_(datos[i][4]),
      hora: formatearHoraCita_(datos[i][5]),
      estado: datos[i][6],
      motivoConsulta: datos[i][7],
      observaciones: datos[i][8]
    });
  }

  return json_({
    success: true,
    citas: citas
  });
}

function crearCita_(e) {
  var hoja = getSheet_('Citas');

  var idPaciente = getParam_(e, 'idPaciente');
  var idHistoria = getParam_(e, 'idHistoria');
  var idMedico = getParam_(e, 'idMedico');
  var fecha = getParam_(e, 'fecha');
  var hora = getParam_(e, 'hora');
  var motivoConsulta = getParam_(e, 'motivoConsulta');
  var observaciones = getParam_(e, 'observaciones');

  if (!idPaciente || !idHistoria || !idMedico || !fecha || !hora || !motivoConsulta) {
    return json_({
      success: false,
      message: 'Complete historia, médico, fecha, hora y motivo de consulta.'
    });
  }

  var idCita = generarIdCita_();

  hoja.appendRow([
    idCita,
    idPaciente,
    idHistoria,
    idMedico,
    fecha,
    hora,
    'Pendiente',
    motivoConsulta,
    observaciones || ''
  ]);

  return json_({
    success: true,
    message: 'Cita registrada correctamente.',
    cita: {
      idCita: Number(idCita),
      idPaciente: Number(idPaciente),
      idHistoria: Number(idHistoria),
      idMedico: Number(idMedico),
      fecha: fecha,
      hora: hora,
      estado: 'Pendiente',
      motivoConsulta: motivoConsulta,
      observaciones: observaciones || ''
    }
  });
}

function actualizarEstadoCita_(e) {
  var hoja = getSheet_('Citas');
  var idCita = getParam_(e, 'idCita');
  var estado = getParam_(e, 'estado');

  if (!idCita || !estado) {
    return json_({
      success: false,
      message: 'Faltan datos para actualizar la cita.'
    });
  }

  var fila = buscarFilaCita_(idCita);

  if (fila === -1) {
    return json_({
      success: false,
      message: 'No se encontró la cita.'
    });
  }

  hoja.getRange(fila, 7).setValue(estado);

  if (estado === 'Confirmada') {
    crearPagoPendientePorCita_(idCita);
  }

  if (estado === 'Cancelada') {
    anularPagoPendientePorCita_(idCita);
  }

  return json_({
    success: true,
    message: 'Estado actualizado correctamente.'
  });
}

function reprogramarCita_(e) {
  var hoja = getSheet_('Citas');
  var idCita = getParam_(e, 'idCita');
  var fecha = getParam_(e, 'fecha');
  var hora = getParam_(e, 'hora');

  if (!idCita || !fecha || !hora) {
    return json_({
      success: false,
      message: 'Faltan datos para reprogramar la cita.'
    });
  }

  var fila = buscarFilaCita_(idCita);

  if (fila === -1) {
    return json_({
      success: false,
      message: 'No se encontró la cita.'
    });
  }

  hoja.getRange(fila, 5).setValue(fecha);
  hoja.getRange(fila, 6).setValue(hora);
  hoja.getRange(fila, 7).setValue('Pendiente');

  return json_({
    success: true,
    message: 'Cita reprogramada correctamente.'
  });
}

function eliminarCita_(e) {
  var hoja = getSheet_('Citas');
  var idCita = getParam_(e, 'idCita');

  if (!idCita) {
    return json_({
      success: false,
      message: 'Falta el ID de la cita.'
    });
  }

  var fila = buscarFilaCita_(idCita);

  if (fila === -1) {
    return json_({
      success: false,
      message: 'No se encontró la cita.'
    });
  }

  hoja.deleteRow(fila);

  return json_({
    success: true,
    message: 'Cita eliminada correctamente.'
  });
}

function getHistoriasCita_(e) {
  var hojaHistorias = getSheet_('Historias');
  var hojaPacientes = getSheet_('Pacientes');

  var historiasDatos = hojaHistorias.getDataRange().getValues();
  var pacientesDatos = hojaPacientes.getDataRange().getValues();

  var pacientes = {};

  for (var i = 1; i < pacientesDatos.length; i++) {
    pacientes[String(pacientesDatos[i][0])] = {
      idPaciente: pacientesDatos[i][0],
      nombre: pacientesDatos[i][1],
      dni: pacientesDatos[i][2],
      direccion: pacientesDatos[i][3],
      telefono: pacientesDatos[i][4],
      fechaNacimiento: formatearFechaCita_(pacientesDatos[i][5])
    };
  }

  var historias = [];

  for (var j = 1; j < historiasDatos.length; j++) {
    var idPaciente = String(historiasDatos[j][1]);
    var paciente = pacientes[idPaciente];

    if (paciente) {
      historias.push({
        idHistoria: historiasDatos[j][0],
        idPaciente: historiasDatos[j][1],
        fechaApertura: formatearFechaCita_(historiasDatos[j][2]),
        nombrePaciente: paciente.nombre,
        dniPaciente: paciente.dni,
        telefonoPaciente: paciente.telefono
      });
    }
  }

  return json_({
    success: true,
    historias: historias
  });
}

function getMedicosCita_(e) {
  var hojaMedicos = getSheet_('Medicos');
  var hojaUsuarios = getSheet_('Usuarios');

  var medicosDatos = hojaMedicos.getDataRange().getValues();
  var usuariosDatos = hojaUsuarios.getDataRange().getValues();

  var usuarios = {};

  for (var i = 1; i < usuariosDatos.length; i++) {
    usuarios[String(usuariosDatos[i][0])] = {
      idUsuario: usuariosDatos[i][0],
      nombre: usuariosDatos[i][1],
      correo: usuariosDatos[i][2],
      rol: usuariosDatos[i][4]
    };
  }

  var medicos = [];

  for (var j = 1; j < medicosDatos.length; j++) {
    var idUsuario = String(medicosDatos[j][1]);
    var usuario = usuarios[idUsuario];

    if (usuario && usuario.rol === 'Medico') {
      medicos.push({
        idMedico: medicosDatos[j][0],
        idUsuario: medicosDatos[j][1],
        nombre: usuario.nombre,
        correo: usuario.correo,
        especialidad: medicosDatos[j][2],
        telefono: medicosDatos[j][3]
      });
    }
  }

  return json_({
    success: true,
    medicos: medicos
  });
}

function generarIdCita_() {
  var hoja = getSheet_('Citas');
  var ultimaFila = hoja.getLastRow();

  if (ultimaFila <= 1) {
    return 1;
  }

  var ids = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();
  var mayor = 0;

  for (var i = 0; i < ids.length; i++) {
    var id = Number(ids[i][0]);

    if (id > mayor) {
      mayor = id;
    }
  }

  return mayor + 1;
}

function buscarFilaCita_(idCita) {
  var hoja = getSheet_('Citas');
  var datos = hoja.getDataRange().getValues();

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]) === String(idCita)) {
      return i + 1;
    }
  }

  return -1;
}

function formatearFechaCita_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  return String(valor);
}

function formatearHoraCita_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  }

  return String(valor);
}