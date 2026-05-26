import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type EstadoPago = 'Pendiente' | 'Pagado' | 'Anulado';

type EstadoCita = 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Pagada' | 'Atendida';

interface Pago {
  idPago: number;
  idCita: number;
  monto: number;
  fechaPago: string;
  estado: EstadoPago;
  comprobante: string;
  paciente: string;
  dni: string;
  fechaCita: string;
  horaCita: string;
  estadoCita: EstadoCita;
  motivoConsulta: string;
}

interface CitaPago {
  idCita: number;
  idPaciente: number;
  idHistoria: number;
  idMedico: number;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  motivoConsulta: string;
  observaciones: string;
  paciente: string;
  dni: string;
  telefono: string;
}

interface RespuestaPagos {
  success: boolean;
  message?: string;
  pagos?: Pago[];
}

interface RespuestaBusqueda {
  success: boolean;
  message?: string;
  cita?: CitaPago;
  pago?: Pago;
}

interface RespuestaSimple {
  success: boolean;
  message?: string;
  pago?: Pago;
}

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css'
})
export class Pagos implements OnInit {
  private apiUrl = 'https://script.google.com/macros/s/AKfycbyRauU-XB-3HhJgytE3Cap62Hkkw8SgytpBquRCLEkL5RNsrrLNY7jVPp0icb89kjQTZQ/exec';

  cargando = false;
  buscando = false;
  procesando = false;

  codigoCita = '';
  comprobante = '';
  busqueda = '';
  filtroEstado = 'Todos';
  mensajeExito = '';
  mensajeError = '';

  montoFijo = 50;

  pagos: Pago[] = [];
  citaEncontrada: CitaPago | null = null;
  pagoEncontrado: Pago | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const idCita = params.get('idCita');

    if (idCita) {
      this.codigoCita = idCita;
    }

    this.cargarPagos().then(() => {
      if (this.codigoCita) {
        this.buscarCita();
      }
    });
  }

  get pagosFiltrados(): Pago[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.pagos
      .filter((pago) => {
        const coincideTexto =
          String(pago.idPago).includes(texto) ||
          String(pago.idCita).includes(texto) ||
          String(pago.monto).includes(texto) ||
          pago.fechaPago.toLowerCase().includes(texto) ||
          pago.estado.toLowerCase().includes(texto) ||
          pago.comprobante.toLowerCase().includes(texto) ||
          pago.paciente.toLowerCase().includes(texto) ||
          pago.dni.toLowerCase().includes(texto) ||
          pago.estadoCita.toLowerCase().includes(texto) ||
          pago.motivoConsulta.toLowerCase().includes(texto);

        const coincideEstado = this.filtroEstado === 'Todos' || pago.estado === this.filtroEstado;

        return coincideTexto && coincideEstado;
      })
      .sort((a, b) => Number(b.idPago) - Number(a.idPago));
  }

  async cargarPagos(): Promise<void> {
    this.cargando = true;
    this.cdr.detectChanges();

    try {
      const respuesta = await this.pedir<RespuestaPagos>('getPagos');

      if (!respuesta.success) {
        this.mensajeError = respuesta.message || 'No se pudieron cargar los pagos.';
        return;
      }

      this.pagos = respuesta.pagos || [];
    } catch {
      this.mensajeError = 'Error de conexión al cargar pagos.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  buscarCita(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.citaEncontrada = null;
    this.pagoEncontrado = null;

    const idCita = this.codigoCita.trim();

    if (!idCita) {
      this.mensajeError = 'Ingrese el código de cita.';
      this.cdr.detectChanges();
      return;
    }

    this.buscando = true;
    this.cdr.detectChanges();

    this.pedir<RespuestaBusqueda>('buscarCitaPago', { idCita })
      .then((respuesta) => {
        if (!respuesta.success || !respuesta.cita) {
          this.mensajeError = respuesta.message || 'No se encontró la cita.';
          return;
        }

        this.citaEncontrada = respuesta.cita;
        this.pagoEncontrado = respuesta.pago || null;

        if (!this.pagoEncontrado && respuesta.cita.estado === 'Pendiente') {
          this.mensajeError = 'La cita existe, pero primero debe ser confirmada.';
          return;
        }

        if (!this.pagoEncontrado && respuesta.cita.estado === 'Cancelada') {
          this.mensajeError = 'La cita está cancelada.';
          return;
        }

        if (!this.pagoEncontrado && respuesta.cita.estado === 'Atendida') {
          this.mensajeError = 'La cita ya fue atendida.';
          return;
        }
      })
      .catch(() => {
        this.mensajeError = 'Error de conexión al buscar la cita.';
      })
      .finally(() => {
        this.buscando = false;
        this.cdr.detectChanges();
      });
  }

  confirmarPago(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (!this.citaEncontrada) {
      this.mensajeError = 'Primero busque una cita.';
      this.cdr.detectChanges();
      return;
    }

    if (this.pagoEncontrado?.estado === 'Pagado') {
      this.mensajeError = 'Esta cita ya tiene un pago registrado.';
      this.cdr.detectChanges();
      return;
    }

    const confirmar = confirm(`¿Confirmar pago de S/ ${this.montoFijo} para la cita ${this.citaEncontrada.idCita}?`);

    if (!confirmar) {
      return;
    }

    this.procesando = true;
    this.cdr.detectChanges();

    this.pedir<RespuestaSimple>('registrarPago', {
      idCita: this.citaEncontrada.idCita,
      comprobante: this.comprobante.trim()
    })
      .then((respuesta) => {
        if (!respuesta.success) {
          this.mensajeError = respuesta.message || 'No se pudo confirmar el pago.';
          return;
        }

        this.mensajeExito = respuesta.message || 'Pago confirmado correctamente.';
        this.comprobante = '';
        this.buscarCita();
        this.cargarPagos();
      })
      .catch(() => {
        this.mensajeError = 'Error de conexión al confirmar pago.';
      })
      .finally(() => {
        this.procesando = false;
        this.cdr.detectChanges();
      });
  }

  anularPago(pago: Pago): void {
    if (pago.estado !== 'Pagado') {
      this.mensajeError = 'Solo se pueden anular pagos registrados.';
      this.cdr.detectChanges();
      return;
    }

    const confirmar = confirm(`¿Anular el pago ${pago.idPago}?`);

    if (!confirmar) {
      return;
    }

    this.procesando = true;
    this.cdr.detectChanges();

    this.pedir<RespuestaSimple>('anularPago', { idPago: pago.idPago })
      .then((respuesta) => {
        if (!respuesta.success) {
          this.mensajeError = respuesta.message || 'No se pudo anular el pago.';
          return;
        }

        this.mensajeExito = respuesta.message || 'Pago anulado correctamente.';
        this.cargarPagos();

        if (this.codigoCita) {
          this.buscarCita();
        }
      })
      .catch(() => {
        this.mensajeError = 'Error de conexión al anular pago.';
      })
      .finally(() => {
        this.procesando = false;
        this.cdr.detectChanges();
      });
  }

  limpiarBusqueda(): void {
    this.codigoCita = '';
    this.comprobante = '';
    this.citaEncontrada = null;
    this.pagoEncontrado = null;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.cdr.detectChanges();
  }

  contarPorEstado(estado: EstadoPago): number {
    return this.pagos.filter((pago) => pago.estado === estado).length;
  }

  clasePago(estado: string): string {
    if (estado === 'Pagado') {
      return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (estado === 'Anulado') {
      return 'border-red-200 bg-red-100 text-red-700';
    }

    return 'border-amber-200 bg-amber-100 text-amber-700';
  }

  claseCita(estado: string): string {
    if (estado === 'Confirmada') {
      return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }

    if (estado === 'Pagada') {
      return 'border-indigo-200 bg-indigo-100 text-indigo-700';
    }

    if (estado === 'Atendida') {
      return 'border-sky-200 bg-sky-100 text-sky-700';
    }

    if (estado === 'Cancelada') {
      return 'border-red-200 bg-red-100 text-red-700';
    }

    return 'border-amber-200 bg-amber-100 text-amber-700';
  }

  puedeConfirmarPago(): boolean {
    return !!this.citaEncontrada && !!this.pagoEncontrado && this.pagoEncontrado.estado === 'Pendiente';
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
