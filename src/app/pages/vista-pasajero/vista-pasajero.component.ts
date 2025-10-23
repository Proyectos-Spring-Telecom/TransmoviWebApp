import { Component } from '@angular/core';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

@Component({
  selector: 'app-vista-pasajero',
  templateUrl: './vista-pasajero.component.html',
  styleUrl: './vista-pasajero.component.scss',
  animations: [fadeInUpAnimation],
})
export class VistaPasajeroComponent {

  saldo = 9876.33;

transacciones = [
  { fechaHora: new Date('2025-10-20T13:30:00'), estatus: 'Recarga', monto: 100, ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T13:35:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T13:40:00'), estatus: 'Recarga', monto: 20,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T13:45:00'), estatus: 'Débito',  monto: 15,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T13:50:00'), estatus: 'Débito',  monto: 15,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T13:55:00'), estatus: 'Recarga', monto: 20,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:00:00'), estatus: 'Débito',  monto: 15,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:05:00'), estatus: 'Débito',  monto: 15,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:10:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:15:00'), estatus: 'Recarga', monto: 20,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:10:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:10:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:10:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:10:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:10:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:10:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:10:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:10:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  { fechaHora: new Date('2025-10-20T14:10:00'), estatus: 'Recarga', monto: 50,  ns: '123456789ABCDEFG' },
  
];

monederos = [
  { ns: '123456789ABCDEFG', alias: 'Principal',  estatus: 'Activo',   saldo: 9876 },
  { ns: '987654321ZYXWVUT', alias: 'Secundario', estatus: 'Inactivo', saldo: 135 },
  { ns: 'A1B2C3D4E5F6G7H8', alias: 'Viajes',     estatus: 'Activo',   saldo: 820 },
  { ns: 'Z9Y8X7W6V5U4T3S2', alias: 'Oficina',    estatus: 'Activo',   saldo: 430 },
  { ns: 'M1N2B3V4C5X6Z7Y8', alias: 'Familia',    estatus: 'Inactivo', saldo: 0 },
  { ns: 'Q1W2E3R4T5Y6U7I8', alias: 'Eventos',    estatus: 'Activo',   saldo: 215 },
  { ns: 'P9O8I7U6Y5T4R3E2', alias: 'Compras',    estatus: 'Activo',   saldo: 1270 },
  { ns: 'L1K2J3H4G5F6D7S8', alias: 'Servicios',  estatus: 'Inactivo', saldo: 50 },
  { ns: 'C1V2B3N4M5A6S7D8', alias: 'Proyectos',  estatus: 'Activo',   saldo: 645 },
  { ns: 'T1R2E3W4Q5Y6U7I8', alias: 'Ahorros',    estatus: 'Activo',   saldo: 3200 }
];

ubicar(row: any) { }


}
