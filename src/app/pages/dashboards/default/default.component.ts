import { Component, OnDestroy, OnInit } from '@angular/core';
import { transactions, lineColumAreaChart, revenueColumnChart, customerRadialBarChart, orderRadialBarChart, growthColumnChart, } from './data';
import { ChartType } from './dashboard.model';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
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

  kpis: { t: string; v: any; s?: string }[] = [];
  rutas = ['Ruta Centro','Ruta Norte','Ruta Sur','Ruta Express','Ruta Aeropuerto','Ruta Oriente','Ruta Poniente'];
  monederos = Array.from({ length: 120 }, (_, i) => `MON${i + 1}`);

  transaccionesHoy: Tx[] = [];
  conteosAsc: { hora: number; ascensos: number }[] = [];

  dsIngresosHora: { hora: string; ingreso: number; ticket: number }[] = [];
  dsBrecha: { hora: string; ascensos: number; boletos: number }[] = [];
  dsMediosPago: { medio: string; valor: number }[] = [];
  dsPuntualidad: { bin: string; viajes: number }[] = [];
  dsVelocidadPromedio: { ruta: string; velocidad: number }[] = [];

  topRutas: { nombre: string; ingresos: number; viajes: number }[] = [];
  tituloIngresos: string = 'Ingresos por hora (hoy)';
  dispositivosConAlertas: Dispositivo[] = [];

  // Clientes
  clientesOptions: any[] = [];
  clienteSeleccionado: any = null;
  clienteValueExpr: string = 'id';
  clienteDisplayExpr = (c: any) =>
    c
      ? c.razonSocial ??
        c.nombre ??
        c.nombreCliente ??
        c.nombreComercial ??
        c.descripcion ??
        c.name ??
        ''
      : '';

  // Filtros
  fechaInicio: string = '';
  fechaFin: string = '';
  filtroRango: number = 1;
  private kpisCargados: boolean = false;
  private ejecutandoKPIs: boolean = false;

  // Series (una por ruta) - Se generan dinámicamente desde los datos del servicio
  seriesPasajeros: { valueField: string; name: string }[] = [];
  
  // Datos de pasajeros por periodo/ruta - Se llenan desde el servicio
  dsPasajerosPorHora: any[] = [];



  etiquetasOriginales: string[] = [
    'BlueVoxs - Contadores',
    'Derroteros - Variantes',
    'Dispositivos - Validadores',
    'Pin',
    'Regiones - Zonas'
  ];

  constructor(
    private clientesService: ClientesService,
    private authService: AuthenticationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.inicializarFechas();
    this.cargarClientes();
    this.fabricarDatos();
    this.armarFuentes();
    this.calcularKPIs();
  }

  private inicializarFechas(): void {
    const hoy = new Date();
    // Formatear para input type="date" (YYYY-MM-DD)
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    this.fechaInicio = `${year}-${month}-${day}`;
    this.fechaFin = `${year}-${month}-${day}`;
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
      { t: 'Pasajeros alidados hoy', v: pasajerosValidados, s: `${tarjetasUnicas.length} Monederos Únicos` },
      { t: 'Ticket Promedio', v: ticket.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) },
      { t: '% Pagos electrónicos vs efectivo', v: `${pctElec}% / ${pctEfec}%`, s: `${ascensos} Ascensos • ${pasajerosValidados} Validados` },
      { t: 'Validaciones', v: `${debitos.length} / ${Math.floor(5 + Math.random() * 20)} fallidas` },
      { t: 'Unidades en servicio / total', v: `${unidadesServ} / ${unidadesTotales}`, s: 'Últimos 15 min' },
      { t: 'Cumplimiento de turnos', v: `${cumplimiento}%`, s: `${turnosFin}/${turnosInicio} Cerrados` },
      { t: 'Ocupación promedio', v: `${ocupacion}%`, s: 'Capacidad Teórica' }
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

  customizePasajerosTooltip = (arg: any) => {
    // Para gráficas apiladas, arg puede tener información de la serie específica o del punto completo
    const data = arg.point?.data || arg.point?.tag || arg.series?.data || {};
    const periodo = arg.argumentText || '';
    let texto = `Periodo: ${periodo}\n`;
    
    // Si hay información de la serie específica, mostrar solo esa
    if (arg.series?.name && arg.value !== undefined) {
      const serieName = arg.series.name;
      const valor = Number(arg.value) || 0;
      texto += `${serieName}: ${valor}`;
      return { text: texto };
    }
    
    // Si no, mostrar todas las rutas y el total
    let total = 0;
    this.seriesPasajeros.forEach((serie) => {
      const valor = Number(data[serie.valueField]) || 0;
      if (valor > 0) {
        texto += `${serie.name}: ${valor}\n`;
        total += valor;
      }
    });
    
    if (total > 0) {
      texto += `\nTotal: ${total}`;
    }
    
    return { text: texto };
  };

  customizeAscensosBoletosTooltip = (arg: any) => {
    const data = arg.point?.data || arg.point?.tag || {};
    const periodo = arg.argumentText || '';
    const ascensos = Number(data?.ascensos) || 0;
    const boletos = Number(data?.boletos) || 0;
    const diferencia = ascensos - boletos;
    
    return { 
      text: `Periodo: ${periodo}\nAscensos: ${ascensos}\nBoletos: ${boletos}\nDiferencia: ${diferencia >= 0 ? '+' : ''}${diferencia}` 
    };
  };

  customizeVelocidadTooltip = (arg: any) => {
    const data = arg.point?.data || arg.point?.tag || {};
    const ruta = arg.argumentText || data?.ruta || '';
    const velocidad = Number(data?.velocidad) || 0;
    
    return { 
      text: `Ruta: ${ruta}\nVelocidad: ${velocidad} km/h` 
    };
  };

  private cargarClientes(): void {
    this.clientesService.obtenerClientes().subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.clientesOptions = raw.map((c: any) => ({
          ...c,
          id: Number(c?.id ?? c?.Id ?? c?.idCliente ?? c?.ID),
        }));
        
        // Autoseleccionar el cliente logueado
        try {
          const user = this.authService.getUser();
          if (user && user.idCliente) {
            const idClienteLogueado = Number(user.idCliente);
            const clienteEncontrado = this.clientesOptions.find(c => c.id === idClienteLogueado);
            if (clienteEncontrado) {
              // Ejecutar la llamada solo una vez después de autoseleccionar
              if (!this.kpisCargados && !this.ejecutandoKPIs) {
                this.clienteSeleccionado = idClienteLogueado;
                // Usar setTimeout para asegurar que el valor se asigne y evitar que onValueChanged interfiera
                // Marcar kpisCargados antes para evitar que onValueChanged ejecute otra llamada
                this.kpisCargados = true;
                setTimeout(() => {
                  this.obtenerKPIs();
                }, 100);
              }
            }
          } else {
            // Si no hay cliente autoseleccionado, no ejecutar la API
            console.warn('No se encontró cliente logueado para autoseleccionar');
          }
        } catch (error) {
          console.error('Error al obtener usuario del sessionStorage', error);
        }
      },
      error: (error) => {
        console.error('Error al cargar clientes', error);
        this.clientesOptions = [];
      },
    });
  }

  onClienteChanged(): void {
    // Solo ejecutar si ya se cargaron los KPIs iniciales (evitar ejecución durante autoselección inicial)
    if (this.kpisCargados && !this.ejecutandoKPIs) {
      this.obtenerKPIs();
    }
  }

  obtenerKPIs(): void {
    // Evitar ejecuciones simultáneas
    if (this.ejecutandoKPIs) {
      console.log('Ya hay una ejecución de KPIs en curso, ignorando...');
      return;
    }

    if (!this.clienteSeleccionado) {
      console.warn('No hay cliente seleccionado, no se puede obtener KPIs');
      return;
    }

    if (!this.fechaInicio || !this.fechaFin) {
      console.warn('Fechas no inicializadas');
      return;
    }

    this.ejecutandoKPIs = true;

    const body = {
      idCliente: Number(this.clienteSeleccionado),
      fechaInicio: this.formatearFechaISO(new Date(this.fechaInicio)),
      fechaFin: this.formatearFechaISO(new Date(this.fechaFin)),
      filtro: Number(this.filtroRango)
    };

    console.log('Ejecutando llamada a API con body:', body);
    this.http.post(`${environment.API_SECURITY}/dashboard/kpi`, body).subscribe({
      next: (response) => {
        console.log('KPIs obtenidos:', response);
        this.procesarRespuestaKPIs(response);
        this.ejecutandoKPIs = false;
        // Asegurar que kpisCargados esté marcado después de la primera carga exitosa
        if (!this.kpisCargados) {
          this.kpisCargados = true;
        }
      },
      error: (error) => {
        console.error('Error al obtener KPIs', error);
        this.ejecutandoKPIs = false;
      }
    });
  }

  obtenerKPIsPorRango(): void {
    // Evitar ejecuciones simultáneas
    if (this.ejecutandoKPIs) {
      console.log('Ya hay una ejecución de KPIs en curso, ignorando...');
      return;
    }

    if (!this.clienteSeleccionado) {
      console.warn('No hay cliente seleccionado, no se puede obtener KPIs');
      return;
    }

    this.ejecutandoKPIs = true;

    const body = {
      idCliente: Number(this.clienteSeleccionado),
      fechaInicio: null,
      fechaFin: null,
      filtro: Number(this.filtroRango)
    };

    console.log('Ejecutando llamada a API por rango con body:', body);
    this.http.post(`${environment.API_SECURITY}/dashboard/kpi`, body).subscribe({
      next: (response) => {
        console.log('KPIs obtenidos por rango:', response);
        this.procesarRespuestaKPIs(response);
        this.ejecutandoKPIs = false;
      },
      error: (error) => {
        console.error('Error al obtener KPIs por rango', error);
        this.ejecutandoKPIs = false;
      }
    });
  }

  private formatearPeriodo(periodo: string, indice?: number): string {
    if (!periodo) return '00:00';
    
    // Si viene como "2025-12" (año-mes), mostrarlo así
    if (/^\d{4}-\d{2}$/.test(periodo)) {
      return periodo;
    }
    
    // Si tiene hora (formato: "2025-12-01 07:00" o similar), extraer la hora
    const matchHora = periodo.match(/(\d{2}):(\d{2})/);
    if (matchHora) {
      return matchHora[0]; // Retorna "07:00"
    }
    
    // Si tiene fecha completa pero sin hora, intentar parsear como Date
    const fechaHora = new Date(periodo);
    if (!isNaN(fechaHora.getTime())) {
      // Si tiene hora válida (no es medianoche o tiene minutos)
      if (fechaHora.getHours() !== 0 || fechaHora.getMinutes() !== 0) {
        const horas = String(fechaHora.getHours()).padStart(2, '0');
        const minutos = String(fechaHora.getMinutes()).padStart(2, '0');
        return `${horas}:${minutos}`;
      } else {
        // Si no tiene hora, mostrar como "Semana X" basado en el índice
        if (indice !== undefined && indice !== null) {
          return `Semana ${indice + 1}`;
        }
        // O mostrar la fecha formateada
        const mes = String(fechaHora.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaHora.getDate()).padStart(2, '0');
        return `${dia}/${mes}`;
      }
    }
    
    // Si no se puede parsear, retornar el valor original
    return periodo;
  }

  private determinarTituloIngresos(periodos: any[]): string {
    if (!periodos || periodos.length === 0) {
      return 'Ingresos por hora (hoy)';
    }

    const primerPeriodo = periodos[0]?.periodo;
    if (!primerPeriodo) {
      return 'Ingresos por hora (hoy)';
    }

    // Si el periodo formateado contiene "Semana", es por semana
    const periodoFormateado = this.formatearPeriodo(primerPeriodo, 0);
    if (periodoFormateado.includes('Semana')) {
      return 'Ingresos por semana';
    }

    // Si viene como "2025-12" (año-mes), extraer el año
    if (/^\d{4}-\d{2}$/.test(primerPeriodo)) {
      const año = primerPeriodo.substring(0, 4);
      return `Ingresos por mes (${año})`;
    }

    // Si tiene hora, es por hora
    const matchHora = primerPeriodo.match(/(\d{2}):(\d{2})/);
    if (matchHora) {
      return 'Ingresos por hora (hoy)';
    }

    // Por defecto, asumir por hora
    return 'Ingresos por hora (hoy)';
  }

  private procesarRespuestaKPIs(data: any): void {
    if (!data) return;

    // Procesar graficaIngresos para dsIngresosHora
    if (data.graficaIngresos && Array.isArray(data.graficaIngresos)) {
      // Determinar el título basado en el formato del periodo
      this.tituloIngresos = this.determinarTituloIngresos(data.graficaIngresos);
      
      this.dsIngresosHora = data.graficaIngresos.map((item: any, index: number) => {
        const periodoFormateado = this.formatearPeriodo(item.periodo, index);
        
        return {
          hora: periodoFormateado,
          ingreso: item.ingresos ?? 0,
          ticket: item.ticket_promedio ?? 0
        };
      });
    }

    // Procesar graficaAscensoBoleto para dsBrecha
    if (data.graficaAscensoBoleto && Array.isArray(data.graficaAscensoBoleto) && data.graficaAscensoBoleto.length > 0) {
      this.dsBrecha = data.graficaAscensoBoleto.map((item: any, index: number) => {
        const periodoFormateado = this.formatearPeriodo(item.periodo, index);
        
        // Convertir explícitamente a números para asegurar que se muestren en la gráfica
        const ascensos = Number(item.ascensos) || 0;
        const boletos = Number(item.boletos) || 0;
        
        return {
          hora: periodoFormateado,
          ascensos: ascensos,
          boletos: boletos
        };
      });
    } else {
      // Si no hay datos, inicializar con array vacío para evitar errores
      this.dsBrecha = [];
    }

    // Procesar graficaPasajerosPorRutas para dsPasajerosPorHora
    if (data.graficaPasajerosPorRutas && Array.isArray(data.graficaPasajerosPorRutas) && data.graficaPasajerosPorRutas.length > 0) {
      // Obtener todas las rutas únicas
      const rutasUnicas = new Set<string>();
      data.graficaPasajerosPorRutas.forEach((item: any) => {
        const nombreRuta = item.ruta ?? item.Ruta ?? '';
        if (nombreRuta) {
          rutasUnicas.add(nombreRuta);
        }
      });

      // Crear las series dinámicamente basadas en las rutas encontradas
      this.seriesPasajeros = Array.from(rutasUnicas).map((ruta) => {
        // Crear un campo válido para el valueField (sin espacios, en minúsculas)
        const valueField = ruta.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        return {
          valueField: valueField,
          name: ruta
        };
      });

      // Agrupar datos por periodo
      const datosPorPeriodo = new Map<string, any>();
      
      data.graficaPasajerosPorRutas.forEach((item: any) => {
        const periodo = item.periodo ?? '';
        const nombreRuta = item.ruta ?? item.Ruta ?? '';
        const pasajeros = Number(item.pasajeros) || 0;
        
        if (!periodo || !nombreRuta) return;
        
        if (!datosPorPeriodo.has(periodo)) {
          datosPorPeriodo.set(periodo, { hora: this.formatearPeriodo(periodo) });
        }
        
        const valueField = nombreRuta.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        datosPorPeriodo.get(periodo)[valueField] = pasajeros;
      });

      // Convertir a array y asegurar que todas las rutas tengan valor 0 si no están presentes
      this.dsPasajerosPorHora = Array.from(datosPorPeriodo.values()).map((item: any) => {
        this.seriesPasajeros.forEach((serie) => {
          if (!(serie.valueField in item)) {
            item[serie.valueField] = 0;
          }
        });
        return item;
      });
    } else {
      // Si no hay datos, inicializar con arrays vacíos
      this.seriesPasajeros = [];
      this.dsPasajerosPorHora = [];
    }

    // Procesar velocidadPromedioPorRuta para dsVelocidadPromedio
    if (data.velocidadPromedioPorRuta && Array.isArray(data.velocidadPromedioPorRuta)) {
      this.dsVelocidadPromedio = data.velocidadPromedioPorRuta.map((item: any) => {
        const nombreRuta = item.ruta ?? item.Ruta ?? 'Sin nombre';
        const velocidad = Number(item.velocidad_promedio) || 0;
        
        return {
          ruta: nombreRuta,
          velocidad: velocidad
        };
      });
    } else {
      // Si no hay datos, inicializar con array vacío
      this.dsVelocidadPromedio = [];
    }

    // Procesar grafica4 para topRutas
    if (data.grafica4 && Array.isArray(data.grafica4)) {
      // Agrupar por ruta y sumar ingresosTotales
      const rutasMap = new Map<string, number>();
      
      data.grafica4.forEach((item: any) => {
        const nombreRuta = item.Ruta ?? item.ruta ?? 'Sin nombre';
        const ingresos = item.ingresosTotales ?? 0;
        
        if (rutasMap.has(nombreRuta)) {
          rutasMap.set(nombreRuta, rutasMap.get(nombreRuta)! + ingresos);
        } else {
          rutasMap.set(nombreRuta, ingresos);
        }
      });
      
      // Convertir a array, ordenar por ingresos descendente y tomar top 5
      this.topRutas = Array.from(rutasMap.entries())
        .map(([nombre, ingresos]) => ({
          nombre,
          ingresos,
          viajes: 0 // No hay información de viajes en grafica4
        }))
        .sort((a, b) => b.ingresos - a.ingresos)
        .slice(0, 5);
    }

    // Buscar y actualizar cada KPI según su título
    this.kpis = this.kpis.map(kpi => {
      const titulo = kpi.t.toLowerCase();
      
      // Ingresos del día
      if (titulo.includes('ingresos') && (titulo.includes('día') || titulo.includes('dia'))) {
        const valor = data.ingresosAlDia ?? 0;
        const totalMovimientos = data.totalMovimientos ?? 0;
        return {
          ...kpi,
          v: valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
          s: `${totalMovimientos} movimientos`
        };
      }
      
      // Pasajeros validados
      if (titulo.includes('pasajeros') && titulo.includes('validados')) {
        const valor = data.pasajerosValidados ?? 0;
        return {
          ...kpi,
          v: valor
        };
      }
      
      // Ticket promedio
      if (titulo.includes('ticket') && titulo.includes('promedio')) {
        const valor = data.ticketPromedio ?? 0;
        return {
          ...kpi,
          v: valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
        };
      }
      
      // Validaciones
      if (titulo.includes('validaciones')) {
        const exitosas = data.validacionesExitosas ?? 0;
        const fallidas = data.validacionesFallidas ?? 0;
        return {
          ...kpi,
          v: `${exitosas} / ${fallidas} fallidas`
        };
      }
      
      // Unidades en servicio
      if (titulo.includes('unidades') && titulo.includes('servicio')) {
        const enServicio = data.unidadesEnServicio ?? 0;
        const total = data.totalUnidades ?? 0;
        return {
          ...kpi,
          v: `${enServicio} / ${total}`
        };
      }
      
      // Cumplimiento de turnos
      if (titulo.includes('cumplimiento') && titulo.includes('turnos')) {
        const valor = data.cumplimientoTurnos;
        if (valor !== null && valor !== undefined) {
          return {
            ...kpi,
            v: `${valor}%`
          };
        } else {
          // Si es null, mostrar "N/A" y actualizar el subtítulo para no mostrar datos aleatorios
          return {
            ...kpi,
            v: 'N/A',
            s: 'Sin datos disponibles'
          };
        }
      }
      
      // Ocupación promedio
      if (titulo.includes('ocupación') || titulo.includes('ocupacion')) {
        const valor = data.ocupacionPromedio ?? 0;
        return {
          ...kpi,
          v: `${valor}%`
        };
      }
      
      return kpi;
    });
  }

  private formatearFechaISO(fecha: Date | string): string {
    let date: Date;
    if (typeof fecha === 'string') {
      date = new Date(fecha);
    } else {
      date = fecha;
    }
    
    // Formatear a ISO 8601 con timezone (ej: 2025-09-12T16:00:00Z)
    return date.toISOString();
  }
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