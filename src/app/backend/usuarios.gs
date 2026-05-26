function getUsuarios_(e) {
  try {
    const ss = getSpreadsheet_();
    const sh = ss.getSheetByName('Usuarios');

    if (!sh) {
      return json_({
        ok: false,
        mensaje: 'No existe la hoja Usuarios',
        usuarios: []
      });
    }

    const data = sh.getDataRange().getValues();

    if (data.length <= 1) {
      return json_({
        ok: true,
        usuarios: []
      });
    }

    const usuarios = [];

    for (let i = 1; i < data.length; i++) {
      const fila = data[i];

      usuarios.push({
        idUsuario: fila[0],
        nombre: fila[1],
        correo: fila[2],
        contrasena: fila[3],
        rol: normalizarRolUsuario_(fila[4])
      });
    }

    return json_({
      ok: true,
      usuarios: usuarios
    });

  } catch (error) {
    return json_({
      ok: false,
      mensaje: 'Error al obtener usuarios',
      detalle: String(error),
      usuarios: []
    });
  }
}


function actualizarUsuario_(e) {
  try {
    const idUsuario = Number(getParam_(e, 'idUsuario'));
    const nombre = String(getParam_(e, 'nombre') || '').trim();
    const rol = normalizarRolUsuario_(getParam_(e, 'rol'));

    if (!idUsuario) {
      return json_({
        ok: false,
        mensaje: 'Falta el idUsuario'
      });
    }

    if (!nombre) {
      return json_({
        ok: false,
        mensaje: 'El nombre no puede estar vacío'
      });
    }

    const rolesPermitidos = ['Administrador', 'Medico', 'Sin rol'];

    if (!rolesPermitidos.includes(rol)) {
      return json_({
        ok: false,
        mensaje: 'Rol no válido'
      });
    }

    const ss = getSpreadsheet_();
    const sh = ss.getSheetByName('Usuarios');

    if (!sh) {
      return json_({
        ok: false,
        mensaje: 'No existe la hoja Usuarios'
      });
    }

    const data = sh.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const idActual = Number(data[i][0]);

      if (idActual === idUsuario) {
        const filaHoja = i + 1;

        // Columna B: nombre
        sh.getRange(filaHoja, 2).setValue(nombre);

        // Columna E: rol
        sh.getRange(filaHoja, 5).setValue(rol);

        return json_({
          ok: true,
          mensaje: 'Usuario actualizado correctamente'
        });
      }
    }

    return json_({
      ok: false,
      mensaje: 'No se encontró el usuario'
    });

  } catch (error) {
    return json_({
      ok: false,
      mensaje: 'Error al actualizar usuario',
      detalle: String(error)
    });
  }
}


function normalizarRolUsuario_(rol) {
  const valor = String(rol || '').trim().toLowerCase();

  if (valor === 'administrador' || valor === 'admin') {
    return 'Administrador';
  }

  if (valor === 'medico' || valor === 'médico') {
    return 'Medico';
  }

  return 'Sin rol';
}