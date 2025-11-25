import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { IncidenteService } from 'src/app/shared/services/incidentes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-incidentes',
  templateUrl: './lista-incidentes.component.html',
  styleUrl: './lista-incidentes.component.scss',
  animations: [fadeInUpAnimation]
})
export class ListaIncidentesComponent implements OnInit {


    isLoading: boolean = false;
    listaIncidentes: any;
    public grid: boolean = false;
    public showFilterRow: boolean;
    public showHeaderFilter: boolean;
    public loadingVisible: boolean = false;
    public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna";
    public loading: boolean;
    public loadingMessage: string = 'Cargando...';
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
    public autoExpandAllGroups: boolean = true;
    isGrouped: boolean = false;
    public paginaActualData: any[] = [];
    public filtroActivo: string = '';
    public paginaActual: number = 1;
    public totalRegistros: number = 0;
    public pageSize: number = 20;
    public totalPaginas: number = 0;
    public registros: any[] = [];
    public showCliente: any
  
    constructor(private inciService: IncidenteService, private sanitizer: DomSanitizer, private route: Router, private permissionsService: NgxPermissionsService,
      private users: AuthenticationService,
    ) {
      const user = this.users.getUser();
      this.showFilterRow = true;
      this.showHeaderFilter = true;
  
      this.showCliente = user?.rol?.nombre === 'SA';
    }
  
    ngOnInit(): void {
      this.setupDataSource()
    }
  
    agregarIncidente() {
      this.route.navigateByUrl('/incidentes/agregar-Incidente')
    }
  
    onPageIndexChanged(e: any) {
      const pageIndex = e.component.pageIndex();
      this.paginaActual = pageIndex + 1;
      e.component.refresh();
    }
  
    onGridOptionChanged(e: any) {
      if (e.fullName !== 'searchPanel.text') return;
  
      const grid = this.dataGrid?.instance;
      const qRaw = (e.value ?? '').toString().trim();
      if (!qRaw) {
        this.filtroActivo = '';
        grid?.option('dataSource', this.listaIncidentes);
        return;
      }
      this.filtroActivo = qRaw;
  
      const norm = (v: any) =>
        (v == null ? '' : String(v))
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase();
  
      const q = norm(qRaw);
  
      let columnas: any[] = [];
      try {
        const colsOpt = grid?.option('columns');
        if (Array.isArray(colsOpt) && colsOpt.length) columnas = colsOpt;
      } catch { }
      if (!columnas.length && grid?.getVisibleColumns) {
        columnas = grid.getVisibleColumns();
      }
  
      const dataFields: string[] = columnas
        .map((c: any) => c?.dataField)
        .filter((df: any) => typeof df === 'string' && df.trim().length > 0);
  
      const getByPath = (obj: any, path: string) =>
        !obj || !path ? undefined : path.split('.').reduce((acc, k) => acc?.[k], obj);
  
      let qStatusNum: number | null = null;
      if (q === '1' || q === 'Activo') qStatusNum = 1;
      else if (q === '0' || q === 'Inactivo') qStatusNum = 0;
  
      const dataFiltrada = (this.paginaActualData || []).filter((row: any) => {
        const hitCols = dataFields.some((df) => norm(getByPath(row, df)).includes(q));
  
        const estNum = Number(row?.Estatus ?? row?.estatus);
        const estHit =
          Number.isFinite(estNum) &&
          (qStatusNum !== null ? estNum === qStatusNum : String(estNum).toLowerCase().includes(q));
  
        const hitExtras = [
          norm(row?.Id),
          norm(row?.id),
          norm(row?.NombreCompleto),
          norm(row?.UserName),
          norm(row?.Telefono),
          norm(row?.RolNombre)
        ].some((s) => s.includes(q));
  
        return hitCols || estHit || hitExtras;
      });
  
      grid?.option('dataSource', dataFiltrada);
    }
  
    setupDataSource() {
      this.loading = true;
      this.listaIncidentes = new CustomStore({
        key: 'id',
        load: async (loadOptions: any) => {
          const skipValue = Number(loadOptions?.skip) || 0;
          const limitValue = Number(loadOptions?.take) || this.pageSize;
          const page = Math.floor(skipValue / limitValue) + 1;
  
          try {
            const response: any = await lastValueFrom(
              this.inciService.obtenerIncidentesData(page, limitValue)
            );
  
            this.loading = false;
  
            const totalPaginas = Number(response?.paginated?.limit) || 0;
            const totalRegistros = Number(response?.paginated?.total) || 0;
            const paginaActual = Number(response?.paginated?.page) || page;
  
            this.totalRegistros = totalRegistros;
            this.paginaActual = paginaActual;
            this.totalPaginas = totalPaginas;
  
            const dataTransformada = (Array.isArray(response?.data) ? response.data : []).map((item: any) => {
              const nombreCliente = [
                item?.cliente?.nombre || '',
                item?.cliente?.apellidoPaterno || '',
                item?.cliente?.apellidoMaterno || ''
              ].filter(Boolean).join(' ');
  
              return {
                ...item,
                id: item.id,
                clienteNombre: nombreCliente
              };
            });
  
            dataTransformada.sort((a, b) => b.id - a.id);
            this.paginaActualData = dataTransformada;
  
            return {
              data: dataTransformada,
              totalCount: totalRegistros
            };
          } catch (error) {
            this.loading = false;
            return { data: [], totalCount: 0 };
          }
        }
      });
    }
  
  
  
    toNum(v: any): number {
      const n = Number((v ?? '').toString().trim());
      return Number.isFinite(n) ? n : 0;
    }
  
    actualizarIncidente(idIncidente: number) {
      console.log(idIncidente)
      this.route.navigateByUrl('/incidentes/editar-Incidente/' + idIncidente);

    };
  
    activar(rowData: any) {
      Swal.fire({
        title: '¡Activar!',
        html: `¿Está seguro que requiere activar este reporte de incidente?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        background: '#002136',
      }).then((result) => {
        if (result.value) {
          this.inciService.activarIncidente(rowData.id).subscribe(
            (response) => {
              Swal.fire({
                title: '¡Confirmación Realizada!',
                html: `El servicio de verificación ha sido activada.`,
                icon: 'success',
                background: '#002136',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Confirmar',
              });
              this.setupDataSource();
              this.dataGrid.instance.refresh();
            },
            (error) => {
              Swal.fire({
                title: '¡Ops!',
                html: `${error}`,
                icon: 'error',
                background: '#002136',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Confirmar',
              });
            }
          );
        }
      });
    }
  
    desactivar(rowData: any) {
      Swal.fire({
        title: '¡Desactivar!',
        html: `¿Está seguro que requiere desactivar este reporte de incidente?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        background: '#002136',
      }).then((result) => {
        if (result.value) {
          this.inciService.desactivarIncidente(rowData.id).subscribe(
            (response) => {
              Swal.fire({
                title: '¡Confirmación Realizada!',
                html: `El reporte de incidente ha sido desactivada.`,
                icon: 'success',
                background: '#002136',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Confirmar',
              });
              this.setupDataSource();
              this.dataGrid.instance.refresh();
            },
            (error) => {
              Swal.fire({
                title: '¡Ops!',
                html: `${error}`,
                icon: 'error',
                background: '#002136',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Confirmar',
              });
            }
          );
        }
      });
    }
  
    hasPermission(permission: string): boolean {
      return this.permissionsService.getPermission(permission) !== undefined;
    }
  
  
    pdfPopupVisible = false;
    pdfTitle = 'Documento';
    pdfPopupWidth = 500;
    pdfUrlSafe: SafeResourceUrl | null = null;
    pdfRawUrl: string | null = null;
    pdfLoading = false;
    pdfLoaded = false;
    pdfError = false;
    pdfErrorMsg = '';
  
  
    async previsualizar(url?: string, titulo?: string, _row?: any) {
    this.pdfTitle = titulo || 'Documento';
    this.pdfRawUrl = (url || '').trim() || null;
    this.pdfUrlSafe = null;
    this.pdfLoading = true;
    this.pdfLoaded = false;
    this.pdfError = false;
    this.pdfErrorMsg = '';
    this.pdfPopupVisible = true;
    this.pdfPopupWidth = Math.min(Math.floor(window.innerWidth * 0.95), 900);
  
    if (!this.pdfRawUrl) {
      this.pdfError = true;
      this.pdfLoading = false;
      this.pdfErrorMsg = 'Este registro no tiene un PDF asignado.';
      return;
    }
  
    try {
      const head = await fetch(this.pdfRawUrl, { method: 'HEAD', mode: 'cors' });
      if (!head.ok) {
        console.warn('HEAD no OK', head.status);
      } else {
        const ct = head.headers.get('content-type') || '';
        if (ct && !ct.toLowerCase().includes('pdf')) {
          console.warn('Content-Type no es PDF:', ct);
        }
      }
    } catch (e) {
      console.warn('Error en HEAD', e);
    }
  
    const viewerParams = '#toolbar=0&navpanes=0';
    const finalUrl = this.pdfRawUrl.includes('#') ? this.pdfRawUrl : this.pdfRawUrl + viewerParams;
    this.pdfUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
  
    setTimeout(() => {
      if (!this.pdfLoaded && !this.pdfError) {
        this.pdfError = true;
        this.pdfLoading = false;
        this.pdfErrorMsg = 'El visor tardó demasiado en cargar.';
      }
    }, 4000);
  }
  
  
    onPdfLoaded() {
      this.pdfLoaded = true;
      this.pdfLoading = false;
    }
  
    abrirEnNuevaPestana() {
      if (this.pdfRawUrl) window.open(this.pdfRawUrl, '_blank');
    }
  
    async descargarPdfForzada() {
      if (!this.pdfRawUrl) return;
      try {
        const resp = await fetch(this.pdfRawUrl, { mode: 'cors' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const base = (this.pdfTitle || 'documento')
          .toLowerCase().replace(/\s+/g, '_').replace(/[^\w\-]+/g, '');
        a.href = url;
        a.download = base.endsWith('.pdf') ? base : base + '.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        try {
          const u = new URL(this.pdfRawUrl!);
          u.searchParams.set('response-content-disposition', `attachment; filename="${(this.pdfTitle || 'documento').replace(/\s+/g, '_')}.pdf"`);
          window.open(u.toString(), '_self');
        } catch {
          window.open(this.pdfRawUrl!, '_blank');
        }
      }
    }

}
