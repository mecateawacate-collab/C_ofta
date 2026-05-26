import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface UsuarioSesion {
  idUsuario: number | string;
  nombre: string;
  correo: string;
  rol: string;
}

interface OpcionMenu {
  titulo: string;
  descripcion: string;
  ruta: string;
  icono: string;
  color: string;
  soloAdmin?: boolean;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu {
  usuario: UsuarioSesion | null = null;

  opciones: OpcionMenu[] = [
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
    },
    {
      titulo: 'Historia clínica',
      descripcion: 'Registrar diagnóstico visual, agudeza, tratamiento y receta.',
      ruta: '/historia',
      icono: 'bi bi-journal-medical',
      color: 'from-indigo-500 to-sky-400'
    },
    {
      titulo: 'Usuarios',
      descripcion: 'Administrar usuarios del sistema y controlar sus roles.',
      ruta: '/usuarios',
      icono: 'bi bi-person-gear',
      color: 'from-violet-500 to-fuchsia-400',
      soloAdmin: true
    }
  ];

  constructor(private router: Router) {
    this.cargarSesion();
  }

  get esAdministrador(): boolean {
    return this.usuario?.rol === 'Administrador';
  }

  get opcionesVisibles(): OpcionMenu[] {
    return this.opciones.filter((opcion) => {
      if (!opcion.soloAdmin) {
        return true;
      }

      return this.esAdministrador;
    });
  }

  cargarSesion(): void {
    const data = localStorage.getItem('usuarioLogin');

    if (!data) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const usuarioGuardado = JSON.parse(data) as UsuarioSesion;

      if (!usuarioGuardado.rol) {
        localStorage.removeItem('usuarioLogin');
        this.router.navigate(['/login']);
        return;
      }

      this.usuario = usuarioGuardado;
    } catch {
      localStorage.removeItem('usuarioLogin');
      this.router.navigate(['/login']);
    }
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuarioLogin');
    this.router.navigate(['/login']);
  }
}