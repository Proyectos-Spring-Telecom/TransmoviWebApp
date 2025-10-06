import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { DerroterosService } from 'src/app/shared/services/derroteros.service';
import Swal from 'sweetalert2';

declare global { interface Window { google: any; } }
declare const google: any;

@Component({
  selector: 'app-lista-derroteros',
  templateUrl: './lista-derroteros.component.html',
  styleUrl: './lista-derroteros.component.scss',
  animations: [fadeInUpAnimation],
})
export class ListaDerroterosComponent implements OnInit {

  isLoading: boolean = false;
  listaDerroteros: any;
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
  isGrouped: boolean = false;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

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

  constructor(
    private derrotService: DerroterosService,
    private zone: NgZone,
    private route: Router,
    private modalService: NgbModal,
    private permissionsService: NgxPermissionsService
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  ngOnInit(): void {
    this.setupDataSource();
  }

  agregarDerrotero() {
    this.route.navigateByUrl('/derroteros/agregar-derrotero');
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
    this.listaDerroteros = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.derrotService.obtenerDerroterosData(page, take)
          );
          this.loading = false;
          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};
          const totalRegistros =
            toNum(meta.total) ?? toNum(resp?.total) ?? rows.length;

          const paginaActual =
            toNum(meta.page) ?? toNum(resp?.page) ?? page;

          const totalPaginas =
            toNum(meta.lastPage) ?? toNum(resp?.pages) ?? Math.max(1, Math.ceil(totalRegistros / take));

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
    if (e.fullName === 'searchPanel.text') {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaDerroteros);
        return;
      }
      const search = this.filtroActivo.toString().toLowerCase();
      const dataFiltrada = this.paginaActualData.filter((item: any) => {
        const idStr = item.id ? item.id.toString().toLowerCase() : '';
        const nombreStr = item.nombreRuta ? item.nombreRuta.toString().toLowerCase() : ''; // <-- en este componente es nombreRuta
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

  // ==================== MODAL + MAPA ====================

  /** Devuelve lat/lng desde el shape de este componente:
   *  row.puntoInicio.coordenadas.{lat,lng}  /  row.puntoFin.coordenadas.{lat,lng}
   */
  private getCoordsFromDerroteroPoint(point: any): { lat: number | null; lng: number | null } {
    const lat = Number(point?.coordenadas?.lat);
    const lng = Number(point?.coordenadas?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
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
    this.selectedTransactionId = id ?? row?.id ?? null;
    this.selectedRutaNombre = row?.nombreRuta ?? null;
    this.selectedNombreInicio = row?.puntoInicio?.direccion ?? null;
    this.selectedNombreFinal = row?.puntoFin?.direccion ?? null;

    // Coordenadas de inicio/fin
    const inicio = this.getCoordsFromDerroteroPoint(row?.puntoInicio);
    const fin = this.getCoordsFromDerroteroPoint(row?.puntoFin);

    // Recorrido detallado (opcional)
    const path: google.maps.LatLngLiteral[] = this.toPath(row?.recorridoDetallado);

    const hasInicio = inicio.lat != null && inicio.lng != null;
    const hasFin = fin.lat != null && fin.lng != null;
    this.showMap = hasInicio || hasFin || path.length > 0;

    this.modalService.open(exlargeModal, { size: 'xl', windowClass: 'modal-holder', centered: true });
    if (!this.showMap) return;

    const mapId = `map-${this.selectedTransactionId}`;
    setTimeout(() => {
      if (hasInicio && hasFin) {
        this.initializeMap(
          inicio.lat!, inicio.lng!, fin.lat!, fin.lng!, mapId,
          this.selectedNombreInicio || 'Punto Inicio',
          this.selectedNombreFinal || 'Punto Fin',
          path // <-- nuevo
        );
      } else if (hasInicio) {
        this.initializeMap(
          inicio.lat!, inicio.lng!, undefined, undefined, mapId,
          this.selectedNombreInicio || 'Punto Inicio',
          undefined,
          path // <-- nuevo
        );
      } else {
        this.initializeMap(
          fin.lat!, fin.lng!, undefined, undefined, mapId,
          this.selectedNombreInicio || 'Punto Inicio',
          this.selectedNombreFinal || 'Punto Fin',
          path // <-- nuevo
        );
      }
    }, 300);
  }

  // Trazo punteado (mismo que ya usamos)
  private readonly TRACE_COLOR = '#f30606ff';
  private readonly TRACE_WEIGHT = 4;
  private readonly TRACE_REPEAT = '20px';

  // Círculos en cada vértice (como en AltaDerrotero)
  private readonly VERTEX_FILL = '#000000ff';
  private readonly VERTEX_STROKE = '#ffffff';
  private readonly VERTEX_SCALE = 5;
  private pathPointMarkers: google.maps.Marker[] = [];
  private geocoder?: google.maps.Geocoder;
  private geocodeCache = new Map<string, string>();
  private vertexInfoWindow?: google.maps.InfoWindow;
  private vertexHoverCloseTimer?: number;



  initializeMap(
    latA: number,
    lngA: number,
    latB?: number,
    lngB?: number,
    mapId: string = 'map',
    labelA?: string,
    labelB?: string,
    path: google.maps.LatLngLiteral[] = []        // recorridoDetallado normalizado
  ) {
    const el = document.getElementById(mapId) as HTMLElement | null;
    if (!el) return;
    if ([latA, lngA].some(v => v == null || isNaN(Number(v)))) return;

    // Lazy init de utilidades
    const geocoder = this.geocoder ?? (this.geocoder = new google.maps.Geocoder());
    const vInfo = this.vertexInfoWindow ?? (this.vertexInfoWindow = new google.maps.InfoWindow({ maxWidth: 260 }));

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

    // Marcadores de Inicio / Fin
    const markerA = new google.maps.Marker({ position: a, map, icon: this.markerIconInicio });
    let markerB: google.maps.Marker | null = null;
    if (hasB && b) markerB = new google.maps.Marker({ position: b, map, icon: this.markerIconFin });

    // Tooltips de Inicio / Fin
    const infoA = new google.maps.InfoWindow({
      disableAutoPan: true,
      maxWidth: 280,
      content: `
      <div style="font-family:'Segoe UI',sans-serif; display:inline-block; background:#fff; border-radius:12px;
        box-shadow:0 4px 12px rgba(0,0,0,.12); padding:8px 12px 6px; line-height:1.3; margin-top:-45px; max-width:240px;">
        <div style="font-size:14px;color:#2f2f2f;">
          <span style="display:block;color:#1aa160;font-weight:600;margin-bottom:4px;">Punto de Inicio</span>
          <span style="display:block;">${labelA || ''}</span>
        </div>
      </div>`
    });
    const infoB = hasB && b ? new google.maps.InfoWindow({
      disableAutoPan: true,
      maxWidth: 280,
      content: `
      <div style="font-family:'Segoe UI',sans-serif; display:inline-block; background:#fff; border-radius:12px;
        box-shadow:0 4px 12px rgba(0,0,0,.12); padding:8px 12px 6px; line-height:1.3; margin-top:-45px; max-width:240px;">
        <div style="font-size:14px;color:#2f2f2f;">
          <span style="display:block;color:#d43f3a;font-weight:600;margin-bottom:4px;">Punto de Destino</span>
          <span style="display:block;">${labelB || ''}</span>
        </div>
      </div>`
    }) : null;

    // ====== Trazo punteado + círculos por punto ======
    // Limpia marcadores previos del path si hubiera
    this.pathPointMarkers.forEach(m => m.setMap(null));
    this.pathPointMarkers = [];

    const TRACE_COLOR = this.TRACE_COLOR ?? '#f30606ff';
    const TRACE_WEIGHT = this.TRACE_WEIGHT ?? 4;
    const TRACE_REPEAT = this.TRACE_REPEAT ?? '20px';

    const VERTEX_FILL = this.VERTEX_FILL ?? '#000000ff';
    const VERTEX_STROKE = this.VERTEX_STROKE ?? '#ffffff';
    const VERTEX_SCALE = this.VERTEX_SCALE ?? 5;

    let polyline: google.maps.Polyline | null = null;

    if (Array.isArray(path) && path.length > 1) {
      polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeOpacity: 0,
        clickable: false,
        icons: [
          {
            icon: { path: 'M 0,-1 0,1', strokeColor: TRACE_COLOR, strokeOpacity: 1, strokeWeight: TRACE_WEIGHT },
            offset: '0',
            repeat: TRACE_REPEAT,
          },
        ],
      });
      polyline.setMap(map);
    }

    // Crea un marcador por cada punto del recorrido y tooltip por geocoding (on hover/click)
    // Círculo en cada punto + tooltip SOLO en hover (sin title nativo)
if (Array.isArray(path) && path.length) {
  for (const pt of path) {
    const mk = new google.maps.Marker({
      position: pt,
      map,
      zIndex: 1000,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: this.VERTEX_FILL ?? '#000000ff',
        fillOpacity: 1,
        strokeColor: this.VERTEX_STROKE ?? '#ffffff',
        strokeOpacity: 1,
        strokeWeight: 2,
        scale: this.VERTEX_SCALE ?? 5,
      },
    });
    this.pathPointMarkers.push(mk);

    const showAddress = async () => {
      if (this.vertexHoverCloseTimer) {
        clearTimeout(this.vertexHoverCloseTimer);
        this.vertexHoverCloseTimer = undefined as any;
      }

      const key = `${pt.lat.toFixed(6)},${pt.lng.toFixed(6)}`;
      let addr = this.geocodeCache.get(key);

      // Abre placeholder inmediato (SOLO InfoWindow personalizado)
      this.vertexInfoWindow ??= new google.maps.InfoWindow({ maxWidth: 260 });
      if (!addr) {
        this.vertexInfoWindow.setContent(`
          <div style="font-family:'Segoe UI',sans-serif; margin-top:-45px; background:#fff;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.12);padding:8px 10px;">
            <div style="font-size:13px;color:#4a4a4a;">Buscando dirección…</div>
          </div>
        `);
        this.vertexInfoWindow.open({ map, anchor: mk });

        const geocoder = this.geocoder ?? (this.geocoder = new google.maps.Geocoder());
        addr = await new Promise<string>((resolve) => {
          geocoder.geocode({ location: pt }, (res: any, status: string) => {
            if (status === 'OK' && res && res[0]?.formatted_address) {
              resolve(res[0].formatted_address);
            } else {
              resolve(`${pt.lat.toFixed(5)}, ${pt.lng.toFixed(5)}`);
            }
          });
        });
        this.geocodeCache.set(key, addr);
        // OJO: NO usar mk.setTitle(addr); para evitar tooltip del navegador
      }

      this.vertexInfoWindow.setContent(`
        <div style="font-family:'Segoe UI',sans-serif; margin-top:-45px; background:#fff;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.12);padding:8px 10px;max-width:260px;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">Ubicación</div>
          <div style="font-size:13px;color:#1f2937;font-weight:600;line-height:1.25;">${addr}</div>
        </div>
      `);
      this.vertexInfoWindow.open({ map, anchor: mk });
    };

    mk.addListener('mouseover', showAddress);
    mk.addListener('mouseout', () => {
      if (this.vertexHoverCloseTimer) clearTimeout(this.vertexHoverCloseTimer);
      this.vertexHoverCloseTimer = window.setTimeout(() => {
        this.vertexInfoWindow?.close();
      }, 120); // pequeño delay para evitar parpadeo al saltar entre puntos
    });
  }
}

    // ===================================================

    // Ajuste de bounds (A/B + path)
    if (hasB && b) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(a);
      bounds.extend(b);
      if (Array.isArray(path)) path.forEach(pt => bounds.extend(pt));
      const PADDING = { top: 120, right: 56, bottom: 56, left: 56 };
      map.fitBounds(bounds, PADDING);
    } else if (Array.isArray(path) && path.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(a);
      path.forEach(pt => bounds.extend(pt));
      const PADDING = { top: 120, right: 56, bottom: 56, left: 56 };
      map.fitBounds(bounds, PADDING);
    } else {
      map.setCenter(a);
      map.setZoom(15);
    }

    // Abre tooltips principales tras quedar estable
    google.maps.event.addListenerOnce(map, 'idle', () => {
      infoA.open({ map, anchor: markerA });
      if (infoB && markerB) infoB.open({ map, anchor: markerB });

      google.maps.event.addListener(infoA, 'closeclick', () => infoA.open({ map, anchor: markerA }));
      if (infoB && markerB) {
        google.maps.event.addListener(infoB, 'closeclick', () => infoB.open({ map, anchor: markerB! }));
      }

      // Compensación visual por tamaño de globos
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

        const TIP = 26, TH = 96, TW = 240;
        const aPx = toPx(a);
        const rectA = { left: aPx.x - TW / 2, right: aPx.x + TW / 2, top: aPx.y - (TIP + TH), bottom: aPx.y - TIP };
        let union = { ...rectA };
        if (hasB && b) {
          const bPx = toPx(b);
          const rectB = { left: bPx.x - TW / 2, right: bPx.x + TW / 2, top: bPx.y - (TIP + TH), bottom: bPx.y - TIP };
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
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) map.panBy(dx, dy);
        overlay.setMap(null);
      }, 0);
    });
  }

  /** Normaliza un arreglo de puntos del recorrido a LatLngLiteral[] */
  private toPath(recorrido: any): google.maps.LatLngLiteral[] {
    if (!Array.isArray(recorrido)) return [];
    return recorrido
      .map((p: any) => {
        const lat = Number(p?.lat);
        const lng = Number(p?.lng);
        return (Number.isFinite(lat) && Number.isFinite(lng)) ? { lat, lng } : null;
      })
      .filter(Boolean) as google.maps.LatLngLiteral[];
  }

  eliminarDerrotero(derrotero: any) {
    Swal.fire({
      title: '¡Eliminar Derrotero!',
      background: '#002136',
      html: `¿Está seguro que desea eliminar el derrotero: <br> <strong>${derrotero.nombreDerrotero}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.derrotService.eliminarDerrotero(derrotero.id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Eliminado!',
              background: '#002136',
              html: `El derrotero ha sido eliminado de forma exitosa.`,
              icon: 'success',
              showCancelButton: false,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.setupDataSource();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              background: '#002136',
              html: `Error al intentar eliminar el derrotero.`,
              icon: 'error',
              showCancelButton: false,
            })
          }
        );
      }
    });
  }

}
