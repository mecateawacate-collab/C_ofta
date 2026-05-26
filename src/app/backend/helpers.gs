var SPREADSHEET_ID = '1HGCXlqRRsIgeKR0u-ZjbmmUXTA6aRMIUC5cw5YmDI1Q';

function getSpreadsheet_() {
  if (SPREADSHEET_ID && String(SPREADSHEET_ID).trim() !== '') {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    throw new Error('No se encontró la hoja de cálculo. Coloca el ID del Google Sheets en SPREADSHEET_ID.');
  }

  return ss;
}

function getSheet_(nombre) {
  var ss = getSpreadsheet_();
  var hoja = ss.getSheetByName(nombre);

  if (!hoja) {
    throw new Error('No se encontró la hoja: ' + nombre);
  }

  return hoja;
}

function getParam_(e, key) {
  if (e && e.parameter && e.parameter[key] !== undefined) {
    return e.parameter[key];
  }

  if (e && e.postData && e.postData.contents) {
    var contenido = e.postData.contents;

    try {
      var data = JSON.parse(contenido);

      if (data && data[key] !== undefined) {
        return data[key];
      }
    } catch (error) {}

    var pares = contenido.split('&');

    for (var i = 0; i < pares.length; i++) {
      var partes = pares[i].split('=');
      var nombre = decodeURIComponent(partes[0] || '');

      if (nombre === key) {
        return decodeURIComponent((partes[1] || '').replace(/\+/g, ' '));
      }
    }
  }

  return '';
}