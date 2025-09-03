import { Component, OnInit } from '@angular/core';
import { transactions, lineColumAreaChart, revenueColumnChart, customerRadialBarChart, orderRadialBarChart, growthColumnChart, } from './data';
import { ChartType } from './dashboard.model';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import { Router } from '@angular/router';
import { fadeInRightAnimation } from 'src/app/core/animations/fade-in-right.animation';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss'],
  animations: [fadeInRightAnimation, fadeInUpAnimation],
})
export class DefaultComponent implements OnInit {
  gastoDiario = 1540.75;
  gastoMensual = 45200.9;
  totalPasajero = 40;
  totalOperadores = 18;
  totalVehiculos = 25;

  valoresGastos = {
    recargas: {
      dia: 1540.75,
      semana: 11045.5,
      mes: 32780.2
    },
    debitos: {
      dia: 45200.9,
      semana: 122501.3,
      mes: 480320.85
    }
  };


  resumenOriginal = [
    {
      key: 'recargas',
      valor: this.gastoDiario,
      icon: 'fas fa-coins',
      color: 'azul',
    },
    {
      key: 'debitos',
      valor: this.gastoMensual,
      icon: 'fas fa-wallet',
      color: 'morado',
    },
    {
      key: 'pasajeros',
      valor: this.totalPasajero + ' ' + 'Personas', 
      icon: 'fas fa-user-check',
      color: 'petroleo',
    },
    {
      key: 'dispositivos',
      valor: this.totalOperadores + ' ' + 'Móviles',
      icon: 'fas fa-tablet',
      color: 'verde',
    },
    {
      key: 'Unidades',
      valor: this.totalVehiculos + ' ' + 'Vehículos',
      icon: 'fas fa-truck',
      color: 'rojo',
    },
  ];


  resumen: any[] = [];

  resumenEntradasSalidasDia = [
    { tipo: 'Entradas', cantidad: 40 },
    { tipo: 'Salidas', cantidad: 25 },
  ];

  resumenEntradasSalidasSemana = [
    { tipo: 'Entradas', cantidad: 285 },
    { tipo: 'Salidas', cantidad: 176 },
  ];

  resumenEntradasSalidasMes = [
    { tipo: 'Entradas', cantidad: 1132 },
    { tipo: 'Salidas', cantidad: 842 },
  ];

  estadoDispositivosDia = [
    { estado: 'Conectados', cantidad: 15 },
    { estado: 'Desconectados', cantidad: 3 },
  ];

  estadoDispositivosSemana = [
    { estado: 'Conectados', cantidad: 97 },
    { estado: 'Desconectados', cantidad: 14 },
  ];

  estadoDispositivosMes = [
    { estado: 'Conectados', cantidad: 402 },
    { estado: 'Desconectados', cantidad: 36 },
  ];


  customizeLabel = (pointInfo: any) => {
    return `${pointInfo.argumentText}: ${pointInfo.value}`;
  };

  customizeDispositivoLabel = (pointInfo: any) => {
    return `${pointInfo.argumentText}: ${pointInfo.value}`;
  };

  customPalette = ['#112cb3', '#9B51E0'];

  listaMonederos: any[] = [];
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;

  listaRutas: any[] = [];

  onAgregarMonedero(): void {
    this.router.navigateByUrl('/monederos/lista-monederos');
  }

  irRutas(): void {
    this.router.navigateByUrl('/rutas/lista-rutas');
  }

  gastosMensualesData = [
    { mes: 'Enero', gasto: 32000 },
    { mes: 'Febrero', gasto: 28000 },
    { mes: 'Marzo', gasto: 35000 },
    { mes: 'Abril', gasto: 30000 },
    { mes: 'Mayo', gasto: 40000 },
    { mes: 'Junio', gasto: 37000 },
  ];

  coloresBarras = [
    '#1e3a8a',
    '#7c3aed',
    '#059669',
    '#b91c1c',
    '#f59e0b',
    '#3b82f6',
  ];

  chartData = [
    { dia: 'Lun', gasto: 1050 },
    { dia: 'Mar', gasto: 1125 },
    { dia: 'Mié', gasto: 980 },
    { dia: 'Jue', gasto: 1230 },
    { dia: 'Vie', gasto: 950 },
    { dia: 'Sáb', gasto: 0 },
    { dia: 'Dom', gasto: 0 },
  ];

  rutasRecientes = [
    {
      nombre: 'Galerías - Centro',
      fecha: '2025-06-08',
      distancia: '7.8 km',
      operadores: 2,
    },
    {
      nombre: 'Terminal - Norte',
      fecha: '2025-06-07',
      distancia: '5.1 km',
      operadores: 1,
    },
    {
      nombre: 'Estadio - Centro',
      fecha: '2025-06-06',
      distancia: '4.8 km',
      operadores: 2,
    },
  ];

  distribucionPorHoraDia = [
    { hora: '05:00', entradas: 6, salidas: 2 },
    { hora: '06:00', entradas: 12, salidas: 4 },
    { hora: '07:00', entradas: 20, salidas: 7 },
    { hora: '08:00', entradas: 28, salidas: 9 },
    { hora: '09:00', entradas: 24, salidas: 8 },
    { hora: '10:00', entradas: 18, salidas: 6 },
    { hora: '11:00', entradas: 15, salidas: 5 },
    { hora: '12:00', entradas: 10, salidas: 3 },
    { hora: '13:00', entradas: 14, salidas: 5 },
    { hora: '14:00', entradas: 17, salidas: 6 },
    { hora: '15:00', entradas: 22, salidas: 7 },
    { hora: '16:00', entradas: 19, salidas: 6 },
    { hora: '17:00', entradas: 21, salidas: 7 },
    { hora: '18:00', entradas: 16, salidas: 5 },
    { hora: '19:00', entradas: 10, salidas: 3 },
    { hora: '20:00', entradas: 6, salidas: 2 },
    { hora: '21:00', entradas: 2, salidas: 1 },
  ];

  distribucionPorHoraSemana = [
    { hora: 'Lunes', entradas: 112, salidas: 74 },
    { hora: 'Martes', entradas: 132, salidas: 95 },
    { hora: 'Miércoles', entradas: 141, salidas: 101 },
    { hora: 'Jueves', entradas: 125, salidas: 93 },
    { hora: 'Viernes', entradas: 155, salidas: 110 },
    { hora: 'Sábado', entradas: 104, salidas: 88 },
    { hora: 'Domingo', entradas: 86, salidas: 59 },
  ];

  distribucionPorHoraMes = [
    { hora: '01 Jun', entradas: 32, salidas: 22 },
    { hora: '02 Jun', entradas: 40, salidas: 27 },
    { hora: '03 Jun', entradas: 38, salidas: 25 },
    { hora: '04 Jun', entradas: 41, salidas: 30 },
    { hora: '05 Jun', entradas: 36, salidas: 24 },
    { hora: '06 Jun', entradas: 39, salidas: 28 },
    { hora: '07 Jun', entradas: 44, salidas: 33 },
    { hora: '08 Jun', entradas: 42, salidas: 30 },
    { hora: '09 Jun', entradas: 48, salidas: 35 },
    { hora: '10 Jun', entradas: 45, salidas: 32 },
    { hora: '11 Jun', entradas: 46, salidas: 34 },
    { hora: '12 Jun', entradas: 43, salidas: 29 },
    { hora: '13 Jun', entradas: 50, salidas: 38 },
    { hora: '14 Jun', entradas: 47, salidas: 33 },
    { hora: '15 Jun', entradas: 49, salidas: 36 },
    { hora: '16 Jun', entradas: 52, salidas: 39 },
    { hora: '17 Jun', entradas: 55, salidas: 41 },
    { hora: '18 Jun', entradas: 51, salidas: 37 },
    { hora: '19 Jun', entradas: 53, salidas: 40 },
    { hora: '20 Jun', entradas: 56, salidas: 42 },
    { hora: '21 Jun', entradas: 58, salidas: 44 },
    { hora: '22 Jun', entradas: 60, salidas: 46 },
    { hora: '23 Jun', entradas: 59, salidas: 45 },
    { hora: '24 Jun', entradas: 61, salidas: 47 },
    { hora: '25 Jun', entradas: 63, salidas: 48 },
    { hora: '26 Jun', entradas: 62, salidas: 46 },
    { hora: '27 Jun', entradas: 64, salidas: 49 },
    { hora: '28 Jun', entradas: 66, salidas: 50 },
    { hora: '29 Jun', entradas: 65, salidas: 51 },
    { hora: '30 Jun', entradas: 67, salidas: 52 },
  ];



  internetLanguagesDia = [
    { language: 'Recargas', percent: 1541 },
    { language: 'Débito', percent: 45201 },
  ];

  internetLanguagesSemana = [
    { language: 'Recargas', percent: 8751 },
    { language: 'Débito', percent: 122501 },
  ];

  internetLanguagesMes = [
    { language: 'Recargas', percent: 32780 },
    { language: 'Débito', percent: 480320 },
  ];


  customizeTransaccionLabel = (info: any) => {
    const valueFormatted = `$${info.value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
    })}`;
    return `${info.argumentText}: ${valueFormatted}`;
  };

  customizeLabelText = (info: any) => {
    const isMoneda = ['Recargas', 'Débitos'].includes(info.seriesName);
    return isMoneda ? `$${info.value}` : `${info.value}`;
  };

  customizeTooltip = (info: any) => {
    const isMoneda = ['Recargas', 'Débitos'].includes(info.seriesName);
    const formatted = isMoneda ? `$${info.value}` : `${info.value}`;
    return {
      text: `${info.argumentText} - ${info.seriesName}: ${formatted}`,
    };
  };

  lineColumAreaChart: ChartType;
  revenueColumnChart: ChartType;
  orderRadialBarChart: ChartType;
  customerRadialBarChart: ChartType;
  growthColumnChart: ChartType;
  transactions;
  breadCrumbItems: Array<{}>;

  constructor(
    private moneService: MonederosServices,
    private rutaSe: RutasService,
    private router: Router
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit() {
    this.periodo = 'dia';
    this.cambiarPeriodo('dia');
    this.actualizarResumen();
    // this.obtenerRutas();
    // this.obtenerMonederos();
    /**
     * Fetches the data
     */
    this.fetchData();
    this.breadCrumbItems = [
      { label: 'TransMovi' },
      { label: 'Dashboard', active: true },
    ];
  }

  /**
   * Fetches the data
   */
  private fetchData() {
    this.lineColumAreaChart = lineColumAreaChart;
    this.revenueColumnChart = revenueColumnChart;
    this.orderRadialBarChart = orderRadialBarChart;
    this.customerRadialBarChart = customerRadialBarChart;
    this.growthColumnChart = growthColumnChart;
    this.transactions = transactions;
  }

  customizePoint = (point: any) => {
    const index = this.gastosMensualesData.findIndex(
      (item) => item.mes === point.argument
    );
    return {
      color: this.coloresBarras[index % this.coloresBarras.length],
    };
  };

  obtenerMonederos() {
    this.moneService.obtenerMonederos().subscribe(
      (res: any) => {
        this.listaMonederos = res.monederos
          .sort((a, b) => b.Id - a.Id)
          .slice(0, 10);
      },
      (error) => {
        console.error('Error al obtener monederos:', error);
      }
    );
  }

  obtenerRutas() {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

    this.rutaSe.obtenerRutas().subscribe((response) => {
      this.listaRutas = response
        .map((d) => {
          return {
            id: d.id,
            nombre: d.nombre ?? 'Sin información',
            ciaKm:
              d.distanciaKm != null ? `${d.distanciaKm} km` : 'Sin información',
            tarifaBase:
              d.tarifa?.tarifaBase != null
                ? formatter.format(d.tarifa.tarifaBase)
                : 'Sin información',
            costoAdicional:
              d.tarifa?.costoAdicional != null
                ? formatter.format(d.tarifa.costoAdicional)
                : 'Sin información',
            distanciaBaseKm:
              d.tarifa?.distanciaBaseKm != null
                ? formatter.format(d.tarifa.distanciaBaseKm)
                : 'Sin información',
            puntoInicioDireccion: d.puntoInicio?.direccion ?? 'Sin información',
            puntoFinDireccion: d.puntoFin?.direccion ?? 'Sin información',
          };
        })
        .sort((a, b) => b.id - a.id)
        .slice(0, 9);
    });
  }

  periodo: 'dia' | 'semana' | 'mes' = 'dia';

  tituloRecargasDebitos: string = 'Resumen Diario de Recargas y Débitos';
  tituloEntradasSalidas: string = 'Entradas y Salidas del Día';
  tituloViajesHoy: string = 'Resumen de Viajes de Hoy';
  internetLanguages: any[] = this.internetLanguagesDia;
  resumenEntradasSalidas: any[] = this.resumenEntradasSalidasDia;
  estadoDispositivos: any[] = this.estadoDispositivosDia;
  distribucionPorHora: any[] = this.distribucionPorHoraDia;


  cambiarPeriodo(periodo: 'dia' | 'semana' | 'mes') {
    this.periodo = periodo;

    // Cambiar títulos de gráficos
    switch (periodo) {
      case 'dia':
        this.tituloRecargasDebitos = 'Resumen Diario de Recargas y Débitos';
        this.tituloEntradasSalidas = 'Entradas y Salidas del Día';
        this.tituloViajesHoy = 'Resumen de Viajes de Hoy';
        this.internetLanguages = this.internetLanguagesDia;
        this.resumenEntradasSalidas = this.resumenEntradasSalidasDia;
        this.estadoDispositivos = this.estadoDispositivosDia;
        this.distribucionPorHora = this.distribucionPorHoraDia;
        break;
      case 'semana':
        this.tituloRecargasDebitos = 'Resumen Semanal de Recargas y Débitos';
        this.tituloEntradasSalidas = 'Entradas y Salidas de la Semana';
        this.tituloViajesHoy = 'Resumen de Viajes de la Semana';

        this.internetLanguages = this.internetLanguagesSemana;
        this.resumenEntradasSalidas = this.resumenEntradasSalidasSemana;
        this.estadoDispositivos = this.estadoDispositivosSemana;
        this.distribucionPorHora = this.distribucionPorHoraSemana;
        break;
      case 'mes':
        this.tituloRecargasDebitos = 'Resumen Mensual de Recargas y Débitos';
        this.tituloEntradasSalidas = 'Entradas y Salidas del Mes';
        this.tituloViajesHoy = 'Resumen de Viajes del Mes';
        this.internetLanguages = this.internetLanguagesMes;
        this.resumenEntradasSalidas = this.resumenEntradasSalidasMes;
        this.estadoDispositivos = this.estadoDispositivosMes;
        this.distribucionPorHora = this.distribucionPorHoraMes;
        break;
    }

    this.actualizarResumen();
  }

  actualizarResumen() {
    this.resumen = this.resumenOriginal.map((card) => {
      let titulo = card.key.charAt(0).toUpperCase() + card.key.slice(1);
      let valor = card.valor;

      if (card.key === 'recargas') {
        titulo =
          this.periodo === 'dia'
            ? 'Recargas del Día'
            : this.periodo === 'semana'
              ? 'Recargas de la Semana'
              : 'Recargas del Mes';
        valor = this.valoresGastos.recargas[this.periodo];
      }

      if (card.key === 'debitos') {
        titulo =
          this.periodo === 'dia'
            ? 'Débitos del Día'
            : this.periodo === 'semana'
              ? 'Débitos de la Semana'
              : 'Débitos del Mes';
        valor = this.valoresGastos.debitos[this.periodo];
      }

      return { ...card, titulo, valor };
    });
  }

}

document.addEventListener('DOMContentLoaded', function () {
  const closeElement = document.querySelector('.close');
  if (closeElement) {
    closeElement.addEventListener('click', function () {
      const ulElement = document.querySelector('ul');
      if (ulElement) {
        ulElement.classList.toggle('active');
      }
    });
  }
});
