import { Component, OnDestroy, OnInit } from '@angular/core';
import { transactions, lineColumAreaChart, revenueColumnChart, customerRadialBarChart, orderRadialBarChart, growthColumnChart, } from './data';
import { ChartType } from './dashboard.model';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import { Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/animations/fade-in-right.animation';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { interval, Subscription } from 'rxjs';

type Sev = 'critico' | 'alta' | 'media' | 'baja';

@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss'],
  animations: [fadeInRightAnimation, fadeInUpAnimation],
})
export class DefaultComponent implements OnInit, OnDestroy {
  ahora = new Date();
  private sub?: Subscription;

  // KPIs superiores (título, icono, valor, pie en HTML)
  kpiTop = [
    { title: 'Ingresos del día', icon: 'paid',
      value: this.currency(405000), foot: `vs ayer <strong class="text-ok">+8.3%</strong>` },
    { title: 'Pasajeros validados hoy', icon: 'verified_user',
      value: this.number(18600), foot: 'Últimas 24 h' },
    { title: 'Ticket promedio', icon: 'confirmation_number',
      value: this.currency(21.77), foot: 'Hoy' },
    { title: '% Pagos electrónicos', icon: 'payments',
      value: this.percent(0.863), foot: `Efectivo: ${this.percent(1-0.863)}` },
  ];

  topRutas = [
    { ruta: 'R-06', monto: 197775, pasajeros: 9083, ticket: 21.77 },
    { ruta: 'R-02', monto: 196512, pasajeros: 9025, ticket: 21.77 },
    { ruta: 'R-03', monto: 176458, pasajeros: 8104, ticket: 21.77 },
    { ruta: 'R-05', monto: 175565, pasajeros: 8063, ticket: 21.77 },
    { ruta: 'R-04', monto: 166551, pasajeros: 7649, ticket: 21.77 },
  ];

  alertasDispositivos: Array<{nombre:string; detalle:string; severidad:Sev; tag:string}> = [
    { nombre:'Validador A-102', detalle:'Sin posición > 20 min', severidad:'critico', tag:'CRÍTICO' },
    { nombre:'Validador C-331', detalle:'Validaciones ~0 en 07:00–09:00', severidad:'alta', tag:'ALTA' },
    { nombre:'Validador B-219', detalle:'Estatus ≠ 1', severidad:'media', tag:'MEDIA' },
  ];

  ingresosHora = Array.from({length:24}, (_,h)=>({
    hora: `${String(h).padStart(2,'0')}:00`,
    ingresos: [10,13,15,16,17,32,30,28,26,24,20,17,14,11,10,10,10,11,12,14,16,18,20,24][h]*1000,
    ticket: 21.77,
  }));

  pagoDistrib = [
    { metodo:'EMV', valor:56 },
    { metodo:'Monedero', valor:28 },
    { metodo:'QR', valor:10 },
    { metodo:'Cortesía / Otros', valor:6 },
  ];

  ascensosVsBoletos = Array.from({length:24}, (_,h)=>({
    hora:`${String(h).padStart(2,'0')}:00`,
    ascensos: 200 + Math.round(Math.sin(h/3)*60) + h*4,
    boletos:  210 + Math.round(Math.cos(h/3)*55) + h*4,
  }));

  histPuntualidad = [
    { bucket:'< -10', conteo:12 }, { bucket:'-10 a -5', conteo:30 },
    { bucket:'-5 a 0', conteo:52 }, { bucket:'0 a +5', conteo:64 },
    { bucket:'+5 a +10', conteo:28 }, { bucket:'> +10', conteo:9 },
  ];

  ngOnInit(){ this.sub = interval(60_000).subscribe(()=> this.ahora = new Date()); }
  ngOnDestroy(){ this.sub?.unsubscribe(); }

  // Helpers de formato (para los KPIs demo)
  private currency(v:number){ return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits: v<100?2:0}).format(v); }
  private percent(v:number){ return new Intl.NumberFormat('es-MX',{style:'percent',maximumFractionDigits:1}).format(v); }
  private number(v:number){ return new Intl.NumberFormat('es-MX').format(v); }
}