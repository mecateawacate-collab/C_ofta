import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';

interface Paciente {
  idPaciente: number | string;
  nombre: string;
  dni: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
}

interface RespuestaPacientes {
  success: boolean;
  message?: string;
  pacientes?: Paciente[];
  paciente?: Paciente;
}

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [FormsModule, HttpClientModule, RouterLink],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class Pacientes implements OnInit {
  pacientes: Paciente[] = [];
  pacientesFiltrados: Paciente[] = [];

  idPaciente = '';
  nombre = '';
  dni = '';
  direccion = '';
  telefono = '';
  fechaNacimiento = '';

  busqueda = '';
  mensaje = '';
  mensajeError = '';
  cargando = false;
  guardando = false;
  editando = false;

  private apiUrl = 'https://script.google.com/macros/s/AKfycbyRauU-XB-3HhJgytE3Cap62Hkkw8SgytpBquRCLEkL5RNsrrLNY7jVPp0icb89kjQTZQ/exec';

  constructor(
    private http: HttpClient,
    private router: Router,
    private detector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const sesionValida = this.validarSesion();

    if (!sesionValida) {
      return;
    }

    setTimeout(() => {
      this.cargarPacientes();
    }, 0);
  }

  validarSesion(): boolean {
    const data = localStorage.getItem('usuarioLogin');

    if (!data) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const usuario = JSON.parse(data);

      if (!usuario.rol) {
        localStorage.removeItem('usuarioLogin');
        this.router.navigate(['/login']);
        return false;
      }

      return true;
    } catch {
      localStorage.removeItem('usuarioLogin');
      this.router.navigate(['/login']);
      return false;
    }
  }

  cargarPacientes(): void {
    this.mensaje = '';
    this.mensajeError = '';
    this.cargando = true;
    this.actualizarVista();

    const params = new HttpParams()
      .set('action', 'getPacientes')
      .set('t', Date.now().toString());

    this.http
      .get<RespuestaPacientes>(this.apiUrl, { params })
      .pipe(
        timeout(12000),
        finalize(() => {
          this.cargando = false;
          this.actualizarVista();
        })
      )
      .subscribe({
        next: (respuesta) => {
          if (!respuesta.success) {
            this.mensajeError = respuesta.message || 'No se pudieron cargar los pacientes';
            this.actualizarVista();
            return;
          }

          this.pacientes = respuesta.pacientes || [];
          this.filtrarPacientes();
          this.actualizarVista();
        },
        error: () => {
          this.mensajeError = 'No se pudo conectar con el servidor';
          this.actualizarVista();
        }
      });
  }

  guardarPaciente(): void {
    this.mensaje = '';
    this.mensajeError = '';

    if (
      !this.nombre.trim() ||
      !this.dni.trim() ||
      !this.direccion.trim() ||
      !this.telefono.trim() ||
      !this.fechaNacimiento.trim()
    ) {
      this.mensajeError = 'Complete todos los campos';
      this.actualizarVista();
      return;
    }

    this.guardando = true;
    this.actualizarVista();

    let params = new HttpParams()
      .set('action', this.editando ? 'actualizarPaciente' : 'crearPaciente')
      .set('nombre', this.nombre.trim())
      .set('dni', this.dni.trim())
      .set('direccion', this.direccion.trim())
      .set('telefono', this.telefono.trim())
      .set('fechaNacimiento', this.fechaNacimiento.trim())
      .set('t', Date.now().toString());

    if (this.editando) {
      params = params.set('idPaciente', this.idPaciente);
    }

    this.http
      .get<RespuestaPacientes>(this.apiUrl, { params })
      .pipe(
        timeout(12000),
        finalize(() => {
          this.guardando = false;
          this.actualizarVista();
        })
      )
      .subscribe({
        next: (respuesta) => {
          if (!respuesta.success) {
            this.mensajeError = respuesta.message || 'No se pudo guardar el paciente';
            this.actualizarVista();
            return;
          }

          this.mensaje = respuesta.message || 'Paciente guardado correctamente';
          this.limpiarFormulario();
          this.cargarPacientes();
          this.actualizarVista();
        },
        error: () => {
          this.mensajeError = 'No se pudo conectar con el servidor';
          this.actualizarVista();
        }
      });
  }

  editarPaciente(paciente: Paciente): void {
    this.idPaciente = String(paciente.idPaciente);
    this.nombre = paciente.nombre;
    this.dni = paciente.dni;
    this.direccion = paciente.direccion;
    this.telefono = paciente.telefono;
    this.fechaNacimiento = this.normalizarFechaInput(paciente.fechaNacimiento);
    this.editando = true;
    this.mensaje = '';
    this.mensajeError = '';
    this.actualizarVista();
  }

  eliminarPaciente(paciente: Paciente): void {
    const confirmar = confirm(`¿Eliminar al paciente ${paciente.nombre}?`);

    if (!confirmar) {
      return;
    }

    this.mensaje = '';
    this.mensajeError = '';
    this.cargando = true;
    this.actualizarVista();

    const params = new HttpParams()
      .set('action', 'eliminarPaciente')
      .set('idPaciente', String(paciente.idPaciente))
      .set('t', Date.now().toString());

    this.http
      .get<RespuestaPacientes>(this.apiUrl, { params })
      .pipe(
        timeout(12000),
        finalize(() => {
          this.cargando = false;
          this.actualizarVista();
        })
      )
      .subscribe({
        next: (respuesta) => {
          if (!respuesta.success) {
            this.mensajeError = respuesta.message || 'No se pudo eliminar el paciente';
            this.actualizarVista();
            return;
          }

          this.mensaje = respuesta.message || 'Paciente eliminado correctamente';
          this.cargarPacientes();
          this.actualizarVista();
        },
        error: () => {
          this.mensajeError = 'No se pudo conectar con el servidor';
          this.actualizarVista();
        }
      });
  }

  filtrarPacientes(): void {
    const texto = this.busqueda.trim().toLowerCase();

    if (!texto) {
      this.pacientesFiltrados = [...this.pacientes];
      this.actualizarVista();
      return;
    }

    this.pacientesFiltrados = this.pacientes.filter((paciente) => {
      return paciente.nombre.toLowerCase().includes(texto)
        || paciente.dni.toLowerCase().includes(texto)
        || paciente.telefono.toLowerCase().includes(texto)
        || paciente.direccion.toLowerCase().includes(texto);
    });

    this.actualizarVista();
  }

  limpiarFormulario(): void {
    this.idPaciente = '';
    this.nombre = '';
    this.dni = '';
    this.direccion = '';
    this.telefono = '';
    this.fechaNacimiento = '';
    this.editando = false;
    this.actualizarVista();
  }

  normalizarFechaInput(fecha: string): string {
    if (!fecha) {
      return '';
    }

    return fecha.replace(/\//g, '-').substring(0, 10);
  }

  private actualizarVista(): void {
    setTimeout(() => {
      this.detector.detectChanges();
    }, 0);
  }
}