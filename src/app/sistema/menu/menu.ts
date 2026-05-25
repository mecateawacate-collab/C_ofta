import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface UsuarioSesion {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: 'Administrador' | 'Medico';
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu {
  usuario: UsuarioSesion | null = null;

  opciones = [
    {
      titulo: 'Pacientes',
      descripcion: 'Registrar, buscar y revisar información de pacientes.',
      ruta: '/pacientes',
      icono: 'bi bi-people',
      color: 'from-sky-500 to-cyan-400'
    },
    {
      titulo: 'Citas',
      descripcion: 'Gestionar solicitudes, confirmaciones y reprogramaciones.',
      ruta: '/citas',
      icono: 'bi bi-calendar2-check',
      color: 'from-emerald-500 to-teal-400'
    }
  ];

  constructor(private router: Router) {
    this.cargarSesion();
  }

  cargarSesion(): void {
    const data = localStorage.getItem('usuarioLogin');

    if (!data) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = JSON.parse(data) as UsuarioSesion;
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuarioLogin');
    this.router.navigate(['/login']);
  }
}