import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Cita {
  idCita: number;
  fecha: string;
  hora: string;
  estado: 'Pendiente' | 'Confirmada' | 'Atendida' | 'Cancelada';
  motivoConsulta: string;
  obserrvaciones: string;
}

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './citas.html',
  styleUrl: './citas.css'
})
export class Citas {
  busqueda = '';
  filtroEstado = 'Todos';

  nuevaCita: Cita = {
    idCita: 0,
    fecha: '',
    hora: '',
    estado: 'Pendiente',
    motivoConsulta: '',
    obserrvaciones: ''
  };

  citas: Cita[] = [
    {
      idCita: 1,
      fecha: '2026-05-26',
      hora: '09:00',
      estado: 'Pendiente',
      motivoConsulta: 'Consulta oftalmológica general',
      obserrvaciones: 'Paciente solicita evaluación inicial.'
    },
    {
      idCita: 2,
      fecha: '2026-05-26',
      hora: '10:30',
      estado: 'Confirmada',
      motivoConsulta: 'Medida de vista',
      obserrvaciones: 'Paciente indica dificultad para ver de lejos.'
    },
    {
      idCita: 3,
      fecha: '2026-05-27',
      hora: '15:00',
      estado: 'Atendida',
      motivoConsulta: 'Ojo rojo',
      obserrvaciones: 'Se realizó revisión básica.'
    }
  ];

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
      this.agregarCitaRapida();
    }
  }

  get citasFiltradas(): Cita[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.citas
      .filter((cita) => {
        const coincideTexto =
          cita.idCita.toString().includes(texto) ||
          cita.fecha.toLowerCase().includes(texto) ||
          cita.hora.toLowerCase().includes(texto) ||
          cita.estado.toLowerCase().includes(texto) ||
          cita.motivoConsulta.toLowerCase().includes(texto) ||
          cita.obserrvaciones.toLowerCase().includes(texto);

        const coincideEstado =
          this.filtroEstado === 'Todos' || cita.estado === this.filtroEstado;

        return coincideTexto && coincideEstado;
      })
      .sort((a, b) => b.idCita - a.idCita);
  }

  registrarCita(): void {
    if (
      !this.nuevaCita.fecha ||
      !this.nuevaCita.hora ||
      !this.nuevaCita.motivoConsulta
    ) {
      alert('Complete la fecha, hora y motivo de consulta.');
      return;
    }

    const citaGenerada: Cita = {
      idCita: this.generarId(),
      fecha: this.nuevaCita.fecha,
      hora: this.nuevaCita.hora,
      estado: 'Pendiente',
      motivoConsulta: this.nuevaCita.motivoConsulta,
      obserrvaciones: this.nuevaCita.obserrvaciones
    };

    this.citas.unshift(citaGenerada);
    this.limpiarFormulario();
  }

  agregarCitaRapida(): void {
    const citaRapida: Cita = {
      idCita: this.generarId(),
      fecha: '2026-05-27',
      hora: '15:00',
      estado: 'Pendiente',
      motivoConsulta: 'qwe',
      obserrvaciones: 'qweqwe'
    };

    this.citas.unshift(citaRapida);
  }

  confirmarCita(cita: Cita): void {
    cita.estado = 'Confirmada';
  }

  atenderCita(cita: Cita): void {
    cita.estado = 'Atendida';
  }

  cancelarCita(cita: Cita): void {
    cita.estado = 'Cancelada';
  }

  reprogramarCita(cita: Cita): void {
    const nuevaFecha = prompt('Ingrese la nueva fecha:', cita.fecha);
    const nuevaHora = prompt('Ingrese la nueva hora:', cita.hora);

    if (!nuevaFecha || !nuevaHora) {
      return;
    }

    cita.fecha = nuevaFecha;
    cita.hora = nuevaHora;
    cita.estado = 'Pendiente';
  }

  eliminarCita(idCita: number): void {
    const confirmar = confirm('¿Desea eliminar esta cita?');

    if (!confirmar) {
      return;
    }

    this.citas = this.citas.filter((cita) => cita.idCita !== idCita);
  }

  limpiarFormulario(): void {
    this.nuevaCita = {
      idCita: 0,
      fecha: '',
      hora: '',
      estado: 'Pendiente',
      motivoConsulta: '',
      obserrvaciones: ''
    };
  }

  contarPorEstado(estado: Cita['estado']): number {
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

    return 'border-amber-200 bg-amber-100 text-amber-700';
  }

  private generarId(): number {
    if (this.citas.length === 0) {
      return 1;
    }

    return Math.max(...this.citas.map((cita) => cita.idCita)) + 1;
  }
}