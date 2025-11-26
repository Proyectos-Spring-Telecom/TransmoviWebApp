import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { PosicioneService } from 'src/app/shared/services/posiciones.service';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-lista-posiciones',
  templateUrl: './lista-posiciones.component.html',
  styleUrl: './lista-posiciones.component.scss'
})
export class ListaPosicionesComponent implements OnInit {

  isLoading: boolean = false;
  public listaPosiciones: any;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public permisoAgregarPermiso: string;

  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  public data: string;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

  public selectedPositionId: number | null = null;
  public selectedClienteNombre: string | null = null;
  public selectedFechaHora: string | null = null;
  public showMap = false;

  private readonly markerIconPos: google.maps.Icon = {
    url: new URL('assets/images/icons8-marker-48.png', document.baseURI).toString(),
    scaledSize: new google.maps.Size(48, 48),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(24, 48)
  };

  constructor(
    private posService: PosicioneService,
    private route: Router,
    private permissionsService: NgxPermissionsService,
    private modalService: NgbModal
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit() {
    this.setupDataSource();
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  setupDataSource() {
    this.loading = true;

    this.listaPosiciones = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.posService.obtenerPosicionesData(page, take)
          );
          this.loading = false;
          let rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};
          const totalRegistros =
            toNum(meta.total) ?? toNum(resp?.total) ?? rows.length;
          const paginaActual =
            toNum(meta.page) ?? toNum(resp?.page) ?? page;
          const totalPaginas =
            toNum(meta.lastPage) ?? toNum(resp?.pages) ??
            Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((item: any) => ({
            ...item,
            estatusTexto:
              Number(item?.estatus) === 1 ? 'Activo' :
                Number(item?.estatus) === 0 ? 'Inactivo' : null
          }));

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (error) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', error);
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
    if (e.fullName !== 'searchPanel.text') return;

    const grid = this.dataGrid?.instance;
    const q = (e.value ?? '').toString().trim().toLowerCase();

    if (!q) {
      this.filtroActivo = '';
      grid?.option('dataSource', this.listaPosiciones);
      return;
    }
    this.filtroActivo = q;

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

    const getByPath = (obj: any, path: string) => {
      if (!obj || !path) return undefined;
      return path.split('.').reduce((acc, key) => acc?.[key], obj);
    };

    const normalizar = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (val instanceof Date) {
        const dd = String(val.getDate()).padStart(2, '0');
        const mm = String(val.getMonth() + 1).padStart(2, '0');
        const yyyy = val.getFullYear();
        return `${dd}/${mm}/${yyyy}`.toLowerCase();
      }
      if (typeof val === 'string' && /\d{4}-\d{2}-\d{2}T?/.test(val)) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${val.toLowerCase()} ${dd}/${mm}/${yyyy}`;
        }
      }
      if (Array.isArray(val)) return val.map(normalizar).join(' ');
      return String(val).toLowerCase();
    };
    const dataFiltrada = (this.paginaActualData || []).filter((row: any) => {
      const hitEnColumnas = dataFields.some((df) => normalizar(getByPath(row, df)).includes(q));
      const estNum = Number(row?.estatus);
      const estText = row?.estatusTexto ?? (estNum === 1 ? 'Activo' : estNum === 0 ? 'Inactivo' : '');
      const estHits =
        normalizar(estText).includes(q) ||
        normalizar(estNum).includes(q) ||
        (q === 'activo' && estNum === 1) ||
        (q === 'inactivo' && estNum === 0);

      const extras = [
        normalizar(row?.id),
        normalizar(row?.Id)
      ];
      const hitExtras = extras.some((s) => s.includes(q));

      return hitEnColumnas || estHits || hitExtras;
    });
    grid?.option('dataSource', dataFiltrada);
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  showInfo(id: any): void {
    console.log('Mostrar información del permiso con ID:', id);
  }

  agregarPermiso() {
    this.route.navigateByUrl('/permisos/agregar-permiso');
  }

  actualizarPermiso(idPermiso: number) {
    this.route.navigateByUrl('/permisos/editar-permiso/' + idPermiso);
  }

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar el permiso: <strong>${rowData.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.posService.updateEstatus(rowData.id, 1).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El permiso ha sido activado.`,
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
      html: `¿Está seguro que requiere desactivar el permiso: <strong>${rowData.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.posService.updateEstatus(rowData.id, 0).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El permiso ha sido desactivado`,
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

  centerModal(exlargeModal: any, row: any) {
    this.selectedPositionId = row?.id ?? null;
    this.selectedClienteNombre = row?.NombreCompletoCliente ?? null;
    this.selectedFechaHora = row?.fechaHora ?? null;
    this.selectedNumeroSerieDispositivo = row?.numeroSerieDispositivo ?? null;

    const lat = Number(row?.latitud);
    const lng = Number(row?.longitud);
    const hasCoords = !isNaN(lat) && !isNaN(lng);
    this.showMap = hasCoords;

    this.modalService.open(exlargeModal, { size: 'xl', windowClass: 'modal-holder', centered: true });

    if (!hasCoords) return;

    const mapId = `map-${this.selectedPositionId}`;
    setTimeout(() => {
      this.initializeMap(lat, lng, mapId, this.selectedClienteNombre, this.selectedNumeroSerieDispositivo);
    }, 300);
  }

  public selectedNumeroSerieDispositivo: string | null = null;


  initializeMap(
    lat: number,
    lng: number,
    mapId: string = 'map',
    cliente?: string | null,
    numeroSerie?: string | null
  ) {
    const el = document.getElementById(mapId) as HTMLElement | null;
    if (!el) return;
    if ([lat, lng].some(v => v == null || isNaN(Number(v)))) return;

    const center = { lat: Number(lat), lng: Number(lng) };

    const map = new google.maps.Map(el, {
      center,
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true
    });

    const marker = new google.maps.Marker({
      position: center,
      map,
      icon: this.markerIconPos
    });

    const info = new google.maps.InfoWindow({
      disableAutoPan: true,
      maxWidth: 280,
      content: `
      <div style="
        font-family:'Segoe UI',sans-serif; display:inline-block; background:#fff; border-radius:12px;
        box-shadow:0 4px 12px rgba(0,0,0,.12); padding:8px 12px 6px 12px; line-height:1.3; margin-top: -45px;
        max-width:240px; white-space:normal; overflow-wrap:break-word; word-wrap:break-word;
      ">
        <div style="font-size:14px;color:#2f2f2f;margin:0;">
          <span style="display:block;color:#1aa160;font-weight:600;margin-bottom:4px;">Posición Registrada</span>
          <span style="display:block;margin:0 0 2px 0;">Cliente: ${cliente || ''}</span>
          <span style="display:block;margin:0 0 2px 0;">Dispositivo: ${numeroSerie || ''}</span>
        </div>
      </div>
    `
    });

    google.maps.event.addListenerOnce(map, 'idle', () => {
      info.open({ map, anchor: marker });
      google.maps.event.addListener(info, 'closeclick', () => info.open({ map, anchor: marker }));
    });
  }
  getDireccionTexto(valor: number): string {
    if (valor == null) return '';

    const v = ((Math.round(valor) % 360) + 360) % 360;

    if (v >= 337.5 || v < 22.5) return 'Norte';
    if (v < 67.5) return 'Noreste';
    if (v < 112.5) return 'Este';
    if (v < 157.5) return 'Sureste';
    if (v < 202.5) return 'Sur';
    if (v < 247.5) return 'Suroeste';
    if (v < 292.5) return 'Oeste';
    return 'Noroeste';
  }


}
