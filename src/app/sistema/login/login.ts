import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface UsuarioSistema {
  idUsuario: number;
  nombre: string;
  correo: string;
  contrasena: string;
  rol: 'Administrador' | 'Medico';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  usuario = '';
  clave = '';
  mensajeError = '';
  mostrarClave = false;
  cargando = false;

  usuarios: UsuarioSistema[] = [
    {
      idUsuario: 1,
      nombre: 'mecate',
      correo: 'admin',
      contrasena: '123',
      rol: 'Administrador'
    },
    {
      idUsuario: 2,
      nombre: 'asfafasfasf',
      correo: 'awacate',
      contrasena: '123123',
      rol: 'Medico'
    }
  ];

  constructor(private router: Router) {}

  ingresar(): void {
    this.mensajeError = '';

    const usuarioLimpio = this.usuario.trim().toLowerCase();
    const claveLimpia = this.clave.trim();

    if (!usuarioLimpio || !claveLimpia) {
      this.mensajeError = 'Ingrese usuario y contraseña';
      return;
    }

    this.cargando = true;

    setTimeout(() => {
      const usuarioEncontrado = this.usuarios.find((usuario) => {
        return (
          usuario.correo.toLowerCase() === usuarioLimpio &&
          usuario.contrasena === claveLimpia
        );
      });

      this.cargando = false;

      if (!usuarioEncontrado) {
        this.mensajeError = 'Usuario o contraseña incorrectos';
        return;
      }

      const sesion = {
        idUsuario: usuarioEncontrado.idUsuario,
        nombre: usuarioEncontrado.nombre,
        correo: usuarioEncontrado.correo,
        rol: usuarioEncontrado.rol
      };

      localStorage.setItem('usuarioLogin', JSON.stringify(sesion));

      this.router.navigate(['/menu']);
    }, 600);
  }
}