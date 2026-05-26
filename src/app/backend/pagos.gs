function getPagos_(e) {
  var hojaPagos = getSheet_('Pagos');
  prepararFormatoPagos_(hojaPagos);

  var datos = hojaPagos.getDataRange().getValues();
  var pagos = [];

  if (datos.length > 1) {
    for (var i = 1; i < datos.length; i++) {
      if (datos[i][0] === '' && datos[i][1] === '') {
        continue;
      }

      var idCita = datos[i][1];
      var cita = obtenerDetalleCitaPago_(idCita);

      pagos.push({
        idPago: Number(datos[i][0]),
        idCita: Number(idCita),
        monto: Number(datos[i][2]),
        fechaPago: formatearFechaPago_(datos[i][3]),
        estado: String(datos[i][4] || ''),
        comprobante: String(datos[i][5] || ''),
        paciente: cita ? cita.paciente : 'Paciente no encontrado',
        dni: cita ? cita.dni : '',
        fechaCita: cita ? cita.fecha : '',
        horaCita: cita ? cita.hora : '',
        estadoCita: cita ? cita.estado : '',
        motivoConsulta: cita ? cita.motivoConsulta : ''
      });
    }
  }

  return json_({
    success: true,
    pagos: pagos
  });
}

function buscarCitaPago_(e) {
  var idCita = getParam_(e, 'idCita');

  if (!idCita) {
    return json_({
      success: false,
      message: 'Ingrese el código de cita.'
    });
  }

  var cita = obtenerDetalleCitaPago_(idCita);

  if (!cita) {
    return json_({
      success: false,
      message: 'No se encontró una cita con ese código.'
    });
  }

  var pago = buscarPagoPorCita_(idCita);

  if (!pago && cita.estado === 'Confirmada') {
    pago = crearPagoPendientePorCita_(idCita);
  }

  return json_({
    success: true,
    cita: cita,
    pago: pago
  });
}

function registrarPago_(e) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    var idCita = getParam_(e, 'idCita');
    var comprobante = String(getParam_(e, 'comprobante') || '').trim();

    if (!idCita) {
      return json_({
        success: false,
        message: 'Ingrese el código de cita.'
      });
    }

    var cita = obtenerDetalleCitaPago_(idCita);

    if (!cita) {
      return json_({
        success: false,
        message: 'No se encontró la cita.'
      });
    }

    if (cita.estado === 'Pendiente') {
      return json_({
        success: false,
        message: 'La cita primero debe ser confirmada.'
      });
    }

    if (cita.estado === 'Cancelada') {
      return json_({
        success: false,
        message: 'No se puede pagar una cita cancelada.'
      });
    }

    if (cita.estado === 'Atendida') {
      return json_({
        success: false,
        message: 'La cita ya fue atendida.'
      });
    }

    var pago = buscarPagoPorCita_(idCita);

    if (pago && pago.estado === 'Pagado') {
      return json_({
        success: false,
        message: 'Esta cita ya tiene un pago registrado.'
      });
    }

    if (!pago) {
      pago = crearPagoPendientePorCita_(idCita);
    }

    var hojaPagos = getSheet_('Pagos');
    prepararFormatoPagos_(hojaPagos);

    var fechaPago = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var textoComprobante = comprobante || ('Pago de cita ' + idCita);

    hojaPagos.getRange(pago.fila, 3).setValue(50);
    hojaPagos.getRange(pago.fila, 4).setValue(fechaPago);
    hojaPagos.getRange(pago.fila, 5).setValue('Pagado');
    hojaPagos.getRange(pago.fila, 6).setValue(textoComprobante);

    actualizarEstadoCitaPorId_(idCita, 'Pagada');

    var pagoActualizado = buscarPagoPorCita_(idCita);

    return json_({
      success: true,
      message: 'Pago registrado correctamente.',
      pago: pagoActualizado
    });
  } catch (error) {
    return json_({
      success: false,
      message: error && error.message ? error.message : 'Error al registrar el pago.'
    });
  } finally {
    lock.releaseLock();
  }
}

function anularPago_(e) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    var idPago = getParam_(e, 'idPago');

    if (!idPago) {
      return json_({
        success: false,
        message: 'Falta el ID del pago.'
      });
    }

    var hojaPagos = getSheet_('Pagos');
    var datos = hojaPagos.getDataRange().getValues();

    for (var i = 1; i < datos.length; i++) {
      if (String(datos[i][0]) === String(idPago)) {
        var idCita = datos[i][1];

        hojaPagos.getRange(i + 1, 5).setValue('Anulado');
        actualizarEstadoCitaPorId_(idCita, 'Confirmada');

        return json_({
          success: true,
          message: 'Pago anulado correctamente.'
        });
      }
    }

    return json_({
      success: false,
      message: 'No se encontró el pago.'
    });
  } catch (error) {
    return json_({
      success: false,
      message: error && error.message ? error.message : 'Error al anular el pago.'
    });
  } finally {
    lock.releaseLock();
  }
}

function crearPagoPendientePorCita_(idCita) {
  var existente = buscarPagoPorCita_(idCita);

  if (existente && existente.estado !== 'Anulado') {
    return existente;
  }

  var hojaPagos = getSheet_('Pagos');
  prepararFormatoPagos_(hojaPagos);

  var idPago = generarIdPago_();

  hojaPagos.appendRow([
    Number(idPago),
    Number(idCita),
    50,
    '',
    'Pendiente',
    ''
  ]);

  var fila = hojaPagos.getLastRow();

  return {
    idPago: Number(idPago),
    idCita: Number(idCita),
    monto: 50,
    fechaPago: '',
    estado: 'Pendiente',
    comprobante: '',
    fila: fila
  };
}

function anularPagoPendientePorCita_(idCita) {
  var pago = buscarPagoPorCita_(idCita);

  if (!pago || pago.estado === 'Pagado') {
    return;
  }

  var hojaPagos = getSheet_('Pagos');
  hojaPagos.getRange(pago.fila, 5).setValue('Anulado');
}

function buscarPagoPorCita_(idCita) {
  var hojaPagos = getSheet_('Pagos');
  prepararFormatoPagos_(hojaPagos);

  var ultimaFila = hojaPagos.getLastRow();

  if (ultimaFila < 2) {
    return null;
  }

  var datos = hojaPagos.getRange(2, 1, ultimaFila - 1, 6).getValues();
  var encontrado = null;

  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][1]) === String(idCita)) {
      encontrado = {
        idPago: Number(datos[i][0]),
        idCita: Number(datos[i][1]),
        monto: Number(datos[i][2]),
        fechaPago: formatearFechaPago_(datos[i][3]),
        estado: String(datos[i][4] || ''),
        comprobante: String(datos[i][5] || ''),
        fila: i + 2
      };
    }
  }

  return encontrado;
}

function obtenerDetalleCitaPago_(idCita) {
  var hojaCitas = getSheet_('Citas');
  var datosCitas = hojaCitas.getDataRange().getValues();

  for (var i = 1; i < datosCitas.length; i++) {
    if (String(datosCitas[i][0]) === String(idCita)) {
      var idPaciente = datosCitas[i][1];
      var paciente = obtenerPacientePago_(idPaciente);

      return {
        idCita: Number(datosCitas[i][0]),
        idPaciente: Number(datosCitas[i][1]),
        idHistoria: Number(datosCitas[i][2]),
        idMedico: Number(datosCitas[i][3]),
        fecha: formatearFechaPago_(datosCitas[i][4]),
        hora: formatearHoraPago_(datosCitas[i][5]),
        estado: String(datosCitas[i][6] || ''),
        motivoConsulta: String(datosCitas[i][7] || ''),
        observaciones: String(datosCitas[i][8] || ''),
        paciente: paciente ? paciente.nombre : 'Paciente no encontrado',
        dni: paciente ? paciente.dni : '',
        telefono: paciente ? paciente.telefono : ''
      };
    }
  }

  return null;
}

function obtenerPacientePago_(idPaciente) {
  var hojaPacientes = getSheet_('Pacientes');
  var datos = hojaPacientes.getDataRange().getValues();

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]) === String(idPaciente)) {
      return {
        idPaciente: Number(datos[i][0]),
        nombre: String(datos[i][1] || ''),
        dni: String(datos[i][2] || ''),
        direccion: String(datos[i][3] || ''),
        telefono: String(datos[i][4] || '')
      };
    }
  }

  return null;
}

function actualizarEstadoCitaPorId_(idCita, estado) {
  var hojaCitas = getSheet_('Citas');
  var datos = hojaCitas.getDataRange().getValues();

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]) === String(idCita)) {
      hojaCitas.getRange(i + 1, 7).setValue(estado);
      return true;
    }
  }

  return false;
}

function generarIdPago_() {
  var hoja = getSheet_('Pagos');
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

function prepararFormatoPagos_(hoja) {
  hoja.getRange('A:B').setNumberFormat('0');
  hoja.getRange('C:C').setNumberFormat('0.00');
  hoja.getRange('D:D').setNumberFormat('yyyy-mm-dd');
  hoja.getRange('E:F').setNumberFormat('@');
}

function formatearFechaPago_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  return String(valor);
}

function formatearHoraPago_(valor) {
  if (!valor) {
    return '';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'HH:mm');
  }

  return String(valor);
}
