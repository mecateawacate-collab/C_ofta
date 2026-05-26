import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

type RolUsuario = 'Administrador' | 'Medico' | 'Sin rol';

interface Usuario {
  idUsuario: number;
  nombre: string;
  correo: string;
  contrasena?: string;
  rol: RolUsuario;

  editando?: boolean;
  guardando?: boolean;

  nombreOriginal?: string;
  rolOriginal?: RolUsuario;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private readonly API_URL = 'https://script.google.com/macros/s/AKfycbyRauU-XB-3HhJgytE3Cap62Hkkw8SgytpBquRCLEkL5RNsrrLNY7jVPp0icb89kjQTZQ/exec';

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];

  roles: RolUsuario[] = ['Administrador', 'Medico', 'Sin rol'];

  cargando = true;
  mensaje = '';
  error = '';

  filtro = '';
  filtroRol: 'Todos' | RolUsuario = 'Todos';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  async cargarUsuarios(): Promise<void> {
    this.cargando = true;
    this.error = '';
    this.mensaje = '';

    try {
      const url = `${this.API_URL}?action=getUsuarios`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudieron cargar los usuarios');
      }

      this.usuarios = (data.usuarios || []).map((u: any) => ({
        idUsuario: Number(u.idUsuario),
        nombre: String(u.nombre || ''),
        correo: String(u.correo || ''),
        contrasena: String(u.contrasena || ''),
        rol: this.normalizarRol(u.rol),
        editando: false,
        guardando: false,
      }));

      this.aplicarFiltros();

    } catch (err) {
      console.error(err);
      this.error = 'No se pudieron cargar los usuarios.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  aplicarFiltros(): void {
    const texto = this.filtro.trim().toLowerCase();

    this.usuariosFiltrados = this.usuarios.filter((usuario) => {
      const coincideTexto =
        usuario.nombre.toLowerCase().includes(texto) ||
        usuario.correo.toLowerCase().includes(texto) ||
        String(usuario.idUsuario).includes(texto);

      const coincideRol =
        this.filtroRol === 'Todos' || usuario.rol === this.filtroRol;

      return coincideTexto && coincideRol;
    });

    this.cdr.detectChanges();
  }

  editarUsuario(usuario: Usuario): void {
    usuario.editando = true;
    usuario.nombreOriginal = usuario.nombre;
    usuario.rolOriginal = usuario.rol;

    this.mensaje = '';
    this.error = '';

    this.cdr.detectChanges();
  }

  cancelarEdicion(usuario: Usuario): void {
    usuario.nombre = usuario.nombreOriginal || usuario.nombre;
    usuario.rol = usuario.rolOriginal || usuario.rol;
    usuario.editando = false;
    usuario.guardando = false;

    this.aplicarFiltros();
  }

  async guardarUsuario(usuario: Usuario): Promise<void> {
    const nombreLimpio = usuario.nombre.trim();

    if (!nombreLimpio) {
      this.error = 'El nombre del usuario no puede estar vacío.';
      this.mensaje = '';
      return;
    }

    usuario.guardando = true;
    this.error = '';
    this.mensaje = '';
    this.cdr.detectChanges();

    try {
      const payload = {
        action: 'actualizarUsuario',
        idUsuario: usuario.idUsuario,
        nombre: nombreLimpio,
        rol: usuario.rol,
      };

      const resp = await fetch(this.API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo actualizar el usuario');
      }

      usuario.nombre = nombreLimpio;
      usuario.editando = false;
      usuario.guardando = false;
      usuario.nombreOriginal = usuario.nombre;
      usuario.rolOriginal = usuario.rol;

      this.mensaje = 'Usuario actualizado correctamente.';
      this.aplicarFiltros();

    } catch (err) {
      console.error(err);
      usuario.guardando = false;
      this.error = 'No se pudo guardar el usuario.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  obtenerClaseRol(rol: RolUsuario): string {
    if (rol === 'Administrador') {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }

    if (rol === 'Medico') {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }

    return 'bg-gray-100 text-gray-600 border-gray-200';
  }

  private normalizarRol(rol: any): RolUsuario {
    const valor = String(rol || '').trim().toLowerCase();

    if (valor === 'administrador' || valor === 'admin') {
      return 'Administrador';
    }

    if (valor === 'medico' || valor === 'médico') {
      return 'Medico';
    }

    return 'Sin rol';
  }
}