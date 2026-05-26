import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface SolicitudCita {
  nombre: string;
  dni: string;
  telefono: string;
  fechaNacimiento: string;
  direccion: string;
  fecha: string;
  hora: string;
  motivoConsulta: string;
  observaciones: string;
}

interface RespuestaSolicitud {
  ok: boolean;
  mensaje: string;
  idPaciente?: number;
  idHistoria?: number;
  idCita?: number;
}

interface CitaGenerada {
  idCita: number;
  nombre: string;
  dni: string;
  telefono: string;
  fecha: string;
  hora: string;
  motivoConsulta: string;
  observaciones: string;
}

@Component({
  selector: 'app-solicitar',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './solicitar.html',
  styleUrl: './solicitar.css'
})
export class Solicitar {
  private http = inject(HttpClient);
  private detector = inject(ChangeDetectorRef);

  private apiUrl = 'https://script.google.com/macros/s/AKfycbyRauU-XB-3HhJgytE3Cap62Hkkw8SgytpBquRCLEkL5RNsrrLNY7jVPp0icb89kjQTZQ/exec';

  cargando = false;
  mensajeExito = '';
  mensajeError = '';
  citaGenerada: CitaGenerada | null = null;

  solicitud: SolicitudCita = this.crearSolicitudVacia();

  motivos = [
    'Consulta oftalmológica general',
    'Medida de vista',
    'Dolor ocular',
    'Ojo rojo',
    'Visión borrosa',
    'Control de presión ocular',
    'Control visual pediátrico',
    'Otro motivo'
  ];

  enviarSolicitud() {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.citaGenerada = null;

    const error = this.validarSolicitud();

    if (error) {
      this.mensajeError = error;
      this.refrescarVista();
      return;
    }

    const datosEnviados: SolicitudCita = {
      nombre: this.solicitud.nombre.trim(),
      dni: this.solicitud.dni.trim(),
      telefono: this.solicitud.telefono.trim(),
      fechaNacimiento: this.solicitud.fechaNacimiento,
      direccion: this.solicitud.direccion.trim(),
      fecha: this.solicitud.fecha,
      hora: this.solicitud.hora,
      motivoConsulta: this.solicitud.motivoConsulta,
      observaciones: this.solicitud.observaciones.trim()
    };

    this.cargando = true;
    this.refrescarVista();

    const cuerpo = new URLSearchParams();
    cuerpo.set('action', 'solicitarCita');
    cuerpo.set('nombre', datosEnviados.nombre);
    cuerpo.set('dni', datosEnviados.dni);
    cuerpo.set('telefono', datosEnviados.telefono);
    cuerpo.set('fechaNacimiento', datosEnviados.fechaNacimiento);
    cuerpo.set('direccion', datosEnviados.direccion);
    cuerpo.set('fecha', datosEnviados.fecha);
    cuerpo.set('hora', datosEnviados.hora);
    cuerpo.set('motivoConsulta', datosEnviados.motivoConsulta);
    cuerpo.set('observaciones', datosEnviados.observaciones);

    this.http.post<RespuestaSolicitud>(this.apiUrl, cuerpo.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    }).subscribe({
      next: (respuesta) => {
        this.cargando = false;

        if (!respuesta.ok || !respuesta.idCita) {
          this.mensajeError = respuesta.mensaje || 'No se pudo registrar la solicitud.';
          this.refrescarVista();
          return;
        }

        this.citaGenerada = {
          idCita: Number(respuesta.idCita),
          nombre: datosEnviados.nombre,
          dni: datosEnviados.dni,
          telefono: datosEnviados.telefono,
          fecha: datosEnviados.fecha,
          hora: datosEnviados.hora,
          motivoConsulta: datosEnviados.motivoConsulta,
          observaciones: datosEnviados.observaciones
        };

        this.mensajeExito = `Solicitud registrada correctamente. Tu código de cita es ${respuesta.idCita}.`;
        this.limpiarFormulario();
        this.refrescarVista();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No se pudo conectar con el servidor.';
        this.refrescarVista();
      }
    });
  }

  limpiarFormulario() {
    this.solicitud = this.crearSolicitudVacia();
    this.refrescarVista();
  }

  descargarComprobante() {
    if (!this.citaGenerada) {
      return;
    }

    const cita = this.citaGenerada;
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 650;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, canvas.width, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Arial';
    ctx.fillText('Comprobante de solicitud de cita', 50, 65);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px Arial';
    ctx.fillText('Código de cita', 50, 170);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 78px Arial';
    ctx.fillText(String(cita.idCita), 50, 250);

    ctx.fillStyle = '#334155';
    ctx.font = '22px Arial';
    ctx.fillText(`Paciente: ${cita.nombre}`, 50, 330);
    ctx.fillText(`DNI: ${cita.dni}`, 50, 375);
    ctx.fillText(`Teléfono: ${cita.telefono}`, 50, 420);
    ctx.fillText(`Fecha: ${cita.fecha}`, 50, 465);
    ctx.fillText(`Hora: ${cita.hora}`, 50, 510);
    ctx.fillText(`Motivo: ${cita.motivoConsulta}`, 50, 555);

    ctx.fillStyle = '#64748b';
    ctx.font = '18px Arial';
    ctx.fillText('Presente este código para realizar el pago de su cita.', 50, 610);

    const enlace = document.createElement('a');
    enlace.download = `cita-${cita.idCita}.png`;
    enlace.href = canvas.toDataURL('image/png');
    enlace.click();
  }

  imprimirComprobante() {
    if (!this.citaGenerada) {
      return;
    }

    const cita = this.citaGenerada;
    const ventana = window.open('', '_blank');

    if (!ventana) {
      return;
    }

    ventana.document.write(`
      <html>
        <head>
          <title>Comprobante de cita ${cita.idCita}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #0f172a;
            }

            .card {
              max-width: 700px;
              border: 1px solid #bae6fd;
              border-radius: 24px;
              padding: 32px;
            }

            .titulo {
              color: #0284c7;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 20px;
            }

            .codigo {
              font-size: 72px;
              font-weight: bold;
              color: #0284c7;
              margin: 20px 0;
            }

            .dato {
              font-size: 18px;
              margin: 12px 0;
            }

            .nota {
              margin-top: 28px;
              padding: 16px;
              border-radius: 16px;
              background: #f0f9ff;
              color: #0369a1;
              font-weight: bold;
            }
          </style>
        </head>

        <body>
          <div class="card">
            <div class="titulo">Comprobante de solicitud de cita</div>
            <div>Código de cita</div>
            <div class="codigo">${this.escaparHtml(String(cita.idCita))}</div>

            <div class="dato"><strong>Paciente:</strong> ${this.escaparHtml(cita.nombre)}</div>
            <div class="dato"><strong>DNI:</strong> ${this.escaparHtml(cita.dni)}</div>
            <div class="dato"><strong>Teléfono:</strong> ${this.escaparHtml(cita.telefono)}</div>
            <div class="dato"><strong>Fecha:</strong> ${this.escaparHtml(cita.fecha)}</div>
            <div class="dato"><strong>Hora:</strong> ${this.escaparHtml(cita.hora)}</div>
            <div class="dato"><strong>Motivo:</strong> ${this.escaparHtml(cita.motivoConsulta)}</div>

            <div class="nota">
              Presente este código para realizar el pago de su cita.
            </div>
          </div>

          <script>
            window.print();
          </script>
        </body>
      </html>
    `);

    ventana.document.close();
  }

  private validarSolicitud(): string {
    const dniLimpio = this.solicitud.dni.replace(/\D/g, '');

    if (!this.solicitud.nombre.trim()) {
      return 'Ingresa el nombre del paciente.';
    }

    if (!dniLimpio || dniLimpio.length !== 8) {
      return 'Ingresa un DNI válido de 8 dígitos.';
    }

    if (!this.solicitud.telefono.trim()) {
      return 'Ingresa el teléfono del paciente.';
    }

    if (!this.solicitud.fechaNacimiento) {
      return 'Selecciona la fecha de nacimiento.';
    }

    if (!this.solicitud.direccion.trim()) {
      return 'Ingresa la dirección del paciente.';
    }

    if (!this.solicitud.fecha) {
      return 'Selecciona la fecha de la cita.';
    }

    if (!this.solicitud.hora) {
      return 'Selecciona la hora de la cita.';
    }

    if (!this.solicitud.motivoConsulta) {
      return 'Selecciona el motivo de consulta.';
    }

    return '';
  }

  private crearSolicitudVacia(): SolicitudCita {
    return {
      nombre: '',
      dni: '',
      telefono: '',
      fechaNacimiento: '',
      direccion: '',
      fecha: '',
      hora: '',
      motivoConsulta: '',
      observaciones: ''
    };
  }

  private refrescarVista() {
    setTimeout(() => {
      this.detector.detectChanges();
    });
  }

  private escaparHtml(valor: string): string {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
