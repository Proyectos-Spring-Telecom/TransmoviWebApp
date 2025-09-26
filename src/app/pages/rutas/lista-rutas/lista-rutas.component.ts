import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { RutasService } from 'src/app/shared/services/rutas.service';

@Component({
  selector: 'app-lista-rutas',
  templateUrl: './lista-rutas.component.html',
  styleUrls: ['./lista-rutas.component.scss'],
  animations: [fadeInUpAnimation],
})
export class ListaRutasComponent implements OnInit {
  isLoading: boolean = false;
  listaRutas: any;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  public autoExpandAllGroups: boolean = true;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  public listaDipositivos: any;
  public listaBlueVox: any;
  public listaVehiculos: any;
  public listaClientes: any;
  isGrouped: boolean = false;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

  constructor(
    private rutaSe: RutasService,
    private zone: NgZone,
    private route: Router,
    private modalService: NgbModal,
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.setupDataSource();
  }

  agregarRuta() {
    this.route.navigateByUrl('/rutas/agregar-ruta');
  }

  cerrarModal(modal: any) {
    modal.close('Modal cerrado por nuevo método');
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  setupDataSource() {
    this.loading = true;
    this.listaRutas = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.rutaSe.obtenerRutasData(page, take)
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

  onGridOptionChanged(e: any) {
    if (e.fullName === "searchPanel.text") {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaRutas);
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

  isNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  verRuta(idRutaEspecifica: number) {
    this.route.navigateByUrl('/rutas/ver-ruta/' + idRutaEspecifica
    );
  };

  alCambiarOpcion(e: any): void {
    if (e.name === 'paging' && e.fullName === 'paging.pageIndex') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  public selectedTransactionId: number | null = null;
  public selectedRutaNombre: string | null = null;
  public selectedNombreInicio: string | null = null;
  public selectedNombreFinal: string | null = null;
  public showMap = false;

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

  private getCoords(geojson: any): { lat: number | null; lng: number | null } {
    const c = geojson?.features?.[0]?.geometry?.coordinates;
    if (Array.isArray(c) && c.length >= 2) {
      const lng = Number(c[0]); const lat = Number(c[1]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
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
    this.selectedRutaNombre = row?.nombre ?? null;
    this.selectedNombreInicio = row?.nombreInicio ?? null;
    this.selectedNombreFinal = row?.nombreFinal ?? null;

    const inicio = this.getCoords(row?.puntoInicio);
    const fin = this.getCoords(row?.puntoFin);

    const hasInicio = inicio.lat != null && inicio.lng != null;
    const hasFin = fin.lat != null && fin.lng != null;
    this.showMap = hasInicio || hasFin;

    this.modalService.open(exlargeModal, { size: 'xl', windowClass: 'modal-holder', centered: true });

    if (!this.showMap) return;

    const mapId = `map-${this.selectedTransactionId}`;
    setTimeout(() => {
      if (hasInicio && hasFin) {
        this.initializeMap(
          inicio.lat!, inicio.lng!, fin.lat!, fin.lng!, mapId,
          this.selectedNombreInicio || 'Punto Inicio',
          this.selectedNombreFinal || 'Punto Fin'
        );
      } else if (hasInicio) {
        this.initializeMap(
          inicio.lat!, inicio.lng!, undefined, undefined, mapId,
          this.selectedNombreInicio || 'Punto Inicio', undefined
        );
      } else {
        this.initializeMap(
          fin.lat!, fin.lng!, undefined, undefined, mapId,
          this.selectedNombreInicio || 'Punto Inicio',
          this.selectedNombreFinal || 'Punto Fin'
        );
      }
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
          <span style="display:block;color:#1aa160;font-weight:600;margin-bottom:4px;">Punto de Inicio</span>
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
        box-shadow:0 4px 12px rgba(0,0,0,.12); padding:8px 12px 6px 12px; line-height:1.3; margin-top: -45px;
        max-width:240px; white-space:normal; overflow-wrap:break-word; word-wrap:break-word;
      ">
        <div style="font-size:14px;color:#2f2f2f;margin:0;">
          <span style="display:block;color:#d43f3a;font-weight:600;margin-bottom:4px;">Punto de Destino</span>
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
