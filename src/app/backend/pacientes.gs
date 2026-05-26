function getPacientes_(e) {
  var hoja = obtenerHojaPacientes_();
  var datos = hoja.getDataRange().getValues();

  if (datos.length < 2) {
    return json_({
      success: true,
      pacientes: []
    });
  }

  var cabeceras = obtenerCabeceras_(datos[0]);
  var pacientes = [];

  for (var i = 1; i < datos.length; i++) {
    var fila = datos[i];

    if (!fila[cabeceras.idPaciente] && !fila[cabeceras.nombre]) {
      continue;
    }

    pacientes.push({
      idPaciente: fila[cabeceras.idPaciente],
      nombre: fila[cabeceras.nombre],
      dni: fila[cabeceras.dni],
      direccion: fila[cabeceras.direccion],
      telefono: fila[cabeceras.telefono],
      fechaNacimiento: formatearFecha_(fila[cabeceras.fechaNacimiento])
    });
  }

  return json_({
    success: true,
    pacientes: pacientes
  });
}

function crearPaciente_(e) {
  var hoja = obtenerHojaPacientes_();

  var nombre = String(getParam_(e, 'nombre') || '').trim();
  var dni = String(getParam_(e, 'dni') || '').trim();
  var direccion = String(getParam_(e, 'direccion') || '').trim();
  var telefono = String(getParam_(e, 'telefono') || '').trim();
  var fechaNacimiento = String(getParam_(e, 'fechaNacimiento') || '').trim();

  if (!nombre || !dni || !direccion || !telefono || !fechaNacimiento) {
    return json_({
      success: false,
      message: 'Complete todos los campos'
    });
  }

  if (buscarFilaPorDni_(hoja, dni) !== -1) {
    return json_({
      success: false,
      message: 'Ya existe un paciente con ese DNI'
    });
  }

  var idPaciente = obtenerSiguienteId_(hoja);

  hoja.appendRow([
    idPaciente,
    nombre,
    dni,
    direccion,
    telefono,
    fechaNacimiento
  ]);

  return json_({
    success: true,
    message: 'Paciente registrado correctamente',
    paciente: {
      idPaciente: idPaciente,
      nombre: nombre,
      dni: dni,
      direccion: direccion,
      telefono: telefono,
      fechaNacimiento: fechaNacimiento
    }
  });
}

function actualizarPaciente_(e) {
  var hoja = obtenerHojaPacientes_();

  var idPaciente = String(getParam_(e, 'idPaciente') || '').trim();
  var nombre = String(getParam_(e, 'nombre') || '').trim();
  var dni = String(getParam_(e, 'dni') || '').trim();
  var direccion = String(getParam_(e, 'direccion') || '').trim();
  var telefono = String(getParam_(e, 'telefono') || '').trim();
  var fechaNacimiento = String(getParam_(e, 'fechaNacimiento') || '').trim();

  if (!idPaciente || !nombre || !dni || !direccion || !telefono || !fechaNacimiento) {
    return json_({
      success: false,
      message: 'Complete todos los campos'
    });
  }

  var filaEncontrada = buscarFilaPorId_(hoja, idPaciente);

  if (filaEncontrada === -1) {
    return json_({
      success: false,
      message: 'Paciente no encontrado'
    });
  }

  var filaDni = buscarFilaPorDni_(hoja, dni);

  if (filaDni !== -1 && filaDni !== filaEncontrada) {
    return json_({
      success: false,
      message: 'Ese DNI ya pertenece a otro paciente'
    });
  }

  hoja.getRange(filaEncontrada, 1, 1, 6).setValues([[
    idPaciente,
    nombre,
    dni,
    direccion,
    telefono,
    fechaNacimiento
  ]]);

  return json_({
    success: true,
    message: 'Paciente actualizado correctamente'
  });
}

function eliminarPaciente_(e) {
  var hoja = obtenerHojaPacientes_();
  var idPaciente = String(getParam_(e, 'idPaciente') || '').trim();

  if (!idPaciente) {
    return json_({
      success: false,
      message: 'Seleccione un paciente'
    });
  }

  var filaEncontrada = buscarFilaPorId_(hoja, idPaciente);

  if (filaEncontrada === -1) {
    return json_({
      success: false,
      message: 'Paciente no encontrado'
    });
  }

  hoja.deleteRow(filaEncontrada);

  return json_({
    success: true,
    message: 'Paciente eliminado correctamente'
  });
}

function obtenerHojaPacientes_() {
  var hoja = SpreadsheetApp
    .openById(SPREADSHEET_ID)
    .getSheetByName('Pacientes');

  if (!hoja) {
    throw new Error('No existe la hoja Pacientes');
  }

  return hoja;
}

function obtenerCabeceras_(filaCabecera) {
  var normalizadas = filaCabecera.map(function(valor) {
    return normalizarTexto_(valor);
  });

  return {
    idPaciente: normalizadas.indexOf('idpaciente'),
    nombre: normalizadas.indexOf('nombre'),
    dni: normalizadas.indexOf('dni'),
    direccion: normalizadas.indexOf('direccion'),
    telefono: normalizadas.indexOf('telefono'),
    fechaNacimiento: normalizadas.indexOf('fechanacimiento')
  };
}

function obtenerSiguienteId_(hoja) {
  var ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return 1;
  }

  var ids = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();
  var mayor = 0;

  for (var i = 0; i < ids.length; i++) {
    var numero = Number(ids[i][0]);

    if (!isNaN(numero) && numero > mayor) {
      mayor = numero;
    }
  }

  return mayor + 1;
}

function buscarFilaPorId_(hoja, idPaciente) {
  var ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return -1;
  }

  var datos = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();

  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim() === String(idPaciente).trim()) {
      return i + 2;
    }
  }

  return -1;
}

function buscarFilaPorDni_(hoja, dni) {
  var ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return -1;
  }

  var datos = hoja.getRange(2, 3, ultimaFila - 1, 1).getValues();

  for (var i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim() === String(dni).trim()) {
      return i + 2;
    }
  }

  return -1;
}

function formatearFecha_(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  return String(valor || '').replace(/\//g, '-');
}