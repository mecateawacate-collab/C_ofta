import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface RespuestaConsultas {
  success: boolean;
  message?: string;
  consultas?: Consulta[];
}

interface RespuestaCitasPagadas {
  success: boolean;
  message?: string;
  citas?: CitaPagada[];
}

interface RespuestaGuardarConsulta {
  success: boolean;
  message?: string;
  consulta?: Consulta;
}

interface CitaPagada {
  idCita: number;
  idPaciente: number;
  idHistoria: number;
  idMedico: number;
  fecha: string;
  hora: string;
  estado: string;
  motivoConsulta: string;
  observaciones: string;
  nombrePaciente: string;
  dniPaciente: string;
  nombreMedico: string;
}

interface Consulta {
  idConsulta: number;
  idHistoria: number;
  idCita: number;
  idMedico: number;
  fechaConsulta: string;
  diagnosticoVisual: string;
  agudezaVisual: string;
  tratamiento: string;
  receta: string;
  observaciones: string;
  nombrePaciente?: string;
  dniPaciente?: string;
  nombreMedico?: string;
}

interface NuevaConsulta {
  idCita: number | null;
  idHistoria: number | null;
  idMedico: number | null;
  fechaConsulta: string;
  diagnosticoVisual: string;
  agudezaVisual: string;
  tratamiento: string;
  receta: string;
  observaciones: string;
}

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './consultas.html',
  styleUrl: './consultas.css'
})
export class Consultas {
  private http = inject(HttpClient);
  private detector = inject(ChangeDetectorRef);

  private apiUrl = 'https://script.google.com/macros/s/AKfycbyRauU-XB-3HhJgytE3Cap62Hkkw8SgytpBquRCLEkL5RNsrrLNY7jVPp0icb89kjQTZQ/exec';

  cargando = false;
  guardando = false;
  mensajeError = '';
  mensajeExito = '';
  busqueda = '';

  citasPagadas: CitaPagada[] = [];
  consultas: Consulta[] = [];
  citaSeleccionada: CitaPagada | null = null;

  nuevaConsulta: NuevaConsulta = this.crearConsultaVacia();

  constructor() {
    this.cargarDatos();
  }

  get consultasFiltradas(): Consulta[] {
    const texto = this.busqueda.trim().toLowerCase();

    if (!texto) {
      return this.consultas;
    }

    return this.consultas.filter((consulta) => {
      return String(consulta.idConsulta).includes(texto)
        || String(consulta.idCita).includes(texto)
        || String(consulta.idHistoria).includes(texto)
        || String(consulta.nombrePaciente || '').toLowerCase().includes(texto)
        || String(consulta.dniPaciente || '').toLowerCase().includes(texto)
        || String(consulta.diagnosticoVisual || '').toLowerCase().includes(texto)
        || String(consulta.tratamiento || '').toLowerCase().includes(texto);
    });
  }

  cargarDatos() {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.cargarCitasPagadas();
    this.cargarConsultas();
  }

  cargarCitasPagadas() {
    this.http.get<RespuestaCitasPagadas>(`${this.apiUrl}?action=getCitasPagadasConsulta`).subscribe({
      next: (respuesta) => {
        if (respuesta.success) {
          this.citasPagadas = respuesta.citas || [];
        } else {
          this.mensajeError = respuesta.message || 'No se pudieron cargar las citas pagadas.';
        }

        this.finalizarCarga();
      },
      error: () => {
        this.mensajeError = 'No se pudo conectar con el servidor al cargar citas pagadas.';
        this.finalizarCarga();
      }
    });
  }

  cargarConsultas() {
    this.http.get<RespuestaConsultas>(`${this.apiUrl}?action=getConsultas`).subscribe({
      next: (respuesta) => {
        if (respuesta.success) {
          this.consultas = respuesta.consultas || [];
        } else {
          this.mensajeError = respuesta.message || 'No se pudieron cargar las consultas.';
        }

        this.finalizarCarga();
      },
      error: () => {
        this.mensajeError = 'No se pudo conectar con el servidor al cargar consultas.';
        this.finalizarCarga();
      }
    });
  }

  seleccionarCita() {
    const idCita = Number(this.nuevaConsulta.idCita);
    const cita = this.citasPagadas.find((item) => Number(item.idCita) === idCita) || null;

    this.citaSeleccionada = cita;

    if (!cita) {
      this.nuevaConsulta.idHistoria = null;
      this.nuevaConsulta.idMedico = null;
      return;
    }

    this.nuevaConsulta.idHistoria = Number(cita.idHistoria);
    this.nuevaConsulta.idMedico = Number(cita.idMedico);
    this.refrescarVista();
  }

  registrarConsulta() {
    this.mensajeError = '';
    this.mensajeExito = '';

    const error = this.validarConsulta();

    if (error) {
      this.mensajeError = error;
      this.refrescarVista();
      return;
    }

    this.guardando = true;
    this.refrescarVista();

    const cuerpo = new URLSearchParams();
    cuerpo.set('action', 'registrarConsulta');
    cuerpo.set('idCita', String(this.nuevaConsulta.idCita));
    cuerpo.set('idHistoria', String(this.nuevaConsulta.idHistoria));
    cuerpo.set('idMedico', String(this.nuevaConsulta.idMedico));
    cuerpo.set('fechaConsulta', this.nuevaConsulta.fechaConsulta);
    cuerpo.set('diagnosticoVisual', this.nuevaConsulta.diagnosticoVisual.trim());
    cuerpo.set('agudezaVisual', this.nuevaConsulta.agudezaVisual.trim());
    cuerpo.set('tratamiento', this.nuevaConsulta.tratamiento.trim());
    cuerpo.set('receta', this.nuevaConsulta.receta.trim());
    cuerpo.set('observaciones', this.nuevaConsulta.observaciones.trim());

    this.http.post<RespuestaGuardarConsulta>(this.apiUrl, cuerpo.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    }).subscribe({
      next: (respuesta) => {
        this.guardando = false;

        if (!respuesta.success) {
          this.mensajeError = respuesta.message || 'No se pudo registrar la consulta.';
          this.refrescarVista();
          return;
        }

        this.mensajeExito = respuesta.message || 'Consulta registrada correctamente.';
        this.limpiarFormulario();
        this.cargarDatos();
        this.refrescarVista();
      },
      error: () => {
        this.guardando = false;
        this.mensajeError = 'No se pudo conectar con el servidor.';
        this.refrescarVista();
      }
    });
  }

  limpiarFormulario() {
    this.nuevaConsulta = this.crearConsultaVacia();
    this.citaSeleccionada = null;
  }

  private validarConsulta(): string {
    if (!this.nuevaConsulta.idCita) {
      return 'Seleccione una cita pagada.';
    }

    if (!this.nuevaConsulta.idHistoria) {
      return 'La cita seleccionada no tiene historia clínica asociada.';
    }

    if (!this.nuevaConsulta.idMedico) {
      return 'La cita seleccionada no tiene médico asociado.';
    }

    if (!this.nuevaConsulta.fechaConsulta) {
      return 'Seleccione la fecha de consulta.';
    }

    if (!this.nuevaConsulta.diagnosticoVisual.trim()) {
      return 'Ingrese el diagnóstico visual.';
    }

    if (!this.nuevaConsulta.agudezaVisual.trim()) {
      return 'Ingrese la agudeza visual.';
    }

    if (!this.nuevaConsulta.tratamiento.trim()) {
      return 'Ingrese el tratamiento.';
    }

    if (!this.nuevaConsulta.receta.trim()) {
      return 'Ingrese la receta o indicación médica.';
    }

    return '';
  }

  private crearConsultaVacia(): NuevaConsulta {
    return {
      idCita: null,
      idHistoria: null,
      idMedico: null,
      fechaConsulta: this.fechaActual(),
      diagnosticoVisual: '',
      agudezaVisual: '',
      tratamiento: '',
      receta: '',
      observaciones: ''
    };
  }

  private fechaActual(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private finalizarCarga() {
    this.cargando = false;
    this.refrescarVista();
  }

  private refrescarVista() {
    setTimeout(() => {
      this.detector.detectChanges();
    });
  }
}
