import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';

interface RespuestaLogin {
  success: boolean;
  message: string;
  usuario?: {
    idUsuario: number | string;
    nombre: string;
    correo: string;
    rol: string;
  };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  usuario = '';
  clave = '';
  mensajeError = '';
  mostrarClave = false;
  cargando = false;

  private apiUrl = 'https://script.google.com/macros/s/AKfycbyRauU-XB-3HhJgytE3Cap62Hkkw8SgytpBquRCLEkL5RNsrrLNY7jVPp0icb89kjQTZQ/exec';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ingresar(): void {
    this.mensajeError = '';

    const usuarioLimpio = this.usuario.trim().toLowerCase();
    const claveLimpia = this.clave.trim();

    if (!usuarioLimpio || !claveLimpia) {
      this.mensajeError = 'Ingrese usuario y contraseña';
      return;
    }

    this.cargando = true;

    const params = new HttpParams()
      .set('action', 'loginTrabajador')
      .set('correo', usuarioLimpio)
      .set('clave', claveLimpia)
      .set('t', Date.now().toString());

    this.http
      .get<RespuestaLogin>(this.apiUrl, { params })
      .pipe(
        timeout(12000),
        finalize(() => {
          this.cargando = false;
        })
      )
      .subscribe({
        next: (respuesta) => {
          if (!respuesta.success || !respuesta.usuario) {
            this.mensajeError = respuesta.message || 'Usuario o contraseña incorrectos';
            return;
          }

          localStorage.setItem('usuarioLogin', JSON.stringify(respuesta.usuario));

          this.router.navigate(['/menu']);
        },
        error: () => {
          this.mensajeError = 'El servidor tardó demasiado en responder. Intente nuevamente.';
        }
      });
  }
}