import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Paciente {
  idPaciente: number;
  nombre: string;
  dni: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
}

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class Pacientes {
  busqueda = '';

  pacienteSeleccionado: Paciente | null = null;
  modoEdicion = false;

  nuevoPaciente: Paciente = {
    idPaciente: 0,
    nombre: '',
    dni: '',
    direccion: '',
    telefono: '',
    fechaNacimiento: ''
  };

  pacientes: Paciente[] = [
    {
      idPaciente: 1,
      nombre: 'yemm',
      dni: '10203040',
      direccion: 'Ayacucho',
      telefono: '999000999',
      fechaNacimiento: '2000-01-01'
    }
  ];

  get pacientesFiltrados(): Paciente[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.pacientes.filter((paciente) => {
      return (
        paciente.idPaciente.toString().includes(texto) ||
        paciente.nombre.toLowerCase().includes(texto) ||
        paciente.dni.toLowerCase().includes(texto) ||
        paciente.direccion.toLowerCase().includes(texto) ||
        paciente.telefono.toLowerCase().includes(texto) ||
        paciente.fechaNacimiento.toLowerCase().includes(texto)
      );
    });
  }

  registrarPaciente(): void {
    if (
      !this.nuevoPaciente.nombre ||
      !this.nuevoPaciente.dni ||
      !this.nuevoPaciente.direccion ||
      !this.nuevoPaciente.telefono ||
      !this.nuevoPaciente.fechaNacimiento
    ) {
      alert('Complete todos los datos del paciente.');
      return;
    }

    const dniExiste = this.pacientes.some((paciente) => {
      return paciente.dni === this.nuevoPaciente.dni && paciente.idPaciente !== this.nuevoPaciente.idPaciente;
    });

    if (dniExiste) {
      alert('Ya existe un paciente registrado con ese DNI.');
      return;
    }

    if (this.modoEdicion) {
      this.actualizarPaciente();
      return;
    }

    const pacienteGenerado: Paciente = {
      idPaciente: this.generarId(),
      nombre: this.nuevoPaciente.nombre.trim(),
      dni: this.nuevoPaciente.dni.trim(),
      direccion: this.nuevoPaciente.direccion.trim(),
      telefono: this.nuevoPaciente.telefono.trim(),
      fechaNacimiento: this.nuevoPaciente.fechaNacimiento
    };

    this.pacientes.unshift(pacienteGenerado);
    this.limpiarFormulario();
  }

  editarPaciente(paciente: Paciente): void {
    this.modoEdicion = true;

    this.nuevoPaciente = {
      idPaciente: paciente.idPaciente,
      nombre: paciente.nombre,
      dni: paciente.dni,
      direccion: paciente.direccion,
      telefono: paciente.telefono,
      fechaNacimiento: paciente.fechaNacimiento
    };
  }

  actualizarPaciente(): void {
    const indice = this.pacientes.findIndex((paciente) => {
      return paciente.idPaciente === this.nuevoPaciente.idPaciente;
    });

    if (indice === -1) {
      alert('No se encontró el paciente.');
      return;
    }

    this.pacientes[indice] = {
      idPaciente: this.nuevoPaciente.idPaciente,
      nombre: this.nuevoPaciente.nombre.trim(),
      dni: this.nuevoPaciente.dni.trim(),
      direccion: this.nuevoPaciente.direccion.trim(),
      telefono: this.nuevoPaciente.telefono.trim(),
      fechaNacimiento: this.nuevoPaciente.fechaNacimiento
    };

    this.limpiarFormulario();
  }

  verPaciente(paciente: Paciente): void {
    this.pacienteSeleccionado = paciente;
  }

  cerrarDetalle(): void {
    this.pacienteSeleccionado = null;
  }

  eliminarPaciente(idPaciente: number): void {
    const confirmar = confirm('¿Desea eliminar este paciente?');

    if (!confirmar) {
      return;
    }

    this.pacientes = this.pacientes.filter((paciente) => {
      return paciente.idPaciente !== idPaciente;
    });

    if (this.pacienteSeleccionado?.idPaciente === idPaciente) {
      this.pacienteSeleccionado = null;
    }

    if (this.nuevoPaciente.idPaciente === idPaciente) {
      this.limpiarFormulario();
    }
  }

  limpiarFormulario(): void {
    this.modoEdicion = false;

    this.nuevoPaciente = {
      idPaciente: 0,
      nombre: '',
      dni: '',
      direccion: '',
      telefono: '',
      fechaNacimiento: ''
    };
  }

  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) {
      return 0;
    }

    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  private generarId(): number {
    if (this.pacientes.length === 0) {
      return 1;
    }

    return Math.max(...this.pacientes.map((paciente) => paciente.idPaciente)) + 1;
  }
}