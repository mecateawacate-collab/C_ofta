import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface HistoriaClinica {
  idHistoria: number;
  fechaRegistro: string;
  diagnosticoVisual: string;
  agudezaVisual: string;
  tratamiento: string;
  receta: string;
  observaciones: string;
}

@Component({
  selector: 'app-historia',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './historia.html',
  styleUrl: './historia.css'
})
export class Historia {
  busqueda = '';

  modoEdicion = false;
  historiaSeleccionada: HistoriaClinica | null = null;

  nuevaHistoria: HistoriaClinica = {
    idHistoria: 0,
    fechaRegistro: '',
    diagnosticoVisual: '',
    agudezaVisual: '',
    tratamiento: '',
    receta: '',
    observaciones: ''
  };

  historias: HistoriaClinica[] = [
    {
      idHistoria: 1,
      fechaRegistro: '2026-05-25',
      diagnosticoVisual: 'Evaluación visual inicial',
      agudezaVisual: 'OD 20/40 - OI 20/30',
      tratamiento: 'Uso de lentes correctivos y control oftalmológico',
      receta: 'Lentes correctivos según medida indicada',
      observaciones: 'Historia clínica creada para el paciente yemm con DNI 10203040.'
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
      this.agregarHistoriaRapida();
    }
  }

  get historiasFiltradas(): HistoriaClinica[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.historias
      .filter((historia) => {
        return (
          historia.idHistoria.toString().includes(texto) ||
          historia.fechaRegistro.toLowerCase().includes(texto) ||
          historia.diagnosticoVisual.toLowerCase().includes(texto) ||
          historia.agudezaVisual.toLowerCase().includes(texto) ||
          historia.tratamiento.toLowerCase().includes(texto) ||
          historia.receta.toLowerCase().includes(texto) ||
          historia.observaciones.toLowerCase().includes(texto)
        );
      })
      .sort((a, b) => b.idHistoria - a.idHistoria);
  }

  registrarHistoria(): void {
    if (
      !this.nuevaHistoria.fechaRegistro ||
      !this.nuevaHistoria.diagnosticoVisual ||
      !this.nuevaHistoria.agudezaVisual ||
      !this.nuevaHistoria.tratamiento ||
      !this.nuevaHistoria.receta
    ) {
      alert('Complete los campos principales de la historia clínica.');
      return;
    }

    if (this.modoEdicion) {
      this.actualizarHistoria();
      return;
    }

    const historiaGenerada: HistoriaClinica = {
      idHistoria: this.generarId(),
      fechaRegistro: this.nuevaHistoria.fechaRegistro,
      diagnosticoVisual: this.nuevaHistoria.diagnosticoVisual.trim(),
      agudezaVisual: this.nuevaHistoria.agudezaVisual.trim(),
      tratamiento: this.nuevaHistoria.tratamiento.trim(),
      receta: this.nuevaHistoria.receta.trim(),
      observaciones: this.nuevaHistoria.observaciones.trim()
    };

    this.historias.unshift(historiaGenerada);
    this.limpiarFormulario();
  }

  agregarHistoriaRapida(): void {
    const historiaRapida: HistoriaClinica = {
      idHistoria: this.generarId(),
      fechaRegistro: '2026-05-25',
      diagnosticoVisual: 'qwe',
      agudezaVisual: '20/20',
      tratamiento: 'qwe',
      receta: 'qwe',
      observaciones: 'qweqwe'
    };

    this.historias.unshift(historiaRapida);
  }

  editarHistoria(historia: HistoriaClinica): void {
    this.modoEdicion = true;

    this.nuevaHistoria = {
      idHistoria: historia.idHistoria,
      fechaRegistro: historia.fechaRegistro,
      diagnosticoVisual: historia.diagnosticoVisual,
      agudezaVisual: historia.agudezaVisual,
      tratamiento: historia.tratamiento,
      receta: historia.receta,
      observaciones: historia.observaciones
    };
  }

  actualizarHistoria(): void {
    const indice = this.historias.findIndex((historia) => {
      return historia.idHistoria === this.nuevaHistoria.idHistoria;
    });

    if (indice === -1) {
      alert('No se encontró la historia clínica.');
      return;
    }

    this.historias[indice] = {
      idHistoria: this.nuevaHistoria.idHistoria,
      fechaRegistro: this.nuevaHistoria.fechaRegistro,
      diagnosticoVisual: this.nuevaHistoria.diagnosticoVisual.trim(),
      agudezaVisual: this.nuevaHistoria.agudezaVisual.trim(),
      tratamiento: this.nuevaHistoria.tratamiento.trim(),
      receta: this.nuevaHistoria.receta.trim(),
      observaciones: this.nuevaHistoria.observaciones.trim()
    };

    this.limpiarFormulario();
  }

  verHistoria(historia: HistoriaClinica): void {
    this.historiaSeleccionada = historia;
  }

  cerrarDetalle(): void {
    this.historiaSeleccionada = null;
  }

  eliminarHistoria(idHistoria: number): void {
    const confirmar = confirm('¿Desea eliminar esta historia clínica?');

    if (!confirmar) {
      return;
    }

    this.historias = this.historias.filter((historia) => {
      return historia.idHistoria !== idHistoria;
    });

    if (this.historiaSeleccionada?.idHistoria === idHistoria) {
      this.historiaSeleccionada = null;
    }

    if (this.nuevaHistoria.idHistoria === idHistoria) {
      this.limpiarFormulario();
    }
  }

  limpiarFormulario(): void {
    this.modoEdicion = false;

    this.nuevaHistoria = {
      idHistoria: 0,
      fechaRegistro: '',
      diagnosticoVisual: '',
      agudezaVisual: '',
      tratamiento: '',
      receta: '',
      observaciones: ''
    };
  }

  private generarId(): number {
    if (this.historias.length === 0) {
      return 1;
    }

    return Math.max(...this.historias.map((historia) => historia.idHistoria)) + 1;
  }
}