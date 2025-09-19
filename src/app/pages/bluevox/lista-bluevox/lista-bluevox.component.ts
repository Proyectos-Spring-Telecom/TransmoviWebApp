import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent, DxDateBoxComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { BlueVoxService } from 'src/app/shared/services/bitacora-conteo.service';
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
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';

  fechaInicial: Date;
  fechaFinal: Date;

  constructor(private serviceBlue: BlueVoxService, private route: Router) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.setupDataSource();
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

          return {
            data: dataTransformada,
            totalCount: totalRegistros // <- IMPORTANTE para que el grid pagine bien
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
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

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos (rango):', err);
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

}