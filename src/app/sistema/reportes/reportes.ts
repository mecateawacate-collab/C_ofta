import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';

interface UsuarioSesion {
  idUsuario: number | string;
  nombre: string;
  correo: string;
  rol: string;
}

interface PacienteReporte {
  idPaciente: number | string;
  nombre: string;
  dni: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
}

interface HistoriaReporte {
  idHistoria: number | string;
  idPaciente: number | string;
  fechaApertura: string;
}

interface CitaReporte {
  idCita: number | string;
  idPaciente: number | string;
  idHistoria: number | string;
  idMedico: number | string;
  fecha: string;
  hora: string;
  estado: string;
  motivoConsulta: string;
  observaciones: string;
}

interface PagoReporte {
  idPago: number | string;
  idCita: number | string;
  monto: number | string;
  fechaPago: string;
  estado: string;
  comprobante: string;
}

interface ConsultaReporte {
  idConsulta: number | string;
  idHistoria: number | string;
  idCita: number | string;
  idMedico: number | string;
  fechaConsulta: string;
  diagnosticoVisual: string;
  agudezaVisual: string;
  tratamiento: string;
  receta: string;
  observaciones: string;
}

interface ExamenReporte {
  idExamen: number | string;
  idConsulta: number | string;
  tipoExamen: string;
  resultado: string;
  fecha: string;
  archivoAdjunto: string;
}

interface DatosReporte {
  paciente: PacienteReporte | null;
  historias: HistoriaReporte[];
  citas: CitaReporte[];
  pagos: PagoReporte[];
  consultas: ConsultaReporte[];
  examenes: ExamenReporte[];
}

interface RespuestaReporte {
  success: boolean;
  message: string;
  data?: DatosReporte;
}

interface RespuestaRegistroReporte {
  success: boolean;
  message: string;
  idReporte?: number | string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes {
  private http = inject(HttpClient);
  private detector = inject(ChangeDetectorRef);

  private apiUrl = 'https://script.google.com/macros/s/AKfycbyRauU-XB-3HhJgytE3Cap62Hkkw8SgytpBquRCLEkL5RNsrrLNY7jVPp0icb89kjQTZQ/exec';

  busqueda = '';
  cargando = false;
  generando = false;
  mensajeError = '';
  mensajeExito = '';

  datos: DatosReporte | null = null;

  get hayDatos(): boolean {
    return !!this.datos?.paciente;
  }

  buscarPaciente(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
    this.datos = null;

    const valor = this.busqueda.trim();

    if (!valor) {
      this.mensajeError = 'Ingrese ID, DNI o nombre del paciente.';
      return;
    }

    this.cargando = true;

    const params = new HttpParams()
      .set('action', 'buscarReportePaciente')
      .set('busqueda', valor)
      .set('t', Date.now().toString());

    this.http.get<RespuestaReporte>(this.apiUrl, { params })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.cargando = false;
          this.refrescarVista();
        })
      )
      .subscribe({
        next: (respuesta) => {
          if (!respuesta.success || !respuesta.data?.paciente) {
            this.mensajeError = respuesta.message || 'No se encontró información del paciente.';
            return;
          }

          this.datos = respuesta.data;
          this.mensajeExito = 'Paciente encontrado. Ya puedes generar el reporte.';
          this.refrescarVista();
        },
        error: () => {
          this.mensajeError = 'El servidor tardó demasiado en responder. Intente nuevamente.';
          this.refrescarVista();
        }
      });
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.datos = null;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  generarPdf(): void {
    if (!this.datos?.paciente) {
      this.mensajeError = 'Primero busque un paciente.';
      return;
    }

    this.generando = true;
    this.registrarDescargaReporte();
    this.abrirReporteImprimible();

    setTimeout(() => {
      this.generando = false;
      this.refrescarVista();
    }, 500);
  }

  private registrarDescargaReporte(): void {
    const usuario = this.obtenerUsuarioSesion();

    const cuerpo = new URLSearchParams();
    cuerpo.set('action', 'registrarReporte');
    cuerpo.set('idUsuario', String(usuario?.idUsuario || ''));
    cuerpo.set('nombreUsuario', usuario?.nombre || 'Usuario del sistema');
    cuerpo.set('tipoReporte', 'Historia clínica del paciente');
    cuerpo.set('formato', 'PDF');

    this.http.post<RespuestaRegistroReporte>(this.apiUrl, cuerpo.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    }).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  private abrirReporteImprimible(): void {
    if (!this.datos?.paciente) {
      return;
    }

    const paciente = this.datos.paciente;
    const ventana = window.open('', '_blank');

    if (!ventana) {
      this.mensajeError = 'El navegador bloqueó la ventana del reporte.';
      return;
    }

    const html = this.construirHtmlReporte();
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    ventana.document.title = `Reporte paciente ${paciente.idPaciente}`;

    setTimeout(() => {
      ventana.print();
    }, 500);
  }

  private construirHtmlReporte(): string {
    const datos = this.datos as DatosReporte;
    const paciente = datos.paciente as PacienteReporte;
    const fecha = new Date().toLocaleString('es-PE');
    const usuario = this.obtenerUsuarioSesion();

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte clínico</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #ffffff; }
            .header { border-bottom: 4px solid #0284c7; padding-bottom: 18px; margin-bottom: 26px; }
            .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 8px 14px; border-radius: 999px; font-weight: bold; font-size: 13px; }
            h1 { margin: 14px 0 8px; color: #0c4a6e; font-size: 30px; }
            h2 { margin: 28px 0 12px; color: #075985; font-size: 21px; border-bottom: 1px solid #bae6fd; padding-bottom: 8px; }
            .muted { color: #64748b; font-size: 13px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
            .dato { border: 1px solid #e0f2fe; border-radius: 12px; padding: 11px 13px; background: #f8fafc; }
            .label { display: block; color: #64748b; font-size: 12px; margin-bottom: 4px; }
            .value { font-weight: bold; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #0284c7; color: white; text-align: left; padding: 8px; }
            td { border: 1px solid #e2e8f0; padding: 8px; vertical-align: top; }
            tr:nth-child(even) td { background: #f8fafc; }
            .empty { padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; color: #64748b; font-size: 13px; }
            .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
            @media print { body { padding: 18px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">Sistema Oftalmológico</span>
            <h1>Reporte clínico del paciente</h1>
            <div class="muted">Generado el ${this.escaparHtml(fecha)} por ${this.escaparHtml(usuario?.nombre || 'Usuario del sistema')}</div>
          </div>

          <h2>Datos del paciente</h2>
          <div class="grid">
            ${this.datoHtml('ID Paciente', paciente.idPaciente)}
            ${this.datoHtml('Nombre', paciente.nombre)}
            ${this.datoHtml('DNI', paciente.dni)}
            ${this.datoHtml('Teléfono', paciente.telefono)}
            ${this.datoHtml('Dirección', paciente.direccion)}
            ${this.datoHtml('Fecha de nacimiento', paciente.fechaNacimiento)}
          </div>

          <h2>Historia clínica</h2>
          ${this.tablaHistorias(datos.historias)}

          <h2>Citas</h2>
          ${this.tablaCitas(datos.citas)}

          <h2>Pagos</h2>
          ${this.tablaPagos(datos.pagos)}

          <h2>Consultas</h2>
          ${this.tablaConsultas(datos.consultas)}

          <h2>Exámenes</h2>
          ${this.tablaExamenes(datos.examenes)}

          <div class="footer">
            Este documento fue generado desde el sistema oftalmológico como resumen clínico y administrativo del paciente.
          </div>
        </body>
      </html>
    `;
  }

  private datoHtml(label: string, valor: string | number): string {
    return `
      <div class="dato">
        <span class="label">${this.escaparHtml(label)}</span>
        <span class="value">${this.escaparHtml(valor || 'Sin registro')}</span>
      </div>
    `;
  }

  private tablaHistorias(historias: HistoriaReporte[]): string {
    if (!historias.length) {
      return '<div class="empty">Sin historias registradas.</div>';
    }

    return `
      <table>
        <thead><tr><th>ID Historia</th><th>ID Paciente</th><th>Fecha apertura</th></tr></thead>
        <tbody>
          ${historias.map((h) => `<tr><td>${this.escaparHtml(h.idHistoria)}</td><td>${this.escaparHtml(h.idPaciente)}</td><td>${this.escaparHtml(h.fechaApertura)}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  private tablaCitas(citas: CitaReporte[]): string {
    if (!citas.length) {
      return '<div class="empty">Sin citas registradas.</div>';
    }

    return `
      <table>
        <thead><tr><th>ID</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Motivo</th><th>Observaciones</th></tr></thead>
        <tbody>
          ${citas.map((c) => `<tr><td>${this.escaparHtml(c.idCita)}</td><td>${this.escaparHtml(c.fecha)}</td><td>${this.escaparHtml(c.hora)}</td><td>${this.escaparHtml(c.estado)}</td><td>${this.escaparHtml(c.motivoConsulta)}</td><td>${this.escaparHtml(c.observaciones || 'Sin observaciones')}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  private tablaPagos(pagos: PagoReporte[]): string {
    if (!pagos.length) {
      return '<div class="empty">Sin pagos registrados.</div>';
    }

    return `
      <table>
        <thead><tr><th>ID Pago</th><th>ID Cita</th><th>Monto</th><th>Fecha</th><th>Estado</th><th>Comprobante</th></tr></thead>
        <tbody>
          ${pagos.map((p) => `<tr><td>${this.escaparHtml(p.idPago)}</td><td>${this.escaparHtml(p.idCita)}</td><td>S/ ${this.escaparHtml(p.monto)}</td><td>${this.escaparHtml(p.fechaPago)}</td><td>${this.escaparHtml(p.estado)}</td><td>${this.escaparHtml(p.comprobante || 'Sin comprobante')}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  private tablaConsultas(consultas: ConsultaReporte[]): string {
    if (!consultas.length) {
      return '<div class="empty">Sin consultas registradas.</div>';
    }

    return `
      <table>
        <thead><tr><th>ID</th><th>Fecha</th><th>Diagnóstico</th><th>Agudeza</th><th>Tratamiento</th><th>Receta</th><th>Observaciones</th></tr></thead>
        <tbody>
          ${consultas.map((c) => `<tr><td>${this.escaparHtml(c.idConsulta)}</td><td>${this.escaparHtml(c.fechaConsulta)}</td><td>${this.escaparHtml(c.diagnosticoVisual)}</td><td>${this.escaparHtml(c.agudezaVisual)}</td><td>${this.escaparHtml(c.tratamiento)}</td><td>${this.escaparHtml(c.receta)}</td><td>${this.escaparHtml(c.observaciones || 'Sin observaciones')}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  private tablaExamenes(examenes: ExamenReporte[]): string {
    if (!examenes.length) {
      return '<div class="empty">Sin exámenes registrados.</div>';
    }

    return `
      <table>
        <thead><tr><th>ID</th><th>ID Consulta</th><th>Tipo</th><th>Resultado</th><th>Fecha</th><th>Archivo</th></tr></thead>
        <tbody>
          ${examenes.map((e) => `<tr><td>${this.escaparHtml(e.idExamen)}</td><td>${this.escaparHtml(e.idConsulta)}</td><td>${this.escaparHtml(e.tipoExamen)}</td><td>${this.escaparHtml(e.resultado)}</td><td>${this.escaparHtml(e.fecha)}</td><td>${this.escaparHtml(e.archivoAdjunto || 'Sin archivo')}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  private obtenerUsuarioSesion(): UsuarioSesion | null {
    const data = localStorage.getItem('usuarioLogin');

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as UsuarioSesion;
    } catch {
      return null;
    }
  }

  private escaparHtml(valor: string | number): string {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private refrescarVista(): void {
    setTimeout(() => {
      this.detector.detectChanges();
    });
  }
}
