function solicitarCita_(e) {
  var lock = LockService.getScriptLock();
  var bloqueoTomado = false;

  try {
    lock.waitLock(30000);
    bloqueoTomado = true;

    var nombre = String(getParam_(e, 'nombre') || '').trim();
    var dni = limpiarDni_(getParam_(e, 'dni'));
    var direccion = String(getParam_(e, 'direccion') || '').trim();
    var telefono = String(getParam_(e, 'telefono') || '').trim();
    var fechaNacimiento = String(getParam_(e, 'fechaNacimiento') || '').trim();
    var fecha = String(getParam_(e, 'fecha') || '').trim();
    var hora = String(getParam_(e, 'hora') || '').trim();
    var motivoConsulta = String(getParam_(e, 'motivoConsulta') || '').trim();
    var observaciones = String(getParam_(e, 'observaciones') || '').trim();

    if (!nombre || !dni || !direccion || !telefono || !fechaNacimiento || !fecha || !hora || !motivoConsulta) {
      return responderJson_({
        ok: false,
        mensaje: 'Faltan datos obligatorios.'
      });
    }

    if (dni.length !== 8) {
      return responderJson_({
        ok: false,
        mensaje: 'El DNI debe tener 8 dígitos.'
      });
    }

    var hojaPacientes = getSheet_('Pacientes');
    var hojaHistorias = getSheet_('Historias');
    var hojaCitas = getSheet_('Citas');

    prepararFormatoPacientes_(hojaPacientes);
    prepararFormatoHistorias_(hojaHistorias);
    prepararFormatoCitas_(hojaCitas);

    var paciente = buscarPacientePorDni_(hojaPacientes, dni);

    if (!paciente) {
      var idPacienteNuevo = obtenerSiguienteId_(hojaPacientes);

      hojaPacientes.appendRow([
        Number(idPacienteNuevo),
        nombre,
        dni,
        direccion,
        telefono,
        fechaNacimiento
      ]);

      paciente = {
        idPaciente: Number(idPacienteNuevo),
        fila: hojaPacientes.getLastRow()
      };
    } else {
      hojaPacientes.getRange(paciente.fila, 2).setValue(nombre);
      hojaPacientes.getRange(paciente.fila, 4).setValue(direccion);
      hojaPacientes.getRange(paciente.fila, 5).setValue(telefono);

      if (fechaNacimiento) {
        hojaPacientes.getRange(paciente.fila, 6).setValue(fechaNacimiento);
      }
    }

    var historia = buscarHistoriaPorPaciente_(hojaHistorias, paciente.idPaciente);

    if (!historia) {
      var idHistoriaNueva = obtenerSiguienteId_(hojaHistorias);
      var fechaApertura = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

      hojaHistorias.appendRow([
        Number(idHistoriaNueva),
        Number(paciente.idPaciente),
        fechaApertura
      ]);

      historia = {
        idHistoria: Number(idHistoriaNueva),
        fila: hojaHistorias.getLastRow()
      };
    }

    var idCita = obtenerSiguienteId_(hojaCitas);
    var idMedico = obtenerMedicoDisponible_();

    hojaCitas.appendRow([
      Number(idCita),
      Number(paciente.idPaciente),
      Number(historia.idHistoria),
      Number(idMedico),
      fecha,
      hora,
      'Pendiente',
      motivoConsulta,
      observaciones
    ]);

    var filaCita = hojaCitas.getLastRow();

    hojaCitas.getRange(filaCita, 1, 1, 4).setNumberFormat('0');
    hojaCitas.getRange(filaCita, 5).setNumberFormat('yyyy-mm-dd');
    hojaCitas.getRange(filaCita, 6).setNumberFormat('hh:mm');
    hojaCitas.getRange(filaCita, 7, 1, 3).setNumberFormat('@');

    return responderJson_({
      ok: true,
      mensaje: 'Solicitud registrada correctamente.',
      idPaciente: Number(paciente.idPaciente),
      idHistoria: Number(historia.idHistoria),
      idCita: Number(idCita)
    });
  } catch (error) {
    return responderJson_({
      ok: false,
      mensaje: error.message || 'Error al registrar la solicitud.'
    });
  } finally {
    if (bloqueoTomado) {
      lock.releaseLock();
    }
  }
}

function limpiarDni_(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function buscarPacientePorDni_(hoja, dni) {
  var ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return null;
  }

  var datos = hoja.getRange(2, 1, ultimaFila - 1, 6).getValues();

  for (var i = 0; i < datos.length; i++) {
    var dniFila = limpiarDni_(datos[i][2]);

    if (dniFila === dni) {
      return {
        idPaciente: Number(datos[i][0]),
        fila: i + 2
      };
    }
  }

  return null;
}

function buscarHistoriaPorPaciente_(hoja, idPaciente) {
  var ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return null;
  }

  var datos = hoja.getRange(2, 1, ultimaFila - 1, 3).getValues();

  for (var i = 0; i < datos.length; i++) {
    if (Number(datos[i][1]) === Number(idPaciente)) {
      return {
        idHistoria: Number(datos[i][0]),
        fila: i + 2
      };
    }
  }

  return null;
}

function obtenerSiguienteId_(hoja) {
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

function obtenerMedicoDisponible_() {
  return 3;
}

function prepararFormatoPacientes_(hoja) {
  hoja.getRange('A:A').setNumberFormat('0');
  hoja.getRange('C:C').setNumberFormat('@');
  hoja.getRange('E:E').setNumberFormat('@');
  hoja.getRange('F:F').setNumberFormat('yyyy-mm-dd');
}

function prepararFormatoHistorias_(hoja) {
  hoja.getRange('A:B').setNumberFormat('0');
  hoja.getRange('C:C').setNumberFormat('yyyy-mm-dd');
}

function prepararFormatoCitas_(hoja) {
  hoja.getRange('A:D').setNumberFormat('0');
  hoja.getRange('E:E').setNumberFormat('yyyy-mm-dd');
  hoja.getRange('F:F').setNumberFormat('hh:mm');
  hoja.getRange('G:I').setNumberFormat('@');
}

function responderJson_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
