var SPREADSHEET_ID = '1HGCXlqRRsIgeKR0u-ZjbmmUXTA6aRMIUC5cw5YmDI1Q';

function loginTrabajador_(e) {
  var correo = getParam_(e, 'correo');
  var clave = getParam_(e, 'clave');

  correo = String(correo || '').trim().toLowerCase();
  clave = String(clave || '').trim();

  if (!correo || !clave) {
    return json_({
      success: false,
      message: 'Ingrese usuario y contraseña'
    });
  }

  var hoja = SpreadsheetApp
    .openById(SPREADSHEET_ID)
    .getSheetByName('Usuarios');

  if (!hoja) {
    return json_({
      success: false,
      message: 'No existe la hoja Usuarios'
    });
  }

  var datos = hoja.getDataRange().getValues();

  if (datos.length < 2) {
    return json_({
      success: false,
      message: 'No hay usuarios registrados'
    });
  }

  var cabeceras = datos[0].map(function(valor) {
    return normalizarTexto_(valor);
  });

  var indexId = cabeceras.indexOf('idusuario');
  var indexNombre = cabeceras.indexOf('nombre');
  var indexCorreo = cabeceras.indexOf('correo');
  var indexClave = cabeceras.indexOf('contrasena');
  var indexRol = cabeceras.indexOf('rol');

  for (var i = 1; i < datos.length; i++) {
    var fila = datos[i];

    var correoHoja = String(fila[indexCorreo] || '').trim().toLowerCase();
    var claveHoja = String(fila[indexClave] || '').trim();

    if (correoHoja === correo && claveHoja === clave) {
      return json_({
        success: true,
        message: 'Login correcto',
        usuario: {
          idUsuario: fila[indexId],
          nombre: fila[indexNombre],
          correo: fila[indexCorreo],
          rol: fila[indexRol]
        }
      });
    }
  }

  return json_({
    success: false,
    message: 'Usuario o contraseña incorrectos'
  });
}

function getParam_(e, key) {
  if (e && e.parameter && e.parameter[key] !== undefined) {
    return e.parameter[key];
  }

  if (e && e.postData && e.postData.contents) {
    try {
      var data = JSON.parse(e.postData.contents);
      if (data[key] !== undefined) {
        return data[key];
      }
    } catch (err) {}
  }

  return '';
}

function normalizarTexto_(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}