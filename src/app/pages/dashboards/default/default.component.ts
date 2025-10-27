import { Component, OnDestroy, OnInit } from '@angular/core';
import { transactions, lineColumAreaChart, revenueColumnChart, customerRadialBarChart, orderRadialBarChart, growthColumnChart, } from './data';
import { ChartType } from './dashboard.model';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import { Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/animations/fade-in-right.animation';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { interval, Subscription } from 'rxjs';

type Tx = { hora: number; monto: number; tipo: 'DEBITO'|'CREDITO'; monedero?: string; ruta: string };
type Dispositivo = { nombre: string; tipo: 'critico'|'advertencia'|'info'; motivo: string; minSinPos: number; estatus: number };

@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss'],
  animations: [fadeInRightAnimation, fadeInUpAnimation],
})
export class DefaultComponent implements OnInit {
  palette = ['#19b394','#22d3ee','#5aa6ff','#7dd3fc','#93c5fd','#16a34a','#f59e0b','#ef4444'];

  kpis: { t: string; v: any; s: string }[] = [];
  rutas = ['Ruta Centro','Ruta Norte','Ruta Sur','Ruta Express','Ruta Aeropuerto','Ruta Oriente','Ruta Poniente'];
  monederos = Array.from({ length: 120 }, (_, i) => `MON${i + 1}`);

  transaccionesHoy: Tx[] = [];
  conteosAsc: { hora: number; ascensos: number }[] = [];

  dsIngresosHora: { hora: string; ingreso: number; ticket: number }[] = [];
  dsBrecha: { hora: string; ascensos: number; boletos: number }[] = [];
  dsMediosPago: { medio: string; valor: number }[] = [];
  dsPuntualidad: { bin: string; viajes: number }[] = [];

  topRutas: { nombre: string; ingresos: number; viajes: number }[] = [];
  dispositivosConAlertas: Dispositivo[] = [];

  // Series (una por ruta)
// ===== Pasajeros por ruta (FIJO) =====
seriesPasajeros = [
  { valueField: 'centro',  name: 'Ruta Centro'  },
  { valueField: 'aeropuerto', name: 'Ruta Aeropuerto' },
  { valueField: 'oriente', name: 'Ruta Oriente' },
  { valueField: 'poniente', name: 'Ruta Poniente' },
  { valueField: 'norte',   name: 'Ruta Norte'   },
];

dsPasajerosPorHora = [
  { hora: '05:00', centro:  9, aeropuerto:  5, oriente: 12, poniente:  7, norte:  6 },
  { hora: '06:00', centro: 18, aeropuerto: 10, oriente: 26, poniente: 14, norte: 12 },
  { hora: '07:00', centro: 36, aeropuerto: 20, oriente: 48, poniente: 28, norte: 25 },
  { hora: '08:00', centro: 40, aeropuerto: 22, oriente: 54, poniente: 30, norte: 28 },
  { hora: '09:00', centro: 29, aeropuerto: 16, oriente: 38, poniente: 21, norte: 20 },
  { hora: '10:00', centro: 24, aeropuerto: 12, oriente: 30, poniente: 17, norte: 17 },
  { hora: '11:00', centro: 22, aeropuerto: 11, oriente: 28, poniente: 16, norte: 16 },
  { hora: '12:00', centro: 26, aeropuerto: 13, oriente: 33, poniente: 18, norte: 19 },
  { hora: '13:00', centro: 32, aeropuerto: 15, oriente: 41, poniente: 22, norte: 23 },
  { hora: '14:00', centro: 36, aeropuerto: 17, oriente: 47, poniente: 24, norte: 26 },
  { hora: '15:00', centro: 34, aeropuerto: 16, oriente: 44, poniente: 23, norte: 25 },
  { hora: '16:00', centro: 30, aeropuerto: 15, oriente: 39, poniente: 21, norte: 22 },
  { hora: '17:00', centro: 27, aeropuerto: 14, oriente: 35, poniente: 19, norte: 20 },
];



  etiquetasOriginales: string[] = [
    'BlueVoxs - Contadores',
    'Derroteros - Variantes',
    'Dispositivos - Validadores',
    'Pin - Codigo',
    'Regiones - Zonas'
  ];

  ngOnInit(): void {
    this.fabricarDatos();
    this.armarFuentes();
    this.calcularKPIs();
  }

  private fabricarDatos(): void {
    const horas = Array.from({ length: 16 }, (_, i) => i + 5);
    for (const h of horas) {
      const txCount = Math.floor(5 + Math.random() * 35);
      for (let i = 0; i < txCount; i++) {
        const esDebito = Math.random() > 0.15;
        const ruta = this.rutas[Math.floor(Math.random() * this.rutas.length)];
        const monto = esDebito ? [8, 9.5, 10, 12][Math.floor(Math.random() * 4)] : 0;
        const mon = Math.random() > 0.2 ? this.monederos[Math.floor(Math.random() * this.monederos.length)] : undefined;
        this.transaccionesHoy.push({ hora: h, monto, tipo: esDebito ? 'DEBITO' : 'CREDITO', monedero: mon, ruta });
      }
      const asc = Math.floor(10 + Math.random() * 60);
      this.conteosAsc.push({ hora: h, ascensos: asc });
    }
    this.dispositivosConAlertas = [
      { nombre: 'VAL-102', tipo: 'critico', motivo: 'Sin posición', minSinPos: 38, estatus: 2 },
      { nombre: 'BVX-21', tipo: 'advertencia', motivo: 'Validaciones bajas', minSinPos: 6, estatus: 1 },
      { nombre: 'VAL-077', tipo: 'critico', motivo: 'Sin validar', minSinPos: 52, estatus: 3 },
      { nombre: 'GPS-331', tipo: 'info', motivo: 'Batería baja', minSinPos: 3, estatus: 1 },
      { nombre: 'VAL-188', tipo: 'advertencia', motivo: 'Ping irregular', minSinPos: 14, estatus: 1 }
    ];
  }

  

  private armarFuentes(): void {
    const horas = Array.from(new Set(this.transaccionesHoy.map(t => t.hora))).sort((a, b) => a - b);

    this.dsIngresosHora = horas.map(h => {
      const deb = this.transaccionesHoy.filter(t => t.tipo === 'DEBITO' && t.hora === h);
      const ingreso = deb.reduce((s, t) => s + t.monto, 0);
      const unicos = new Set(deb.filter(x => !!x.monedero).map(x => x.monedero));
      const ticket = unicos.size ? +(ingreso / unicos.size).toFixed(2) : 0;
      return { hora: `${h}:00`, ingreso, ticket };
    });

    const ingresosPorRuta = this.rutas.map(nombre => {
      const txRuta = this.transaccionesHoy.filter(t => t.tipo === 'DEBITO' && t.ruta === nombre);
      const ingresos = txRuta.reduce((s, t) => s + t.monto, 0);
      const viajes = Math.max(1, Math.floor(txRuta.length / 25));
      return { nombre, ingresos, viajes };
    }).sort((a, b) => b.ingresos - a.ingresos);

    this.topRutas = ingresosPorRuta.slice(0, 5);

    const keys = this.topRutas.map((_, i) => `r${i}`);
    const rows = horas.map(h => ({ hora: `${h}:00` } as any));

    rows.forEach((row, idx) => {
      const H = horas[idx];
      this.topRutas.forEach((r, i) => {
        const unicos = new Set(
          this.transaccionesHoy
            .filter(t => t.ruta === r.nombre && t.tipo === 'DEBITO' && t.hora === H && !!t.monedero)
            .map(t => t.monedero)
        );
        row[keys[i]] = unicos.size;
      });
    });

    this.dsBrecha = horas.map(h => {
      const asc = this.conteosAsc.find(x => x.hora === h)?.ascensos ?? 0;
      const boletos = new Set(
        this.transaccionesHoy.filter(t => t.tipo === 'DEBITO' && t.hora === h && !!t.monedero).map(t => t.monedero)
      ).size;
      return { hora: `${h}:00`, ascensos: asc, boletos };
    });

    const electronicos = this.transaccionesHoy.filter(t => t.tipo === 'DEBITO' && !!t.monedero).length;
    const ascensos = this.conteosAsc.reduce((s, c) => s + c.ascensos, 0);
    const boletos = new Set(this.transaccionesHoy.filter(t => t.tipo === 'DEBITO' && !!t.monedero).map(t => t.monedero)).size;
    const efectivo = Math.max(ascensos - boletos, 0);
    this.dsMediosPago = [
      { medio: renombrarEstatico('Monedero'), valor: electronicos },
      { medio: renombrarEstatico('Efectivo'), valor: efectivo }
    ];

    const bins = ['<-10m', '-10 a -5', '-5 a 0', '0 a +5', '+5 a +10', '>+10'];
    this.dsPuntualidad = bins.map(b => ({ bin: b, viajes: Math.floor(3 + Math.random() * 20) }));
  }

  private calcularKPIs(): void {
    const debitos = this.transaccionesHoy.filter(t => t.tipo === 'DEBITO');
    const ingresosDelDia = debitos.reduce((s, t) => s + t.monto, 0);
    const tarjetasUnicas = Array.from(new Set(debitos.filter(d => !!d.monedero).map(d => d.monedero!)));
    const pasajerosValidados = tarjetasUnicas.length;
    const ticket = pasajerosValidados ? ingresosDelDia / pasajerosValidados : 0;
    const ascensos = this.conteosAsc.reduce((s, c) => s + c.ascensos, 0);
    const efectivo = Math.max(ascensos - pasajerosValidados, 0);
    const electronicos = debitos.filter(d => !!d.monedero).length;
    const totalMedios = electronicos + efectivo;
    const pctElec = totalMedios ? Math.round((electronicos / totalMedios) * 100) : 0;
    const pctEfec = 100 - pctElec;
    const unidadesTotales = 42;
    const unidadesServ = Math.floor(unidadesTotales * (0.6 + Math.random() * 0.35));
    const turnosInicio = Math.floor(30 + Math.random() * 20);
    const turnosFin = Math.floor(turnosInicio * (0.75 + Math.random() * 0.2));
    const cumplimiento = Math.round((turnosFin / turnosInicio) * 100);
    const ocupacion = Math.round((0.35 + Math.random() * 0.4) * 100);

    this.kpis = [
      { t: 'Ingresos del día (MXN)', v: ingresosDelDia.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }), s: `${debitos.length} movimientos` },
      { t: 'Pasajeros validados hoy', v: pasajerosValidados, s: `${tarjetasUnicas.length} monederos únicos` },
      { t: 'Ticket promedio', v: ticket.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }), s: 'Hoy' },
      { t: '% Pagos electrónicos vs efectivo', v: `${pctElec}% / ${pctEfec}%`, s: `${ascensos} ascensos • ${pasajerosValidados} validados` },
      { t: 'Validaciones', v: `${debitos.length} / ${Math.floor(5 + Math.random() * 20)} fallidas`, s: 'Hoy' },
      { t: 'Unidades en servicio / total', v: `${unidadesServ} / ${unidadesTotales}`, s: 'Últimos 15 min' },
      { t: 'Cumplimiento de turnos', v: `${cumplimiento}%`, s: `${turnosFin}/${turnosInicio} cerrados` },
      { t: 'Ocupación promedio (proxy)', v: `${ocupacion}%`, s: 'Capacidad teórica 35' }
    ];
  }

  renombrar(txt: string): string {
    if (!txt) return '';
    const rxPairRight = /\s*-\s*(Validadores|Contadores|Zonas|Variantes)\b/gi;
    const rxPairLeft = /\b(Validadores|Contadores|Zonas|Variantes)\s*-\s*/gi;
    let out = txt.replace(rxPairRight, '').replace(rxPairLeft, '');
    out = out.replace(/\b(Validadores|Contadores|Zonas|Variantes)\b/gi, '');
    out = out.replace(/\s*-\s*$/g, '').replace(/^\s*-\s*/g, '').replace(/\s{2,}/g, ' ').trim();
    return out;
  }

  customizeIngresosTooltip = (arg: any) => {
    const d = arg.point?.data || arg.point?.tag || arg;
    const ingreso = (d?.ingreso ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    const ticket = (d?.ticket ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    return { text: `${arg.argumentText}\nIngresos: ${ingreso}\nTicket: ${ticket}` };
  };
}

function renombrarEstatico(txt: string): string {
  if (!txt) return '';
  const rxPairRight = /\s*-\s*(Validadores|Contadores|Zonas|Variantes)\b/gi;
  const rxPairLeft = /\b(Validadores|Contadores|Zonas|Variantes)\s*-\s*/gi;
  let out = txt.replace(rxPairRight, '').replace(rxPairLeft, '');
  out = out.replace(/\b(Validadores|Contadores|Zonas|Variantes)\b/gi, '');
  out = out.replace(/\s*-\s*$/g, '').replace(/^\s*-\s*/g, '').replace(/\s{2,}/g, ' ').trim();
  return out;
}