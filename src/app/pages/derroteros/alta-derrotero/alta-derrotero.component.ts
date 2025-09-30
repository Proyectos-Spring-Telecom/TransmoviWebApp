import { Component, OnInit, AfterViewInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { DerroterosService } from 'src/app/shared/services/derroteros.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import Swal from 'sweetalert2';

declare global { interface Window { google: any; } }
declare const google: any;

@Component({
  selector: 'app-alta-derrotero',
  templateUrl: './alta-derrotero.component.html',
  styleUrls: ['./alta-derrotero.component.scss'],
  animations: [fadeInUpAnimation],
})
export class AltaDerroteroComponent implements OnInit, AfterViewInit {

  @ViewChild('exlargeModal', { static: false }) exlargeModal!: TemplateRef<any>;

  submitButton: string = 'Guardar';
  loading = false;
  listaRutas: any[] = [];
  rutaForm!: FormGroup;

  contentVisible = false;
  private apiReady = false;
  private selectedRoute: any = null;

  private map!: google.maps.Map;
  private markerInicio?: google.maps.Marker;
  private markerFin?: google.maps.Marker;
  private infoInicio?: google.maps.InfoWindow;
  private infoFin?: google.maps.InfoWindow;

  private modalRef?: NgbModalRef;
  private readonly centroDefault: google.maps.LatLngLiteral = { lat: 19.4326, lng: -99.1332 };

  // Trazo
  private isTracing = false;
  private polyline?: google.maps.Polyline;            // línea definitiva (segmentada)
  private previewLine?: google.maps.Polyline;         // línea fantasma hasta el cursor
  private vertexMarkers: google.maps.Marker[] = [];   // vértices que vas clicando
  private tracePoints: google.maps.LatLngLiteral[] = [];
  private drawListeners: google.maps.MapsEventListener[] = [];
  private domHandlers: Array<{ target: EventTarget; type: string; handler: any; options?: any }> = [];

  constructor(
    private modalService: NgbModal,
    private rutServices: RutasService,
    private fb: FormBuilder,
    private route: Router,
    private derroTService: DerroterosService
  ) { }

  ngOnInit(): void {
    this.rutaForm = this.fb.group({
      idRegion: [null, Validators.required]
    });

    this.obtenerRutas();

    this.rutaForm.get('idRegion')!.valueChanges.subscribe((idSel: any) => {
      const ruta = this.listaRutas?.find(r => r.id === idSel);
      if (!ruta) return;

      const ini = this.coordFromFeatureCollection(ruta?.puntoInicio);
      const fin = this.coordFromFeatureCollection(ruta?.puntoFin);
      if (!ini || !fin) return;

      this.selectedRoute = ruta;
      this.proceedToRender();
    });
  }

  async ngAfterViewInit(): Promise<void> {
    setTimeout(() => {
      if (!this.modalRef) {
        this.modalRef = this.modalService.open(this.exlargeModal, {
          size: 'xl',
          windowClass: 'modal-holder',
          centered: true,
          backdrop: 'static',
          keyboard: false
        });
      }
    }, 0);

    try {
      const API_KEY = 'TU_API_KEY_AQUI';
      await this.loadGoogleMaps(API_KEY);
      this.apiReady = true;
    } catch (e) {
      console.error('No se pudo inicializar Google Maps:', e);
    }
  }

  obtenerRutas(): void {
    this.rutServices.obtenerRutas().subscribe({
      next: (response) => { this.listaRutas = response?.data ?? []; },
      error: (err) => { console.error('Error al obtener rutas', err); this.listaRutas = []; }
    });
  }

  abrirModal(ev?: Event): void {
    ev?.preventDefault();
    this.modalRef = this.modalService.open(this.exlargeModal, {
      size: 'xl',
      windowClass: 'modal-holder',
      centered: true
    });
  }

  regresar(ev?: Event): void {
    this.modalRef?.close();
    this.modalRef = undefined;
    this.route.navigateByUrl('/rutas')
  }

  submit(ev?: Event): void {
    ev?.preventDefault();
    this.rutaForm.markAllAsTouched();
    if (this.rutaForm.invalid) return;
  }

  private proceedToRender(): void {
    this.modalRef?.close();
    this.modalRef = undefined;
    this.contentVisible = true;

    const tryInit = () => {
      if (!this.apiReady) { setTimeout(tryInit, 40); return; }
      const el = document.getElementById('map');
      if (!el) { setTimeout(tryInit, 40); return; }

      if (!this.map) {
        this.map = new google.maps.Map(el, {
          center: this.centroDefault,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,          // ← zoom con +/- visible
          scrollwheel: true,          // ← zoom con rueda
          gestureHandling: 'greedy',  // ← gestos habilitados
          disableDoubleClickZoom: true, // ← dblclick lo usamos para “terminar”
          draggableCursor: 'crosshair',
          draggable: true             // ← pan con arrastre SIEMPRE
        });
      } else {
        this.map.setOptions({
          zoomControl: true,
          scrollwheel: true,
          gestureHandling: 'greedy',
          disableDoubleClickZoom: true,
          draggableCursor: 'crosshair',
          draggable: true
        });
      }

      this.mostrarRutaEnMapa(this.selectedRoute);
      this.iniciarTrazadoConPanYZoom();
    };

    setTimeout(tryInit, 0);
  }

  private loadGoogleMaps(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.maps) return resolve();
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&language=es&region=MX`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Maps.'));
      document.head.appendChild(script);
    });
  }

  private limpiarMapa(): void {
    this.markerInicio?.setMap(null);
    this.markerFin?.setMap(null);
    this.infoInicio?.close();
    this.infoFin?.close();
    this.markerInicio = undefined;
    this.markerFin = undefined;
    this.infoInicio = undefined;
    this.infoFin = undefined;

    if (this.polyline) { this.polyline.setMap(null); this.polyline = undefined; }
    if (this.previewLine) { this.previewLine.setPath([]); this.previewLine.setMap(null); this.previewLine = undefined; }
    this.vertexMarkers.forEach(m => m.setMap(null));
    this.vertexMarkers = [];
    this.clearDrawListeners();
    this.clearDOMHandlers();
    this.tracePoints = [];
  }

  private mostrarRutaEnMapa(ruta: any): void {
    if (!this.map) return;

    this.markerInicio?.setMap(null);
    this.markerFin?.setMap(null);
    this.infoInicio?.close();
    this.infoFin?.close();

    const ini = this.coordFromFeatureCollection(ruta?.puntoInicio);
    const fin = this.coordFromFeatureCollection(ruta?.puntoFin);
    if (!ini || !fin) return;

    this.markerInicio = new google.maps.Marker({
      position: ini,
      map: this.map,
      title: 'Inicio',
      icon: {
        url: 'assets/images/markerGreen.png',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40)
      }
    });

    this.markerFin = new google.maps.Marker({
      position: fin,
      map: this.map,
      title: 'Destino',
      icon: {
        url: 'assets/images/markerRed.png',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40)
      }
    });

    const nombreInicio = ruta?.nombreInicio || 'Punto Inicio';
    const nombreFinal = ruta?.nombreFinal || 'Punto Fin';

    this.infoInicio = new google.maps.InfoWindow({
      content: this.buildTooltipHTML('Punto de Inicio', nombreInicio, '#1db110ff')
    });
    this.infoFin = new google.maps.InfoWindow({
      content: this.buildTooltipHTML('Punto de Destino', nombreFinal, '#d32f2f')
    });

    this.infoInicio.open(this.map, this.markerInicio);
    this.infoFin.open(this.map, this.markerFin);

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(ini);
    bounds.extend(fin);
    this.map.fitBounds(bounds, 160);
  }

  // =======================
  // Trazo con pan/zoom ON
  // =======================
  private iniciarTrazadoConPanYZoom(): void {
    if (!this.map || !this.selectedRoute) return;

    this.clearDrawListeners();
    this.clearDOMHandlers();
    this.tracePoints = [];
    this.vertexMarkers.forEach(m => m.setMap(null));
    this.vertexMarkers = [];

    // línea definitiva (segmentada) – MISMO estilo que usas
    if (!this.polyline) {
      this.polyline = new google.maps.Polyline({
        map: this.map,
        path: this.tracePoints,
        geodesic: true,
        strokeOpacity: 0,
        clickable: false,
        icons: [
          {
            icon: { path: 'M 0,-1 0,1', strokeColor: '#f30606ff', strokeOpacity: 1, strokeWeight: 4 },
            offset: '0',
            repeat: '20px',
          },
        ],
      });
    } else {
      this.polyline.setPath(this.tracePoints);
      this.polyline.setMap(this.map);
      this.polyline.setOptions({
        geodesic: true,
        strokeOpacity: 0,
        icons: [{ icon: { path: 'M 0,-1 0,1', strokeColor: '#f30606ff', strokeOpacity: 1, strokeWeight: 4 }, offset: '0', repeat: '20px' }]
      });
    }

    // línea fantasma hasta el cursor
    if (!this.previewLine) {
      this.previewLine = new google.maps.Polyline({
        map: this.map,
        path: [],
        geodesic: true,
        strokeOpacity: 0,
        clickable: false,
        icons: [
          {
            icon: { path: 'M 0,-1 0,1', strokeColor: '#f30606ff', strokeOpacity: 1, strokeWeight: 3 },
            offset: '0',
            repeat: '16px',
          },
        ],
      });
    } else {
      this.previewLine.setPath([]);
      this.previewLine.setMap(this.map);
    }

    this.isTracing = true;

    // 1) CLICK: agrega vértice (primer click arranca trazo)
    const onClick = this.map.addListener('click', (e: any) => {
      const ll: google.maps.LatLngLiteral = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      this.tracePoints.push(ll);
      this.polyline!.getPath().push(new google.maps.LatLng(ll));
      this.addVertexMarker(ll);

      if (this.tracePoints.length === 1) {
        // arrancamos la previsualización pegada al primer punto
        this.previewLine!.setPath([ll, ll]);
      }
    });

    // 2) MOUSEMOVE: actualiza línea fantasma desde último punto al cursor
    const onMouseMove = this.map.addListener('mousemove', (e: any) => {
      if (!this.isTracing || this.tracePoints.length === 0) return;
      const last = this.tracePoints[this.tracePoints.length - 1];
      const cur: google.maps.LatLngLiteral = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      this.previewLine!.setPath([last, cur]);
    });

    // 3) DBLCLICK: terminar trazo (no zoom por dblclick)
    const onDbl = this.map.addListener('dblclick', () => this.terminarTrazado());

    // 4) ESC: cancelar trazo
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.code === 'Escape') {
        ev.preventDefault();
        this.cancelarTrazado();
      } else if (ev.code === 'Enter') {
        ev.preventDefault();
        this.terminarTrazado();
      }
    };

    // listeners
    this.drawListeners.push(onClick, onMouseMove, onDbl);
    this.addDOM(window, 'keydown', onKeyDown);

    // Asegurar zoom y pan activos mientras trazas
    this.map.setOptions({
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy',
      draggable: true,
      draggableCursor: 'crosshair'
    });
  }

  // Públicos por si los llamas desde un botón:
  public cancelarTrazado(): void {
    if (!this.isTracing) return;
    this.isTracing = false;

    if (this.previewLine) {
      this.previewLine.setPath([]);
      this.previewLine.setMap(null);
      this.previewLine = undefined;
    }
    if (this.polyline) {
      this.polyline.setPath([]);
      this.polyline.setMap(null);
      this.polyline = undefined;
    }
    this.vertexMarkers.forEach(m => m.setMap(null));
    this.vertexMarkers = [];
    this.tracePoints = [];

    this.clearDrawListeners();
    this.clearDOMHandlers();

    // mapa queda normal (pan/zoom activos)
    this.map.setOptions({
      draggable: true,
      draggableCursor: undefined,
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy',
      disableDoubleClickZoom: true
    });
  }

  public terminarTrazado(): void {
    if (!this.isTracing) return;
    this.isTracing = false;

    if (this.previewLine) {
      this.previewLine.setPath([]);
      this.previewLine.setMap(null);
      this.previewLine = undefined;
    }
    this.clearDrawListeners();
    this.clearDOMHandlers();

    this.map.setOptions({
      draggable: true,
      draggableCursor: undefined,
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy',
      disableDoubleClickZoom: true
    });

    this.showPreviewPayloadBtn = (this.tracePoints?.length ?? 0) > 0;
  }
  public showPreviewPayloadBtn = false;


  private addVertexMarker(ll: google.maps.LatLngLiteral) {
    const m = new google.maps.Marker({
      position: ll,
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#000000ff',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeOpacity: 1,
        strokeWeight: 2,
        scale: 5
      }
    });
    this.vertexMarkers.push(m);
  }

  private clearDrawListeners(): void {
    this.drawListeners.forEach(l => l.remove());
    this.drawListeners = [];
  }

  private addDOM(target: EventTarget, type: string, handler: any, options?: any) {
    target.addEventListener(type, handler, options);
    this.domHandlers.push({ target, type, handler, options });
  }

  private clearDOMHandlers() {
    this.domHandlers.forEach(h => h.target.removeEventListener(h.type, h.handler, h.options));
    this.domHandlers = [];
  }

  private escapeHTML(value: unknown): string {
    const s = String(value ?? '');
    return s.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildTooltipHTML(titulo: string, direccion: string, color: string): string {
    return `
      <div style="font-family:'Segoe UI',sans-serif;border-radius:12px;max-width:260px;word-wrap:break-word;box-shadow:0 4px 12px rgba(0,0,0,.15);background:#fff;line-height:1.2;">
        <div style="font-size:14px;color:#4a4a4a;padding:6px 10px;">
          <strong style="color:${color};">${this.escapeHTML(titulo)}</strong><br>
          <b>${this.escapeHTML(direccion)}</b>
        </div>
      </div>
    `;
  }

  public get showUndo(): boolean {
    return this.isTracing && this.tracePoints.length > 0;
  }

  public undoLastPoint(): void {
    if (!this.isTracing || this.tracePoints.length === 0) return;

    // quitar último vértice del array
    this.tracePoints.pop();

    // quitar último vértice de la polilínea
    if (this.polyline) {
      const path = this.polyline.getPath();
      if (path.getLength() > 0) path.pop();
    }

    // quitar marcador de vértice
    const lastMarker = this.vertexMarkers.pop();
    if (lastMarker) lastMarker.setMap(null);

    // actualizar la línea de previsualización
    if (!this.previewLine) return;

    if (this.tracePoints.length === 0) {
      // ya no hay puntos → ocultamos la línea fantasma
      this.previewLine.setPath([]);
    } else if (this.tracePoints.length === 1) {
      // un solo punto → “clavamos” la previsualización en ese punto
      const only = this.tracePoints[0];
      this.previewLine.setPath([only, only]);
    } else {
      // hay >1 puntos → dejamos la previsualización anclada al último
      const last = this.tracePoints[this.tracePoints.length - 1];
      this.previewLine.setPath([last, last]);
    }
  }

  public showClearTraceBtn = false;

  public clearTrace(): void {
    if (!this.map) return;

    // 1) Ocultar botón de limpiar
    this.showClearTraceBtn = false;

    // 2) Limpiar trazo actual (línea, previsualización, vértices, listeners, puntos)
    if (this.polyline) { this.polyline.setPath([]); this.polyline.setMap(null); this.polyline = undefined; }
    if (this.previewLine) { this.previewLine.setPath([]); this.previewLine.setMap(null); this.previewLine = undefined; }
    this.vertexMarkers.forEach(m => m.setMap(null));
    this.vertexMarkers = [];
    this.tracePoints = [];
    this.clearDrawListeners();
    this.clearDOMHandlers();

    // 3) Recolocar marcadores e infowindows de Inicio/Fin como al seleccionar la ruta
    if (this.selectedRoute) {
      this.mostrarRutaEnMapa(this.selectedRoute); // ← vuelve a poner A/B y ajusta el mapa
    }

    // 4) Dejar pan/zoom activos y reiniciar modo de trazado (primer click arranca)
    this.map.setOptions({
      draggable: true,
      draggableCursor: 'crosshair',
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy',
      disableDoubleClickZoom: true
    });
    this.iniciarTrazadoConPanYZoom();
  }

  private round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}


  private getDireccionInicio(r: any): string {
    return r?.direccionInicio ?? r?.nombreInicio ?? 'Punto Inicio';
  }
  private getDireccionFin(r: any): string {
    return r?.direccionFinal ?? r?.nombreFinal ?? 'Punto Fin';
  }
  private coordFromFeatureCollection(fc: any): google.maps.LatLngLiteral | null {
    try {
      const c = fc?.features?.[0]?.geometry?.coordinates;
      if (!Array.isArray(c) || c.length < 2) return null;
      const lng = Number(c[0]); const lat = Number(c[1]);
      if (isNaN(lat) || isNaN(lng)) return null;
      return { lat, lng };
    } catch { return null; }
  }
  private haversineKm(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral): number {
    const R = 6371.0088;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  private totalDistanceKm(points: google.maps.LatLngLiteral[]): number {
    if (!points || points.length < 2) return 0;
    let s = 0;
    for (let i = 1; i < points.length; i++) s += this.haversineKm(points[i - 1], points[i]);
    return s;
  }

  private buildDerroteroPayload(): any {
    const r = this.selectedRoute || {};
    const nombre = r?.nombre ?? 'Ruta sin nombre';
    const idRuta = r?.id ?? this.rutaForm?.get('idRegion')?.value ?? null;

    const iniCoord = this.coordFromFeatureCollection(r?.puntoInicio);
    const finCoord = this.coordFromFeatureCollection(r?.puntoFin);

    const payload = {
      nombre: String(nombre),
      puntoInicio: {
        coordenadas: iniCoord ? { lat: iniCoord.lat, lng: iniCoord.lng } : null,
        direccion: this.getDireccionInicio(r),
      },
      puntoFin: {
        coordenadas: finCoord ? { lat: finCoord.lat, lng: finCoord.lng } : null,
        direccion: this.getDireccionFin(r),
      },
      recorridoDetallado: (this.tracePoints || []).map(p => ({ lat: p.lat, lng: p.lng })),
      distanciaKm: this.round2(this.totalDistanceKm(this.tracePoints)),
      estatus: 1,
      idRuta: idRuta
    };
    return payload;
  }

  public previewDerroteroJson(): void {
    const payload = this.buildDerroteroPayload();
    console.group('%cDERROTERO – PAYLOAD', 'color:#0a7;font-weight:bold;');
    console.log('Objeto:', payload);
    console.log('JSON:', JSON.stringify(payload, null, 2));
    console.groupEnd();
  }

  agregarDerrotero(): void {
    const payload = this.buildDerroteroPayload();
    console.group('%cDERROTERO – PAYLOAD', 'color:#0a7;font-weight:bold;');
    console.log('Objeto:', payload);
    console.log('JSON:', JSON.stringify(payload, null, 2));
    console.groupEnd();
  // armar el payload tal cual el console.log que definimos
  const body = this.buildDerroteroPayload(); // ← usa el helper que ya tienes

  // opcional: validaciones mínimas
  if (!body?.idRuta || !body?.puntoInicio?.coordenadas || !body?.puntoFin?.coordenadas) {
    Swal.fire({
      title: 'Faltan datos',
      background: '#002136',
      text: 'Selecciona una ruta y traza al menos un segmento.',
      icon: 'warning',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Entendido',
    });
    return;
  }

  this.submitButton = 'Guardando...';
  this.loading = true;

  this.derroTService.agregarDerrotero(body).subscribe({
    next: (response) => {
      this.submitButton = 'Guardar';
      this.loading = false;
      Swal.fire({
        title: '¡Operación Exitosa!',
        background: '#002136',
        text: 'Se agregó un nuevo derrotero de manera exitosa.',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      }).then(() => this.route.navigateByUrl('/derroteros'));
    },
    error: (error) => {
      this.submitButton = 'Guardar';
      this.loading = false;
      Swal.fire({
        title: '¡Ops!',
        background: '#002136',
        text: 'Ocurrió un error al agregar el derrotero.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
    }
  });
}


}
