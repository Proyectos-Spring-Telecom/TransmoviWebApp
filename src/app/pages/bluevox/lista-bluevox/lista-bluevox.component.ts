import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent, DxDateBoxComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { BlueVoxService } from 'src/app/shared/services/bitacora-conteo.service';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-bluevox',
  templateUrl: './lista-bluevox.component.html',
  styleUrl: './lista-bluevox.component.scss',
  animations: [fadeInUpAnimation],
})

export class ListaBluevoxComponent implements OnInit {
  isLoading: boolean = false;
  listaBluevox: any;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  @ViewChild('dateBoxInicial') dateBoxInicial: DxDateBoxComponent;
  @ViewChild('dateBoxFinal') dateBoxFinal: DxDateBoxComponent;

  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  @ViewChild('gridContainer', { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  public comparativaViajes: any[] = [];

  /** Comparativa API resumen-por-viaje */
  fechaComparativaInicio: Date;
  fechaComparativaFin: Date;
  resumenComparativaStore!: CustomStore;
  public pageSizeComparativa = 10;
  loadingComparativa = false;
  @ViewChild('gridResumenComparativa', { static: false }) gridResumenComparativa: DxDataGridComponent;

  fechaInicial: Date;
  fechaFinal: Date;

  constructor(
    private serviceBlue: BlueVoxService,
    private tranService: TransaccionesService,
    private route: Router
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    const hoy = new Date();
    this.fechaComparativaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    this.fechaComparativaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    this.setupDataSource();
    this.setupResumenComparativaStore();
  }

  realizarRegistro() {
    this.route.navigateByUrl('/bluevox/registrar')
  }


  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  setupDataSource() {
    this.loading = true;

    this.listaBluevox = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        // DevExtreme manda estos valores cuando usas remote paging
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.serviceBlue.obtenerBViajesData(page, take)
          );

          this.loading = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];

          // ---- Manejo robusto de la meta de paginación ----
          const meta = resp?.paginated || {};
          const totalRegistros =
            toNum(meta.total) ??
            toNum(resp?.total) ??
            rows.length;

          const paginaActual =
            toNum(meta.page) ??
            toNum(resp?.page) ??
            page;

          const totalPaginas =
            toNum(meta.lastPage) ??
            toNum(resp?.pages) ??
            Math.max(1, Math.ceil(totalRegistros / take));
          // --------------------------------------------------

          const dataTransformada = rows.map((item: any) => ({
            ...item,
            estatusTexto:
              item?.estatus === 1 ? 'Activo' :
                item?.estatus === 0 ? 'Inactivo' : null
          }));

          // Si llevas estos contadores en el componente:
          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;
          this.comparativaViajes = await this.generarComparativa(dataTransformada);

          return {
            data: dataTransformada,
            totalCount: totalRegistros // <- IMPORTANTE para que el grid pagine bien
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
          this.comparativaViajes = [];
          return { data: [], totalCount: 0 };
        }
      }
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  }


  onGridOptionChanged(e: any) {
    if (e.fullName === "searchPanel.text") {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaBluevox);
        return;
      }
      const search = this.filtroActivo.toString().toLowerCase();
      const dataFiltrada = this.paginaActualData.filter((item: any) => {
        const idStr = item.id ? item.id.toString().toLowerCase() : '';
        const nombreStr = item.nombre ? item.nombre.toString().toLowerCase() : '';
        const descripcionStr = item.descripcion ? item.descripcion.toString().toLowerCase() : '';
        const moduloStr = item.estatusTexto ? item.estatusTexto.toString().toLowerCase() : '';
        return (
          nombreStr.includes(search) ||
          descripcionStr.includes(search) ||
          moduloStr.includes(search) ||
          idStr.includes(search)
        );
      });
      this.dataGrid.instance.option('dataSource', dataFiltrada);
    }
  }


  formatearFecha(fechaInput: Date | string, modo: 'envio' | 'vista' = 'envio'): string {
    const fecha = new Date(fechaInput);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const yyyy = fecha.getUTCFullYear();
    const MM = pad(fecha.getUTCMonth() + 1);
    const dd = pad(fecha.getUTCDate());
    const hh = pad(fecha.getUTCHours());
    const mm = pad(fecha.getUTCMinutes());
    const ss = pad(fecha.getUTCSeconds());

    if (modo === 'envio') {
      return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
    } else {
      return `${dd}/${MM}/${yyyy} ${hh}:${mm} hrs UTC`;
    }
  }


  limpiarCampos() {
    this.dateBoxInicial.instance.reset();
    this.dateBoxFinal.instance.reset();
    this.fechaInicial = null;
    this.fechaFinal = null;
    this.setupDataSource();
    const grid = this.dataGrid.instance;
    grid.clearGrouping();
    grid.clearFilter();
    grid.clearSelection();
    grid.pageIndex(0);
    grid.refresh();
  }

  private formatYMD(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    return `${yyyy}-${MM}-${dd}`;
  }

  /** Construye un dataSource remoto usando el servicio de rango (inicio/fin + page/limit) */
  buscarPorRango() {
    if (!this.fechaInicial || !this.fechaFinal) {
      Swal.fire('Faltan fechas', 'Selecciona fecha inicial y final.', 'warning');
      return;
    }
    const fi = this.formatYMD(new Date(this.fechaInicial));
    const ff = this.formatYMD(new Date(this.fechaFinal));

    if (new Date(fi) > new Date(ff)) {
      Swal.fire('Rango inválido', 'La fecha inicial no puede ser mayor que la final.', 'error');
      return;
    }

    this.loading = true;

    const toNum = (v: any): number | null => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // Reemplazamos el dataSource del grid por uno nuevo que llama al servicio de rango
    this.listaBluevox = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.serviceBlue.obtenerBViajesRango(fi, ff, page, take)
          );

          this.loading = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};

          const totalRegistros =
            toNum(meta.total) ?? toNum(resp?.total) ?? rows.length;

          const paginaActual =
            toNum(meta.page) ?? toNum(resp?.page) ?? page;

          const totalPaginas =
            toNum(meta.lastPage) ??
            toNum(resp?.pages) ??
            Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((item: any) => ({
            ...item,
            estatusTexto:
              item?.estatus === 1 ? 'Activo' :
                item?.estatus === 0 ? 'Inactivo' : null
          }));

          // contadores en el componente
          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;
          this.comparativaViajes = await this.generarComparativa(dataTransformada);

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos (rango):', err);
          this.comparativaViajes = [];
          return { data: [], totalCount: 0 };
        }
      }
    });

    // aplica el nuevo dataSource al grid (por si ya estaba inicializado)
    if (this.dataGrid?.instance) {
      this.dataGrid.instance.option('dataSource', this.listaBluevox);
      this.dataGrid.instance.pageIndex(0);
      this.dataGrid.instance.refresh();
    }
  }

  private async generarComparativa(conteoRows: any[]): Promise<any[]> {
    const filasConteo = Array.isArray(conteoRows) ? conteoRows : [];
    if (!filasConteo.length) return [];

    const fechas = filasConteo
      .map((r: any) => new Date(r?.fhRegistro || r?.fechaHora))
      .filter((d: Date) => !isNaN(d.getTime()));

    let fechaInicio: string | null = null;
    let fechaFin: string | null = null;
    if (fechas.length) {
      const min = new Date(Math.min(...fechas.map((d: Date) => d.getTime())));
      const max = new Date(Math.max(...fechas.map((d: Date) => d.getTime())));
      fechaInicio = this.formatYMD(min);
      fechaFin = this.formatYMD(max);
    }

    let transacciones: any[] = [];
    try {
      const respTrans: any = await lastValueFrom(
        this.tranService.obtenerTransaccionesData({
          page: 1,
          limit: 500,
          fechaInicio,
          fechaFin
        })
      );
      transacciones = Array.isArray(respTrans?.data) ? respTrans.data : [];
    } catch (error) {
      console.error('Error al obtener transacciones para comparativa:', error);
      transacciones = [];
    }

    const conteoPorViaje = new Map<string, any>();
    for (const row of filasConteo) {
      const idViajeKey = String(row?.idViaje ?? '').trim();
      if (!idViajeKey) continue;

      const prev = conteoPorViaje.get(idViajeKey) || {
        idViaje: idViajeKey,
        numeroSerieBlueVox: row?.numeroSerieBlueVox || null,
        entradasConteo: 0,
        salidasConteo: 0,
        diferenciaConteo: 0
      };

      prev.entradasConteo += Number(row?.entradas ?? 0) || 0;
      prev.salidasConteo += Number(row?.salidas ?? 0) || 0;
      prev.diferenciaConteo += Number(row?.diferencia ?? 0) || 0;
      if (!prev.numeroSerieBlueVox && row?.numeroSerieBlueVox) {
        prev.numeroSerieBlueVox = row.numeroSerieBlueVox;
      }

      conteoPorViaje.set(idViajeKey, prev);
    }

    const transPorViaje = new Map<string, { total: number; debitos: number }>();
    for (const trx of transacciones) {
      const idViajeKey = String(trx?.idViaje ?? '').trim();
      if (!idViajeKey) continue;
      const tipo = String(trx?.tipoTransaccion ?? '').toUpperCase();

      const prev = transPorViaje.get(idViajeKey) || { total: 0, debitos: 0 };
      prev.total += 1;
      if (tipo === 'DEBITO') prev.debitos += 1;
      transPorViaje.set(idViajeKey, prev);
    }

    const comparativa = Array.from(conteoPorViaje.values()).map((c: any, idx: number) => {
      const t = transPorViaje.get(String(c.idViaje)) || { total: 0, debitos: 0 };
      const diferenciaEntradasVsDebitos = c.entradasConteo - t.debitos;
      const diferenciaConteoVsTransacciones = c.diferenciaConteo - t.debitos;

      return {
        id: idx + 1,
        idViaje: c.idViaje,
        numeroSerieBlueVox: c.numeroSerieBlueVox,
        entradasConteo: c.entradasConteo,
        salidasConteo: c.salidasConteo,
        diferenciaConteo: c.diferenciaConteo,
        transaccionesTotal: t.total,
        transaccionesDebito: t.debitos,
        diferenciaEntradasVsDebitos,
        diferenciaConteoVsTransacciones
      };
    });

    comparativa.sort((a: any, b: any) => Number(a.idViaje) - Number(b.idViaje));
    return comparativa;
  }

  setupResumenComparativaStore(): void {
    const toNum = (v: any): number | null => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    this.resumenComparativaStore = new CustomStore({
      key: '_resumenKey',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSizeComparativa || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        const fi = this.formatYMD(new Date(this.fechaComparativaInicio));
        const ff = this.formatYMD(new Date(this.fechaComparativaFin));

        if (new Date(fi) > new Date(ff)) {
          return { data: [], totalCount: 0 };
        }

        this.loadingComparativa = true;
        try {
          const resp: any = await lastValueFrom(
            this.serviceBlue.obtenerResumenPorViaje(fi, ff, page, take)
          );
          this.loadingComparativa = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};
          const totalRegistros =
            toNum(meta.total) ?? toNum(resp?.total) ?? rows.length;

          const dataNormalizada = rows.map((row: any, idx: number) => {
            const idViaje = row?.idViaje ?? row?.id_viaje;
            const _resumenKey = String(
              idViaje ?? `${row?.inicioViaje ?? 'viaje'}-${skip + idx}`
            );
            return { ...row, idViaje, _resumenKey };
          });

          return {
            data: dataNormalizada,
            totalCount: totalRegistros
          };
        } catch (err) {
          this.loadingComparativa = false;
          console.error('Error resumen-por-viaje:', err);
          return { data: [], totalCount: 0 };
        }
      }
    });
  }

  consultarResumenComparativa(): void {
    if (!this.fechaComparativaInicio || !this.fechaComparativaFin) {
      Swal.fire('Faltan fechas', 'Selecciona fecha inicial y final de la comparativa.', 'warning');
      return;
    }
    const fi = this.formatYMD(new Date(this.fechaComparativaInicio));
    const ff = this.formatYMD(new Date(this.fechaComparativaFin));
    if (new Date(fi) > new Date(ff)) {
      Swal.fire('Rango inválido', 'La fecha inicial no puede ser mayor que la final.', 'error');
      return;
    }
    this.setupResumenComparativaStore();
    if (this.gridResumenComparativa?.instance) {
      this.gridResumenComparativa.instance.option('dataSource', this.resumenComparativaStore);
      this.gridResumenComparativa.instance.pageIndex(0);
      this.gridResumenComparativa.instance.refresh();
    }
  }

  /** Columna Viaje del resumen: con id muestra `Viaje: n`; si no, guión. */
  textoIdViajeResumen(row: any): string {
    const v = row?.idViaje ?? row?.id_viaje;
    if (v === null || v === undefined || String(v).trim() === '') {
      return '—';
    }
    return `Viaje: ${v}`;
  }

  /** inicioViaje / finViaje ISO o texto legible */
  formatoResumenFechaHora(val: any): string {
    if (val == null || val === '') return '—';
    if (val instanceof Date) {
      const d = val;
      return isNaN(d.getTime()) ? '—' : this.formatearSoloFechaHora(d);
    }
    const s = String(val).trim();
    const normalizado =
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s) && !s.includes('T')
        ? s.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2')
        : s;
    const d = new Date(normalizado);
    if (isNaN(d.getTime())) return s;
    return this.formatearSoloFechaHora(d);
  }

  private formatearSoloFechaHora(d: Date): string {
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  textoFinViajeResumen(row: any): string {
    const v = row?.finViaje;
    if (v == null || v === '') return 'En transcurso';
    return this.formatoResumenFechaHora(v);
  }

  /** Filas etiqueta/valor para la celda Vehículo (objeto `vehiculo` o campos planos). */
  vehiculoResumenFilas(row: any): { etiqueta: string; valor: string }[] {
    const out: { etiqueta: string; valor: string }[] = [];
    const v = row?.vehiculo;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const push = (etiqueta: string, val: any) => {
        if (val == null || String(val).trim() === '') return;
        out.push({ etiqueta, valor: String(val) });
      };
      push('Placa', v.placa);
      push('N° económico', v.numeroEconomico);
      push('Marca', v.marca);
      push('Modelo', v.modelo);
    }
    if (!out.length) {
      const push = (etiqueta: string, val: any) => {
        if (val == null || String(val).trim() === '') return;
        out.push({ etiqueta, valor: String(val) });
      };
      push('Placa', row?.placaVehiculo ?? row?.placa);
      push('N° económico', row?.numeroEconomicoVehiculo ?? row?.numeroEconomico);
    }
    return out;
  }

  /** Lista `blueVoxs` del renglón resumen-por-viaje. */
  blueVoxsResumenLista(row: any): any[] {
    const arr = row?.blueVoxs ?? row?.blue_voxs;
    return Array.isArray(arr) ? arr : [];
  }

  /** Fechas ISO o SQL `yyyy-MM-dd HH:mm:ss.ffffff` para conteos. */
  formatearFechaConteoResumen(val: any): string {
    if (val == null || val === '') {
      return '—';
    }
    if (val instanceof Date) {
      return this.formatoResumenFechaHora(val);
    }
    const s = String(val).trim();
    const normalizado =
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s) && !s.includes('T')
        ? s.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2')
        : s;
    const d = new Date(normalizado);
    if (isNaN(d.getTime())) {
      return s;
    }
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

}