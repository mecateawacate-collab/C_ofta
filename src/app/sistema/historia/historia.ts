import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

interface HistoriaClinica {
  idHistoria: string;
  idPaciente: string;
  fechaApertura: string;
  pacienteNombre: string;
  pacienteDni: string;
  pacienteTelefono: string;
  pacienteDireccion: string;
}

interface PacienteSinHistoria {
  idPaciente: string;
  nombre: string;
  dni: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
}

interface CitaPaciente {
  idCita: string;
  idHistoria: string;
  idMedico: string;
  fecha: string;
  hora: string;
  estado: string;
  motivoConsulta: string;
  observaciones: string;
}

interface PacienteHistorial {
  idPaciente: string;
  nombre: string;
  dni: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  tieneHistoria: boolean;
  idHistoria: string;
  fechaApertura: string;
  citas: CitaPaciente[];
}

@Component({
  selector: 'app-historia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historia.html',
})
export class Historia implements OnInit {
  private readonly apiUrl = 'https://script.google.com/macros/s/AKfycbyRauU-XB-3HhJgytE3Cap62Hkkw8SgytpBquRCLEkL5RNsrrLNY7jVPp0icb89kjQTZQ/exec';

  historias: HistoriaClinica[] = [];
  pacientesSinHistoria: PacienteSinHistoria[] = [];
  pacientesHistorial: PacienteHistorial[] = [];

  textoBusqueda = '';

  cargando = false;
  guardando = false;
  buscando = false;

  mensajeOk = '';
  mensajeError = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.refrescarVista();

    try {
      await this.cargarHistorias();
      await this.cargarPacientesSinHistoria();

      this.pacientesHistorial = [];
    } catch (error) {
      console.error(error);
      this.mensajeError = 'No se pudieron cargar los datos de historias.';
    } finally {
      this.cargando = false;
      this.refrescarVista();
    }
  }

  async cargarHistorias(): Promise<void> {
    const respuesta = await this.fetchConTiempo(
      `${this.apiUrl}?action=getHistorias`
    );

    const data = await respuesta.json();

    if (!data.ok) {
      throw new Error(data.mensaje || 'Error al cargar historias');
    }

    this.historias = data.historias || [];
    this.refrescarVista();
  }

  async cargarPacientesSinHistoria(): Promise<void> {
    const respuesta = await this.fetchConTiempo(
      `${this.apiUrl}?action=getPacientesSinHistoria`
    );

    const data = await respuesta.json();

    if (!data.ok) {
      throw new Error(data.mensaje || 'Error al cargar pacientes sin historia');
    }

    this.pacientesSinHistoria = data.pacientes || [];
    this.refrescarVista();
  }

  async crearHistoria(paciente: PacienteSinHistoria): Promise<void> {
    const confirmar = confirm(`¿Crear historia clínica para ${paciente.nombre}?`);

    if (!confirmar) {
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.refrescarVista();

    try {
      const url = `${this.apiUrl}?action=crearHistoria&idPaciente=${encodeURIComponent(paciente.idPaciente)}`;

      const respuesta = await this.fetchConTiempo(url);
      const data = await respuesta.json();

      if (!data.ok) {
        this.mensajeError = data.mensaje || 'No se pudo crear la historia.';
        this.refrescarVista();
        return;
      }

      this.mensajeOk = data.mensaje || 'Historia clínica creada correctamente.';
      this.refrescarVista();

      await this.cargarDatos();
    } catch (error) {
      console.error(error);
      this.mensajeError = 'Error al crear la historia clínica.';
    } finally {
      this.guardando = false;
      this.refrescarVista();
    }
  }

  async buscarHistorial(): Promise<void> {
    const textoLimpio = this.textoBusqueda.trim();

    if (!textoLimpio) {
      this.pacientesHistorial = [];
      this.refrescarVista();
      return;
    }

    this.buscando = true;
    this.mensajeError = '';
    this.refrescarVista();

    try {
      const texto = encodeURIComponent(textoLimpio);

      const respuesta = await this.fetchConTiempo(
        `${this.apiUrl}?action=buscarHistorialPaciente&texto=${texto}`
      );

      const data = await respuesta.json();

      if (!data.ok) {
        throw new Error(data.mensaje || 'Error al buscar historial');
      }

      this.pacientesHistorial = data.pacientes || [];
    } catch (error) {
      console.error(error);
      this.mensajeError = 'No se pudo buscar el historial del paciente.';
      this.pacientesHistorial = [];
    } finally {
      this.buscando = false;
      this.refrescarVista();
    }
  }

  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.pacientesHistorial = [];
    this.refrescarVista();
  }

  totalCitasPaciente(paciente: PacienteHistorial): number {
    return paciente.citas ? paciente.citas.length : 0;
  }

  estadoColor(estado: string): string {
    const estadoNormalizado = String(estado || '').toLowerCase();

    if (estadoNormalizado.includes('pendiente')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }

    if (estadoNormalizado.includes('confirmada')) {
      return 'bg-sky-100 text-sky-700 border-sky-200';
    }

    if (estadoNormalizado.includes('pagada')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }

    if (estadoNormalizado.includes('atendida')) {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }

    if (estadoNormalizado.includes('cancelada')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }

    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  private async fetchConTiempo(url: string, tiempoMaximo = 15000): Promise<Response> {
    const controlador = new AbortController();

    const tiempo = setTimeout(() => {
      controlador.abort();
    }, tiempoMaximo);

    try {
      return await fetch(url, {
        signal: controlador.signal,
      });
    } finally {
      clearTimeout(tiempo);
    }
  }

  private refrescarVista(): void {
    try {
      this.cdr.detectChanges();
    } catch (error) {
      console.warn('No se pudo refrescar la vista todavía.', error);
    }
  }
}
