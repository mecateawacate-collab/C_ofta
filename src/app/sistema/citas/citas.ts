import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type EstadoCita = 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Pagada' | 'Atendida';

interface Cita {
  idCita: number;
  idPaciente: number;
  idHistoria: number;
  idMedico: number;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  motivoConsulta: string;
  observaciones: string;
}

interface NuevaCita {
  idHistoria: number | null;
  idPaciente: number | null;
  idMedico: number | null;
  fecha: string;
  hora: string;
  motivoConsulta: string;
  observaciones: string;
}

interface HistoriaCita {
  idHistoria: number;
  idPaciente: number;
  fechaApertura: string;
  nombrePaciente: string;
  dniPaciente: string;
  telefonoPaciente: string;
}

interface MedicoCita {
  idMedico: number;
  idUsuario: number;
  nombre: string;
  correo: string;
  especialidad: string;
  telefono: string;
}

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './citas.html',
  styleUrl: './citas.css'
})
export class Citas implements OnInit {
  private apiUrl = 'https://script.google.com/macros/s/AKfycbyRauU-XB-3HhJgytE3Cap62Hkkw8SgytpBquRCLEkL5RNsrrLNY7jVPp0icb89kjQTZQ/exec';

  busqueda = '';
  filtroEstado = 'Todos';
  cargando = false;
  guardando = false;

  citas: Cita[] = [];
  historias: HistoriaCita[] = [];
  medicos: MedicoCita[] = [];

  nuevaCita: NuevaCita = {
    idHistoria: null,
    idPaciente: null,
    idMedico: null,
    fecha: '',
    hora: '',
    motivoConsulta: '',
    observaciones: ''
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  @HostListener('document:keydown', ['$event'])
  detectarTecla(evento: KeyboardEvent): void {
    const elemento = evento.target as HTMLElement;

    const escribiendo =
      elemento.tagName === 'INPUT' ||
      elemento.tagName === 'TEXTAREA' ||
      elemento.tagName === 'SELECT';

    if (escribiendo) {
      return;
    }

    if (evento.key.toLowerCase() === 'ñ') {
      this.cargarDatos();
    }
  }

  get citasFiltradas(): Cita[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.citas
      .filter((cita) => {
        const historia = this.buscarHistoria(cita.idHistoria);
        const medico = this.buscarMedico(cita.idMedico);

        const datosPaciente = historia
          ? `${historia.nombrePaciente} ${historia.dniPaciente}`
          : '';

        const datosMedico = medico
          ? `${medico.nombre} ${medico.especialidad}`
          : '';

        const coincideTexto =
          cita.idCita.toString().includes(texto) ||
          cita.fecha.toLowerCase().includes(texto) ||
          cita.hora.toLowerCase().includes(texto) ||
          cita.estado.toLowerCase().includes(texto) ||
          cita.motivoConsulta.toLowerCase().includes(texto) ||
          cita.observaciones.toLowerCase().includes(texto) ||
          datosPaciente.toLowerCase().includes(texto) ||
          datosMedico.toLowerCase().includes(texto);

        const coincideEstado =
          this.filtroEstado === 'Todos' || cita.estado === this.filtroEstado;

        return coincideTexto && coincideEstado;
      })
      .sort((a, b) => Number(b.idCita) - Number(a.idCita));
  }

  cargarDatos(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    Promise.all([
      this.pedir<any>('getCitas'),
      this.pedir<any>('getHistoriasCita'),
      this.pedir<any>('getMedicosCita')
    ])
      .then(([respuestaCitas, respuestaHistorias, respuestaMedicos]) => {
        if (!respuestaCitas.success) {
          alert('Error en getCitas: ' + (respuestaCitas.detail || respuestaCitas.message));
          return;
        }

        if (!respuestaHistorias.success) {
          alert('Error en getHistoriasCita: ' + (respuestaHistorias.detail || respuestaHistorias.message));
          return;
        }

        if (!respuestaMedicos.success) {
          alert('Error en getMedicosCita: ' + (respuestaMedicos.detail || respuestaMedicos.message));
          return;
        }

        this.citas = respuestaCitas.citas || [];
        this.historias = respuestaHistorias.historias || [];
        this.medicos = respuestaMedicos.medicos || [];
      })
      .catch((error) => {
        console.error(error);
        alert('Error de conexión al cargar citas.');
      })
      .finally(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      });
  }

  seleccionarHistoria(): void {
    const historia = this.historias.find(
      (item) => Number(item.idHistoria) === Number(this.nuevaCita.idHistoria)
    );

    this.nuevaCita.idPaciente = historia ? Number(historia.idPaciente) : null;
    this.cdr.detectChanges();
  }

  registrarCita(): void {
    if (
      !this.nuevaCita.idHistoria ||
      !this.nuevaCita.idPaciente ||
      !this.nuevaCita.idMedico ||
      !this.nuevaCita.fecha ||
      !this.nuevaCita.hora ||
      !this.nuevaCita.motivoConsulta
    ) {
      alert('Complete historia, médico, fecha, hora y motivo de consulta.');
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    this.pedir<any>('crearCita', {
      idPaciente: this.nuevaCita.idPaciente,
      idHistoria: this.nuevaCita.idHistoria,
      idMedico: this.nuevaCita.idMedico,
      fecha: this.nuevaCita.fecha,
      hora: this.nuevaCita.hora,
      motivoConsulta: this.nuevaCita.motivoConsulta,
      observaciones: this.nuevaCita.observaciones
    })
      .then((respuesta) => {
        if (!respuesta.success) {
          alert(respuesta.message || 'No se pudo registrar la cita.');
          return;
        }

        this.citas = [respuesta.cita, ...this.citas];
        this.limpiarFormulario();
      })
      .catch(() => {
        alert('Error al registrar la cita.');
      })
      .finally(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      });
  }

  confirmarCita(cita: Cita): void {
    this.cambiarEstado(cita, 'Confirmada');
  }

  atenderCita(cita: Cita): void {
    this.cambiarEstado(cita, 'Atendida');
  }

  cancelarCita(cita: Cita): void {
    this.cambiarEstado(cita, 'Cancelada');
  }

  pagarCita(cita: Cita): void {
    this.cambiarEstado(cita, 'Pagada');
  }

  cambiarEstado(cita: Cita, estado: EstadoCita): void {
    this.pedir<any>('actualizarEstadoCita', {
      idCita: cita.idCita,
      estado: estado
    })
      .then((respuesta) => {
        if (!respuesta.success) {
          alert(respuesta.message || 'No se pudo actualizar la cita.');
          return;
        }

        cita.estado = estado;
      })
      .catch(() => {
        alert('Error al actualizar la cita.');
      })
      .finally(() => {
        this.cdr.detectChanges();
      });
  }

  reprogramarCita(cita: Cita): void {
    const nuevaFecha = prompt('Ingrese la nueva fecha:', cita.fecha);
    const nuevaHora = prompt('Ingrese la nueva hora:', cita.hora);

    if (!nuevaFecha || !nuevaHora) {
      return;
    }

    this.pedir<any>('reprogramarCita', {
      idCita: cita.idCita,
      fecha: nuevaFecha,
      hora: nuevaHora
    })
      .then((respuesta) => {
        if (!respuesta.success) {
          alert(respuesta.message || 'No se pudo reprogramar la cita.');
          return;
        }

        cita.fecha = nuevaFecha;
        cita.hora = nuevaHora;
        cita.estado = 'Pendiente';
      })
      .catch(() => {
        alert('Error al reprogramar la cita.');
      })
      .finally(() => {
        this.cdr.detectChanges();
      });
  }

  eliminarCita(idCita: number): void {
    const confirmar = confirm('¿Desea eliminar esta cita?');

    if (!confirmar) {
      return;
    }

    this.pedir<any>('eliminarCita', {
      idCita: idCita
    })
      .then((respuesta) => {
        if (!respuesta.success) {
          alert(respuesta.message || 'No se pudo eliminar la cita.');
          return;
        }

        this.citas = this.citas.filter((cita) => Number(cita.idCita) !== Number(idCita));
      })
      .catch(() => {
        alert('Error al eliminar la cita.');
      })
      .finally(() => {
        this.cdr.detectChanges();
      });
  }

  limpiarFormulario(): void {
    this.nuevaCita = {
      idHistoria: null,
      idPaciente: null,
      idMedico: null,
      fecha: '',
      hora: '',
      motivoConsulta: '',
      observaciones: ''
    };

    this.cdr.detectChanges();
  }

  contarPorEstado(estado: EstadoCita): number {
    return this.citas.filter((cita) => cita.estado === estado).length;
  }

  claseEstado(estado: string): string {
    if (estado === 'Confirmada') {
      return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (estado === 'Atendida') {
      return 'border-sky-200 bg-sky-100 text-sky-700';
    }

    if (estado === 'Cancelada') {
      return 'border-red-200 bg-red-100 text-red-700';
    }

    if (estado === 'Pagada') {
      return 'border-indigo-200 bg-indigo-100 text-indigo-700';
    }

    return 'border-amber-200 bg-amber-100 text-amber-700';
  }

  buscarHistoria(idHistoria: number): HistoriaCita | undefined {
    return this.historias.find(
      (historia) => Number(historia.idHistoria) === Number(idHistoria)
    );
  }

  buscarMedico(idMedico: number): MedicoCita | undefined {
    return this.medicos.find(
      (medico) => Number(medico.idMedico) === Number(idMedico)
    );
  }

  nombrePaciente(cita: Cita): string {
    const historia = this.buscarHistoria(cita.idHistoria);

    if (!historia) {
      return 'Paciente no encontrado';
    }

    return `${historia.nombrePaciente} - DNI ${historia.dniPaciente}`;
  }

  nombreMedico(cita: Cita): string {
    const medico = this.buscarMedico(cita.idMedico);

    if (!medico) {
      return 'Médico no encontrado';
    }

    return `${medico.nombre} - ${medico.especialidad}`;
  }

  private pedir<T>(action: string, datos: Record<string, any> = {}): Promise<T> {
    const body = new URLSearchParams();

    body.set('action', action);

    Object.keys(datos).forEach((key) => {
      body.set(key, String(datos[key] ?? ''));
    });

    return firstValueFrom(
      this.http.post<T>(this.apiUrl, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
    );
  }
}