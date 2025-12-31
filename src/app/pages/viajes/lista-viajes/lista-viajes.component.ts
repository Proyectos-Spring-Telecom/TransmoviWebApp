import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { ViajeService } from 'src/app/shared/services/viajes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-viajes',
  templateUrl: './lista-viajes.component.html',
  styleUrl: './lista-viajes.component.scss'
})
export class ListaViajesComponent implements OnInit {


  listaViajes: any;
  isLoading: boolean = false;
  public selectedTransactionId: number | null = null;
  public latSelect: string | null = null;
  public lngSelect: string | null = null;
  public selectedTransactionDate: string | null = null;
  public selectedTransactionAmount: number | null = null;
  public selectedTipoTransaccion: any | null = null;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna"
  public loading: boolean = false;
  public loadingMessage: string = 'Cargando...';
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  public data: string;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  public showMap: boolean = false;

  filtrosForm!: FormGroup;
  fechaInicioFiltro: string | null = null;
  fechaFinFiltro: string | null = null;

  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

  constructor(
    private viajService: ViajeService,
    private modalService: NgbModal,
    private route: Router,
    private permissionsService: NgxPermissionsService,
    private fb: FormBuilder
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.filtrosForm = this.fb.group({
      fechaInicio: [null],
      fechaFin: [null]
    });

    this.setupDataSource();
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  setupDataSource() {
    this.loading = true;
    this.listaViajes = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.viajService.obtenerViajesData(page, take)
          );
          this.loading = false;
          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
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
          const dataTransformada = rows.map((item: any) => ({
            ...item,
            estatusTexto:
              item?.estatus === 1 ? 'Activo' :
                item?.estatus === 0 ? 'Inactivo' : null
          }));
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

  private formatDateForApi(value: any): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  aplicarFiltros() {
    const { fechaInicio, fechaFin } = this.filtrosForm.value;

    this.fechaInicioFiltro = this.formatDateForApi(fechaInicio);
    this.fechaFinFiltro = this.formatDateForApi(fechaFin);

    this.paginaActual = 1;
    if (this.dataGrid) {
      this.dataGrid.instance.pageIndex(0);
      this.dataGrid.instance.refresh();
    }
  }

  limpiarFiltros() {
    this.filtrosForm.reset();
    this.fechaInicioFiltro = null;
    this.fechaFinFiltro = null;

    this.paginaActual = 1;
    if (this.dataGrid) {
      this.dataGrid.instance.pageIndex(0);
      this.dataGrid.instance.refresh();
    }
  }

  onGridOptionChanged(e: any) {
    if (e.fullName === "searchPanel.text") {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaViajes);
        return;
      }
      const search = this.filtroActivo.toLowerCase();
      const dataFiltrada = this.paginaActualData.filter((item: any) =>
        (item.nombre && item.nombre.toLowerCase().includes(search)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(search)) ||
        (item.modulo?.nombre && item.modulo.nombre.toLowerCase().includes(search))
      );
      this.dataGrid.instance.option('dataSource', dataFiltrada);
    }
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  showInfo(id: any): void {
    console.log('Mostrar información de la transacción con ID:', id);
  }


  private readonly markerIcon: google.maps.Icon = {
    url: new URL('assets/images/icons8-marker-48.png', document.baseURI).toString(),
    scaledSize: new google.maps.Size(42, 42),
    anchor: new google.maps.Point(21, 42),
  };



  cerrarModal(modal: any) {
    modal.close('Modal cerrado por nuevo método');
  }

  onFechaFinChange(value: any) {
    if (!value) return;

    const seleccionada = new Date(value);
    const hoy = new Date();

    seleccionada.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    if (seleccionada > hoy) {
      Swal.fire({
        background: '#002136',
        icon: 'warning',
        title: '¡Ops!',
        text: 'La fecha fin no puede ser mayor a la fecha actual.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.filtrosForm.patchValue({ fechaFin: today });
      });
    }
  }

  onFechaInicioChange(value: any) {
    if (!value) return;

    const seleccionada = new Date(value);
    const hoy = new Date();

    seleccionada.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    if (seleccionada > hoy) {
      Swal.fire({
        background: '#002136',
        icon: 'warning',
        title: '¡Ops!',
        text: 'La fecha inicio no puede ser mayor a la fecha actual.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.filtrosForm.patchValue({ fechaInicio: today });
      });
    }
  }


  public selectedRutaNombre: string | null = null;
  public selectedNombreInicio: string | null = null;
  public selectedNombreFinal: string | null = null;

  private readonly markerIconInicio: google.maps.Icon = {
    url: new URL('assets/images/markerGreen.png', document.baseURI).toString(),
    scaledSize: new google.maps.Size(42, 42),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(21, 42),
  };

  private readonly markerIconFin: google.maps.Icon = {
    url: new URL('assets/images/markerRed.png', document.baseURI).toString(),
    scaledSize: new google.maps.Size(42, 42),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(21, 42),
  };

  private getCoords(p: any): { lat: number | null; lng: number | null } {
    const lat = Number(p?.coordenadas?.lat);
    const lng = Number(p?.coordenadas?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };

    const c = p?.features?.[0]?.geometry?.coordinates;
    if (Array.isArray(c) && c.length >= 2) {
      const lng2 = Number(c[0]);
      const lat2 = Number(c[1]);
      if (Number.isFinite(lat2) && Number.isFinite(lng2)) return { lat: lat2, lng: lng2 };
    }

    return { lat: null, lng: null };
  }


  extraLarge(exlargeModal: any) {
    this.modalService.open(exlargeModal, { size: 'xl', windowClass: 'modal-holder', centered: true });
  }

  centerModal(
    exlargeModal: any,
    id: number,
    _latitud?: any,
    _longitud?: any,
    _fechaHora?: string,
    _monto?: number,
    _tipoTransaccion?: any,
    row?: any
  ) {
    this.selectedTransactionId = id;

    const inicioRow = row?.puntoInicioDerrotero;
    const finRow = row?.puntoFinDerrotero;

    const inicio = this.getCoords(inicioRow);
    const fin = this.getCoords(finRow);

    const hasInicio = inicio.lat != null && inicio.lng != null;
    const hasFin = fin.lat != null && fin.lng != null;

    this.showMap = hasInicio || hasFin;

    this.modalService.open(exlargeModal, {
      size: 'xl',
      windowClass: 'modal-holder',
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    if (!this.showMap) return;

    const mapId = `map-${this.selectedTransactionId}`;

    setTimeout(() => {
      if (hasInicio && hasFin) {
        this.initializeMap(
          inicio.lat!, inicio.lng!,
          fin.lat!, fin.lng!,
          mapId,
          inicioRow?.direccion || 'Inicio de la Ruta',
          finRow?.direccion || 'Fin de la Ruta'
        );
        return;
      }

      if (hasInicio) {
        this.initializeMap(
          inicio.lat!, inicio.lng!,
          undefined, undefined,
          mapId,
          inicioRow?.direccion || 'Inicio de la Ruta',
          undefined
        );
        return;
      }

      this.initializeMap(
        fin.lat!, fin.lng!,
        undefined, undefined,
        mapId,
        'Punto',
        finRow?.direccion || 'Fin de la Ruta'
      );
    }, 300);
  }


  initializeMap(
    latA: number,
    lngA: number,
    latB?: number,
    lngB?: number,
    mapId: string = 'map',
    labelA?: string,
    labelB?: string
  ) {
    const el = document.getElementById(mapId) as HTMLElement | null;
    if (!el) return;
    if ([latA, lngA].some(v => v == null || isNaN(Number(v)))) return;

    const a = { lat: Number(latA), lng: Number(lngA) };
    const hasB = latB != null && lngB != null && !isNaN(Number(latB)) && !isNaN(Number(lngB));
    const b = hasB ? { lat: Number(latB), lng: Number(lngB) } : null;

    const map = new google.maps.Map(el, {
      center: a,
      zoom: hasB ? 13 : 15,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
    });

    const markerA = new google.maps.Marker({ position: a, map, icon: this.markerIconInicio });
    let markerB: google.maps.Marker | null = null;
    if (hasB && b) {
      markerB = new google.maps.Marker({ position: b, map, icon: this.markerIconFin });
    }

    const infoA = new google.maps.InfoWindow({
      disableAutoPan: true,
      maxWidth: 280,
      content: `
      <div style="
        font-family:'Segoe UI',sans-serif; display:inline-block; background:#fff; border-radius:12px;
        box-shadow:0 4px 12px rgba(0,0,0,.12); padding:8px 12px 6px 12px; line-height:1.3; margin-top: -45px;
        max-width:240px; white-space:normal; overflow-wrap:break-word; word-wrap:break-word;
      ">
        <div style="font-size:14px;color:#2f2f2f;margin:0;">
          <span style="display:block;color:#1aa160;font-weight:600;margin-bottom:4px;">Inicio de la Ruta</span>
          <span style="display:block;margin:0 0 2px 0;">${labelA || ''}</span>
        </div>
      </div>
    `
    });

    const infoB = hasB && b ? new google.maps.InfoWindow({
      disableAutoPan: true,
      maxWidth: 280,
      content: `
      <div style="
        font-family:'Segoe UI',sans-serif; display:inline-block; background:#fff; border-radius:12px;
        box-shadow:0 4px 12px rgba(223, 14, 14, 0.12); padding:8px 12px 6px 12px; line-height:1.3; margin-top: -45px;
        max-width:240px; white-space:normal; overflow-wrap:break-word; word-wrap:break-word;
      ">
        <div style="font-size:14px;color:#2f2f2f;margin:0;">
          <span style="display:block;color:#d43f3a;font-weight:600;margin-bottom:4px;">Fin de la Ruta</span>
          <span style="display:block;margin:0 0 2px 0;">${labelB || ''}</span>
        </div>
      </div>
    `
    }) : null;

    if (hasB && b && markerB) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(a);
      bounds.extend(b);
      const PADDING = { top: 120, right: 56, bottom: 56, left: 56 };
      map.fitBounds(bounds, PADDING);
    } else {
      map.setCenter(a);
      map.setZoom(15);
    }

    google.maps.event.addListenerOnce(map, 'idle', () => {
      infoA.open({ map, anchor: markerA });
      if (infoB && markerB) infoB.open({ map, anchor: markerB });

      google.maps.event.addListener(infoA, 'closeclick', () => infoA.open({ map, anchor: markerA }));
      if (infoB && markerB) {
        google.maps.event.addListener(infoB, 'closeclick', () => infoB.open({ map, anchor: markerB! }));
      }

      const overlay = new google.maps.OverlayView();
      overlay.onAdd = function () { };
      overlay.draw = function () { };
      overlay.onRemove = function () { };
      overlay.setMap(map);

      setTimeout(() => {
        const proj = overlay.getProjection();
        if (!proj) return;
        const toPx = (ll: google.maps.LatLngLiteral) =>
          proj.fromLatLngToDivPixel(new google.maps.LatLng(ll));
        const TIP = 26;
        const TH = 96;
        const TW = 240;
        const aPx = toPx(a);
        const rectA = {
          left: aPx.x - TW / 2,
          right: aPx.x + TW / 2,
          top: aPx.y - (TIP + TH),
          bottom: aPx.y - TIP
        };
        let union = { ...rectA };
        if (hasB && b) {
          const bPx = toPx(b);
          const rectB = {
            left: bPx.x - TW / 2,
            right: bPx.x + TW / 2,
            top: bPx.y - (TIP + TH),
            bottom: bPx.y - TIP
          };
          union = {
            left: Math.min(rectA.left, rectB.left),
            right: Math.max(rectA.right, rectB.right),
            top: Math.min(rectA.top, rectB.top),
            bottom: Math.max(rectA.bottom, rectB.bottom)
          };
        }
        const cx = (union.left + union.right) / 2;
        const cy = (union.top + union.bottom) / 2;
        const mapDiv = map.getDiv() as HTMLElement;
        const vw = mapDiv.clientWidth;
        const vh = mapDiv.clientHeight;
        const dx = (vw / 2) - cx;
        const dy = (vh / 2) - cy;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          map.panBy(dx, dy);
        }
        overlay.setMap(null);
      }, 0);
    });
  }

  getLatFromInicio(row: any): number | null {
    const c = row?.puntoInicio?.features?.[0]?.geometry?.coordinates;
    return Array.isArray(c) && c.length >= 2 ? Number(c[1]) : null;
  }

  getLngFromInicio(row: any): number | null {
    const c = row?.puntoInicio?.features?.[0]?.geometry?.coordinates;
    return Array.isArray(c) && c.length >= 2 ? Number(c[0]) : null;
  }


}
