import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { forkJoin } from 'rxjs';

interface ConsultaExamen {
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
  nombrePaciente: string;
  dniPaciente: string;
  nombreMedico: string;
}

interface Examen {
  idExamen: number;
  idConsulta: number;
  tipoExamen: string;
  resultado: string;
  fecha: string;
  archivoAdjunto: string;
  nombrePaciente: string;
  dniPaciente: string;
  fechaConsulta: string;
  diagnosticoVisual: string;
}

interface NuevoExamen {
  idConsulta: number | null;
  tipoExamen: string;
  resultado: string;
  fecha: string;
  archivoAdjunto: string;
}

interface RespuestaExamenes {
  success: boolean;
  message?: string;
  examenes?: Examen[];
}

interface RespuestaConsultas {
  success: boolean;
  message?: string;
  consultas?: ConsultaExamen[];
}

@Component({
  selector: 'app-examenes',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './examenes.html',
  styleUrl: './examenes.css'
})
export class Examenes {
  private http = inject(HttpClient);
  private detector = inject(ChangeDetectorRef);

  private apiUrl = 'https://script.google.com/macros/s/AKfycbyRauU-XB-3HhJgytE3Cap62Hkkw8SgytpBquRCLEkL5RNsrrLNY7jVPp0icb89kjQTZQ/exec';

  cargando = false;
  guardando = false;
  mensajeExito = '';
  mensajeError = '';
  busqueda = '';

  examenes: Examen[] = [];
  consultas: ConsultaExamen[] = [];
  consultaSeleccionada: ConsultaExamen | null = null;

  nuevoExamen: NuevoExamen = this.crearExamenVacio();

  tiposExamen = [
    'Agudeza visual',
    'Fondo de ojo',
    'Presión intraocular',
    'Refracción',
    'Biomicroscopía',
    'Campo visual',
    'Tomografía ocular',
    'Otro examen'
  ];

  constructor() {
    this.cargarDatos();
  }

  get examenesFiltrados(): Examen[] {
    const texto = this.normalizar(this.busqueda);

    if (!texto) {
      return this.examenes;
    }

    return this.examenes.filter((examen) => {
      return this.normalizar([
        examen.idExamen,
        examen.idConsulta,
        examen.tipoExamen,
        examen.resultado,
        examen.fecha,
        examen.archivoAdjunto,
        examen.nombrePaciente,
        examen.dniPaciente,
        examen.diagnosticoVisual
      ].join(' ')).includes(texto);
    });
  }

  cargarDatos() {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    forkJoin({
      examenes: this.http.get<RespuestaExamenes>(`${this.apiUrl}?action=getExamenes`),
      consultas: this.http.get<RespuestaConsultas>(`${this.apiUrl}?action=getConsultasExamen`)
    }).subscribe({
      next: (respuesta) => {
        this.cargando = false;

        if (!respuesta.examenes.success) {
          this.mensajeError = respuesta.examenes.message || 'No se pudieron cargar los exámenes.';
          this.refrescarVista();
          return;
        }

        if (!respuesta.consultas.success) {
          this.mensajeError = respuesta.consultas.message || 'No se pudieron cargar las consultas.';
          this.refrescarVista();
          return;
        }

        this.examenes = respuesta.examenes.examenes || [];
        this.consultas = respuesta.consultas.consultas || [];
        this.refrescarVista();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No se pudo conectar con el servidor.';
        this.refrescarVista();
      }
    });
  }

  seleccionarConsulta() {
    const idConsulta = Number(this.nuevoExamen.idConsulta);
    this.consultaSeleccionada = this.consultas.find((consulta) => Number(consulta.idConsulta) === idConsulta) || null;
    this.refrescarVista();
  }

  registrarExamen() {
    this.mensajeError = '';
    this.mensajeExito = '';

    const error = this.validarExamen();

    if (error) {
      this.mensajeError = error;
      this.refrescarVista();
      return;
    }

    this.guardando = true;

    const cuerpo = new URLSearchParams();
    cuerpo.set('action', 'registrarExamen');
    cuerpo.set('idConsulta', String(this.nuevoExamen.idConsulta));
    cuerpo.set('tipoExamen', this.nuevoExamen.tipoExamen.trim());
    cuerpo.set('resultado', this.nuevoExamen.resultado.trim());
    cuerpo.set('fecha', this.nuevoExamen.fecha);
    cuerpo.set('archivoAdjunto', this.nuevoExamen.archivoAdjunto.trim());

    this.http.post<RespuestaExamenes>(this.apiUrl, cuerpo.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    }).subscribe({
      next: (respuesta) => {
        this.guardando = false;

        if (!respuesta.success) {
          this.mensajeError = respuesta.message || 'No se pudo registrar el examen.';
          this.refrescarVista();
          return;
        }

        this.mensajeExito = respuesta.message || 'Examen registrado correctamente.';
        this.limpiarFormulario();
        this.cargarDatos();
      },
      error: () => {
        this.guardando = false;
        this.mensajeError = 'No se pudo conectar con el servidor.';
        this.refrescarVista();
      }
    });
  }

  eliminarExamen(idExamen: number) {
    const confirmar = window.confirm('¿Deseas eliminar este examen?');

    if (!confirmar) {
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';

    const cuerpo = new URLSearchParams();
    cuerpo.set('action', 'eliminarExamen');
    cuerpo.set('idExamen', String(idExamen));

    this.http.post<RespuestaExamenes>(this.apiUrl, cuerpo.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    }).subscribe({
      next: (respuesta) => {
        if (!respuesta.success) {
          this.mensajeError = respuesta.message || 'No se pudo eliminar el examen.';
          this.refrescarVista();
          return;
        }

        this.mensajeExito = respuesta.message || 'Examen eliminado correctamente.';
        this.cargarDatos();
      },
      error: () => {
        this.mensajeError = 'No se pudo conectar con el servidor.';
        this.refrescarVista();
      }
    });
  }

  limpiarFormulario() {
    this.nuevoExamen = this.crearExamenVacio();
    this.consultaSeleccionada = null;
    this.refrescarVista();
  }

  abrirArchivo(archivo: string) {
    if (!archivo) {
      return;
    }

    window.open(archivo, '_blank');
  }

  private validarExamen(): string {
    if (!this.nuevoExamen.idConsulta) {
      return 'Selecciona una consulta.';
    }

    if (!this.nuevoExamen.tipoExamen.trim()) {
      return 'Selecciona el tipo de examen.';
    }

    if (!this.nuevoExamen.resultado.trim()) {
      return 'Ingresa el resultado del examen.';
    }

    if (!this.nuevoExamen.fecha) {
      return 'Selecciona la fecha del examen.';
    }

    return '';
  }

  private crearExamenVacio(): NuevoExamen {
    return {
      idConsulta: null,
      tipoExamen: '',
      resultado: '',
      fecha: this.fechaActual(),
      archivoAdjunto: ''
    };
  }

  private fechaActual(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private normalizar(valor: string): string {
    return String(valor || '').toLowerCase().trim();
  }

  private refrescarVista() {
    setTimeout(() => {
      this.detector.detectChanges();
    });
  }
}
