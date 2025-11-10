import { Component, OnInit, AfterViewInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { DerroterosService } from 'src/app/shared/services/derroteros.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import Swal from 'sweetalert2';
import {
  trigger, transition, style, animate, state, query, stagger
} from '@angular/animations';
import { TarifasService } from 'src/app/shared/services/tarifa.service';

declare global { interface Window { google: any; } }
declare const google: any;

@Component({
  selector: 'app-alta-derrotero',
  templateUrl: './alta-derrotero.component.html',
  styleUrls: ['./alta-derrotero.component.scss'],
  animations: [fadeInUpAnimation,
    trigger('panelAnim', [
      state('all', style({ opacity: 1, transform: 'none' })),
      state('filtered', style({ opacity: 1, transform: 'none' })),
      transition('all => filtered', [
        style({ opacity: 0, transform: 'scale(0.98)' }),
        animate('180ms ease-out')
      ]),
      transition('filtered => all', [
        style({ opacity: 0, transform: 'scale(0.98)' }),
        animate('220ms ease-out')
      ]),
    ]),
    trigger('listAnim', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(6px) scale(0.98)' }),
          stagger(30, animate('160ms ease-out',
            style({ opacity: 1, transform: 'none' })
          ))
        ], { optional: true }),
        query(':leave', [
          stagger(15, animate('120ms ease-in',
            style({ opacity: 0, transform: 'translateY(-6px) scale(0.98)' })
          ))
        ], { optional: true })
      ])
    ])
  ]
})
export class AltaDerroteroComponent implements OnInit, AfterViewInit {

  @ViewChild('exlargeModal', { static: false }) exlargeModal!: TemplateRef<any>;
  extraLarges(tpl: TemplateRef<any>) {
    // Identifica el modal según el template
    this.currentModalType = (tpl === this.exlargeModalForm) ? 'tarifa' : 'ruta';

    this.modalRef = this.modalService.open(tpl, {
      size: 'xl',
      windowClass: 'modal-holder',
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
  }

  private resetAllState(): void {
    try { this.cancelarTrazado(); } catch { }
    try { this.clearDrawListeners(); } catch { }
    try { this.clearDOMHandlers(); } catch { }

    try { this.limpiarMapa(); } catch { }

    this.selectedRoute = null;
    this.vertexMarkers = [];
    this.tracePoints = [];
    this.polyline = undefined;
    this.previewLine = undefined;

    this.contentVisible = false;
    this.showPreviewPayloadBtn = false;
    this.showClearTraceBtn = false;
    this.submitButton = 'Guardar';
    this.loading = false;

    this.rutaForm?.reset({ idRegion: null });
    this.tarifaForm?.reset({
      tarifaBase: null,
      distanciaBaseKm: null,
      incrementoCadaMetros: null,
      costoAdicional: null,
      estatus: 1,
      idDerrotero: null,
    });

    this.rutaSearch?.setValue('', { emitEvent: false });
    this.filteredRutas = [...(this.listaRutas ?? [])];

    try { this.modalService.dismissAll(); } catch { }
    this.modalRef = undefined;
  }


  @ViewChild('exlargeModalForm', { static: false }) exlargeModalForm!: TemplateRef<any>;

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
  private isTracing = false;
  private polyline?: google.maps.Polyline;
  private previewLine?: google.maps.Polyline;
  private vertexMarkers: google.maps.Marker[] = [];
  private tracePoints: google.maps.LatLngLiteral[] = [];
  private drawListeners: google.maps.MapsEventListener[] = [];
  private domHandlers: Array<{ target: EventTarget; type: string; handler: any; options?: any }> = [];
  rutaSearch = new FormControl<string>('', { nonNullable: true });
  filteredRutas: any[] = [];
  public tarifaForm: FormGroup;
  public idTarifa: number;
  public titleTarifa = 'Agregar Tarifa';
  tiposTarifa = [
    { id: 1, nombre: 'Fija' },
    { id: 2, nombre: 'Modificable' },
  ];

  constructor(
    private modalService: NgbModal,
    private rutServices: RutasService,
    private fb: FormBuilder,
    private route: Router,
    private derroTService: DerroterosService,
    private tarSerice: TarifasService,
  ) { }

  ngOnInit(): void {
    this.initForm()
    this.rutaSearch.valueChanges
      .pipe(
        startWith(this.rutaSearch.value),
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(q => {
        this.filteredRutas = this.filterRutas(q);
      });

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

  initForm() {
    this.tarifaForm = this.fb.group({
      tipoTarifa : [null, Validators.required],
      tarifaBase: [null, Validators.required],
      distanciaBaseKm: [null, Validators.required],
      incrementoCadaMetros: [null, Validators.required],
      costoAdicional: [null, Validators.required],
      estatus: [1, Validators.required],
      idDerrotero: [null, Validators.required],
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
      next: (response) => {
        this.listaRutas = response?.data ?? [];
        this.filteredRutas = this.filterRutas(this.rutaSearch.value);
      },
      error: (err) => {
        console.error('Error al obtener rutas', err);
        this.listaRutas = [];
        this.filteredRutas = [];
      }
    });
  }

  trackByRutaId = (_: number, item: any) => item?.id;

  abrirModal(ev?: Event): void {
    ev?.preventDefault();
    this.modalRef = this.modalService.open(this.exlargeModal, {
      size: 'xl',
      windowClass: 'modal-holder',
      centered: true
    });
  }

  allowInteger(event: KeyboardEvent): void {
  const key = event.key;
  // permitir controles
  if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) return;
  // permitir solo dígitos
  if (!/^[0-9]$/.test(key)) event.preventDefault();
}

// Permitir decimales con un solo punto o coma
allowDecimal(event: KeyboardEvent): void {
  const key = event.key;
  if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) return;
  const target = event.target as HTMLInputElement;
  // dígitos
  if (/^[0-9]$/.test(key)) return;
  // punto o coma solo una vez
  if ((key === '.' || key === ',') && !/[.,]/.test(target.value)) return;
  event.preventDefault();
}

// Parser común para enviar solo números
private parseNumeric(value: any): number | null {
  if (value === null || value === undefined) return null;
  const raw = value.toString().replace(/[^0-9.,-]/g, '').replace(',', '.');
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

// Si quieres que el formulario también quede en number antes de enviar:
private normalizeFormToNumbers(): void {
  const v = this.tarifaForm.value;
  this.tarifaForm.patchValue({
    tarifaBase: this.parseNumeric(v.tarifaBase),
    distanciaBaseKm: this.parseNumeric(v.distanciaBaseKm),
    incrementoCadaMetros: this.parseNumeric(v.incrementoCadaMetros),
    costoAdicional: this.parseNumeric(v.costoAdicional),
  }, { emitEvent: false });
}

  onTarifaFocus(): void {
    const c = this.tarifaForm.get('tarifaBase');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  }

  onTarifaBlur(): void {
    const c = this.tarifaForm.get('tarifaBase');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) { c.setValue(''); return; }
    c.setValue(`$${num.toFixed(2)}`);
  }

  onCostoFocus(): void {
    const c = this.tarifaForm.get('costoAdicional');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  }

  onCostoBlur(): void {
    const c = this.tarifaForm.get('costoAdicional');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) { c.setValue(''); return; }
    c.setValue(`$${num.toFixed(2)}`);
  }

  onDistanciaFocus(): void {
    const c = this.tarifaForm.get('distanciaBaseKm');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9]/g, ''));
  }

  onDistanciaBlur(): void {
    const c = this.tarifaForm.get('distanciaBaseKm');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9]/g, '');
    if (!raw) { c.setValue(''); return; }
    c.setValue(`${raw} km`);
  }

  onIncrementoFocus(): void {
    const c = this.tarifaForm.get('incrementoCadaMetros');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9]/g, ''));
  }

  onIncrementoBlur(): void {
    const c = this.tarifaForm.get('incrementoCadaMetros');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9]/g, '');
    if (!raw) { c.setValue(''); return; }
    c.setValue(`${raw} m`);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  regresarRuta(ev?: Event): void {
    this.modalRef?.close();
    this.modalRef = undefined;
    this.route.navigateByUrl('/derroteros')
  }

  private currentModalType: 'ruta' | 'tarifa' | null = null;
  regresar(ev?: Event): void {
    this.regresarRuta()
    this.resetAllState();

    this.modalRef?.close();
    this.modalRef = undefined;
    this.route.navigateByUrl('/derroteros')
  }


  private initOrResetMap(): void {
    const el = document.getElementById('map');
    if (!el) return;

    if (!this.map) {
      this.map = new google.maps.Map(el, {
        center: this.centroDefault,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        scrollwheel: true,
        gestureHandling: 'greedy',
        disableDoubleClickZoom: true,
        draggableCursor: 'crosshair',
        draggable: true
      });
    } else {
      this.limpiarMapa();
      this.map.setOptions({
        zoomControl: true,
        scrollwheel: true,
        gestureHandling: 'greedy',
        disableDoubleClickZoom: true,
        draggable: true,
        draggableCursor: 'crosshair'
      });
      this.map.setCenter(this.centroDefault);
      this.map.setZoom(12);
    }
  }

  private openRouteModal(): void {
    try { this.modalService.dismissAll(); } catch { }

    this.currentModalType = 'ruta';
    this.modalRef = this.modalService.open(this.exlargeModal, {
      size: 'xl',
      windowClass: 'modal-holder',
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
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
          zoomControl: true,
          scrollwheel: true,
          gestureHandling: 'greedy',
          disableDoubleClickZoom: true,
          draggableCursor: 'crosshair',
          draggable: true
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

      this.geocoder = new google.maps.Geocoder();
      this.mostrarRutaEnMapa(this.selectedRoute);
      this.iniciarTrazadoConPanYZoom();
    };
    setTimeout(tryInit, 0);
  }

  private filterRutas(query: string): any[] {
    const q = this.normalizes(query);
    const list = this.listaRutas ?? [];
    if (!q) return [...list];
    return list.filter((r: any) => this.normalizes(r?.nombre).startsWith(q));
  }

  private normalizes(v: any): string {
    return (v ?? '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private geocoder!: google.maps.Geocoder;

  private normalizeStr(v: any): string {
    return (typeof v === 'string' ? v.trim() : '');
  }

  private isPlaceholder(v: string): boolean {
    const s = this.normalizeStr(v).toLowerCase();
    return !s || s === 'punto inicio' || s === 'punto fin';
  }

  private geocodeLatLng(coord: google.maps.LatLngLiteral): Promise<string> {
    return new Promise((resolve) => {
      if (!this.geocoder) { resolve(''); return; }
      this.geocoder.geocode({ location: coord }, (res: any, status: string) => {
        if (status === 'OK' && res && res[0]?.formatted_address) {
          resolve(res[0].formatted_address);
        } else {
          resolve('');
        }
      });
    });
  }

  private async resolveRouteAddresses(route: any): Promise<{ dirInicio: string; dirFin: string }> {
    const dirIniRaw =
      route?.direccionInicio ??
      route?.nombreInicio ??
      route?.nombreInicial ??
      route?.direccionInicial ?? '';

    const dirFinRaw =
      route?.nombreFin ??
      route?.direccionFinal ??
      route?.nombreFinal ??
      route?.direccionFin ?? '';

    let dirInicio = this.normalizeStr(dirIniRaw);
    let dirFin = this.normalizeStr(dirFinRaw);

    const iniCoord = this.coordFromFeatureCollection(route?.puntoInicio);
    const finCoord = this.coordFromFeatureCollection(route?.puntoFin);

    if (this.isPlaceholder(dirInicio) && iniCoord) {
      dirInicio = (await this.geocodeLatLng(iniCoord)) || 'Punto Inicio';
    }
    if (this.isPlaceholder(dirFin) && finCoord) {
      dirFin = (await this.geocodeLatLng(finCoord)) || 'Punto Fin';
    }

    return { dirInicio, dirFin };
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

  private firstNonEmpty(values: any[], fallback: string): string {
    for (const v of values) {
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return fallback;
  }

  private getLabelInicio(ruta: any): string {
    return this.firstNonEmpty(
      [ruta?.nombreInicio, ruta?.direccionInicio, ruta?.nombreInicial, ruta?.direccionInicial],
      'Punto de Inicio'
    );
  }

  private getLabelFin(ruta: any): string {
    return this.firstNonEmpty(
      [ruta?.nombreFin, ruta?.direccionFinal, ruta?.nombreFinal, ruta?.direccionFin],
      'Punto de Destino'
    );
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

    const nombreInicio = this.getLabelInicio(ruta);
    const nombreFinal = this.getLabelFin(ruta);

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

  private iniciarTrazadoConPanYZoom(): void {
    if (!this.map || !this.selectedRoute) return;

    this.clearDrawListeners();
    this.clearDOMHandlers();
    this.tracePoints = [];
    this.vertexMarkers.forEach(m => m.setMap(null));
    this.vertexMarkers = [];

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

    const onClick = this.map.addListener('click', (e: any) => {
      const ll: google.maps.LatLngLiteral = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      this.tracePoints.push(ll);
      this.polyline!.getPath().push(new google.maps.LatLng(ll));
      this.addVertexMarker(ll);

      if (this.tracePoints.length === 1) {
        this.previewLine!.setPath([ll, ll]);
      }
    });

    const onMouseMove = this.map.addListener('mousemove', (e: any) => {
      if (!this.isTracing || this.tracePoints.length === 0) return;
      const last = this.tracePoints[this.tracePoints.length - 1];
      const cur: google.maps.LatLngLiteral = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      this.previewLine!.setPath([last, cur]);
    });
    const onDbl = this.map.addListener('dblclick', () => this.terminarTrazado());

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.code === 'Escape') {
        ev.preventDefault();
        this.cancelarTrazado();
      } else if (ev.code === 'Enter') {
        ev.preventDefault();
        this.terminarTrazado();
      }
    };

    this.drawListeners.push(onClick, onMouseMove, onDbl);
    this.addDOM(window, 'keydown', onKeyDown);

    this.map.setOptions({
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy',
      draggable: true,
      draggableCursor: 'crosshair'
    });
  }

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

    this.tracePoints.pop();

    if (this.polyline) {
      const path = this.polyline.getPath();
      if (path.getLength() > 0) path.pop();
    }

    const lastMarker = this.vertexMarkers.pop();
    if (lastMarker) lastMarker.setMap(null);

    if (!this.previewLine) return;

    if (this.tracePoints.length === 0) {
      this.previewLine.setPath([]);
    } else if (this.tracePoints.length === 1) {
      const only = this.tracePoints[0];
      this.previewLine.setPath([only, only]);
    } else {
      const last = this.tracePoints[this.tracePoints.length - 1];
      this.previewLine.setPath([last, last]);
    }
  }

  public showClearTraceBtn = false;

  public clearTrace(): void {
    if (!this.map) return;
    this.showClearTraceBtn = false;
    if (this.polyline) { this.polyline.setPath([]); this.polyline.setMap(null); this.polyline = undefined; }
    if (this.previewLine) { this.previewLine.setPath([]); this.previewLine.setMap(null); this.previewLine = undefined; }
    this.vertexMarkers.forEach(m => m.setMap(null));
    this.vertexMarkers = [];
    this.tracePoints = [];
    this.clearDrawListeners();
    this.clearDOMHandlers();
    if (this.selectedRoute) {
      this.mostrarRutaEnMapa(this.selectedRoute);
    }

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
    return r?.nombreFin ?? r?.direccionFinal ?? r?.nombreFinal ?? 'Punto Fin';
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

  private async buildDerroteroPayloadAsync(): Promise<any> {
    const r = this.selectedRoute || {};
    const nombre = r?.nombre ?? 'Ruta sin nombre';
    const idRuta = r?.id ?? this.rutaForm?.get('idRegion')?.value ?? null;

    const iniCoord = this.coordFromFeatureCollection(r?.puntoInicio);
    const finCoord = this.coordFromFeatureCollection(r?.puntoFin);

    const { dirInicio, dirFin } = await this.resolveRouteAddresses(r);

    return {
      nombre: String(nombre),
      puntoInicio: {
        coordenadas: iniCoord ? { lat: iniCoord.lat, lng: iniCoord.lng } : null,
        direccion: dirInicio
      },
      puntoFin: {
        coordenadas: finCoord ? { lat: finCoord.lat, lng: finCoord.lng } : null,
        direccion: dirFin
      },
      recorridoDetallado: (this.tracePoints || []).map(p => ({ lat: p.lat, lng: p.lng })),
      distanciaKm: this.round2(this.totalDistanceKm(this.tracePoints)),
      estatus: 1,
      idRuta: idRuta
    };
  }

  public previewDerroteroJson(): void {
    const payload = this.buildDerroteroPayload();
    console.group('%cDERROTERO – PAYLOAD', 'color:#0a7;font-weight:bold;');
    console.log('Objeto:', payload);
    console.log('JSON:', JSON.stringify(payload, null, 2));
    console.groupEnd();
  }

  async agregarDerrotero(): Promise<void> {
    const body = await this.buildDerroteroPayloadAsync();

    if (!body?.idRuta || !body?.puntoInicio?.coordenadas || !body?.puntoFin?.coordenadas || !body?.recorridoDetallado?.length) {
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

    const res = await Swal.fire({
      title: '¡Advertencia!',
      text: '¿Está seguro de guardar el trayecto?',
      icon: 'question',
      background: '#002136',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Editar',
      footer: '<small style="color:#9bb8cc">Si tienes cambios presiona editar.</small>',
    });

    if (!res.isConfirmed) {
      this.showPreviewPayloadBtn = false;
      this.showClearTraceBtn = true;
      this.resumeTracingFromCurrent();
      return;
    }

    Swal.fire({
      title: 'Cargando…',
      background: '#03131dff',
      backdrop: 'rgba(0, 0, 0, 0.86)',
      color: '#e3f8f2',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.submitButton = 'Guardando...';
    this.loading = true;

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    this.derroTService.agregarDerrotero(body).subscribe({
      next: async (resp: any) => {
        console.log('Operación Exitosa', 'Se agrego un derrotero correctamente.');

        const createdId = Number(resp?.id ?? resp?.data?.id);
        if (!isNaN(createdId) && createdId > 0) {
          this.tarifaForm.patchValue({ idDerrotero: createdId });
          this.tarifaForm.get('idDerrotero')?.markAsDirty();
          this.tarifaForm.get('idDerrotero')?.updateValueAndValidity({ onlySelf: true });
        }

        this.submitButton = 'Guardar';
        this.loading = false;
        await sleep(2500);
        Swal.close();
        await sleep(500);
        this.extraLarges(this.exlargeModalForm);
      },
      error: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.close();

        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: 'Ocurrió un error al agregar el derrotero, vuelve a intentarlo.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  private resumeTracingFromCurrent(): void {
    if (!this.map || !this.polyline) return;

    this.clearDrawListeners?.();
    this.clearDOMHandlers?.();

    const path = this.polyline.getPath();
    this.tracePoints = path.getArray().map(p => p.toJSON());

    if (!this.previewLine) {
      this.previewLine = new google.maps.Polyline({
        map: this.map,
        path: [],
        geodesic: true,
        strokeOpacity: 0,
        clickable: false,
        icons: [
          {
            icon: { path: 'M 0,-1 0,1', strokeColor: '#7e8a99', strokeOpacity: 1, strokeWeight: 3 },
            offset: '0',
            repeat: '16px',
          },
        ],
      });
    } else {
      this.previewLine.setMap(this.map);
    }

    if (this.tracePoints.length > 0) {
      const last = this.tracePoints[this.tracePoints.length - 1];
      this.previewLine.setPath([last, last]);
    } else {
      this.previewLine.setPath([]);
    }

    this.isTracing = true;

    const onClick = this.map.addListener('click', (e: any) => {
      const ll = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      this.tracePoints.push(ll);
      path.push(new google.maps.LatLng(ll));
      this.addVertexMarker?.(ll);
    });

    const onMouseMove = this.map.addListener('mousemove', (e: any) => {
      if (!this.isTracing || this.tracePoints.length === 0) return;
      const last = this.tracePoints[this.tracePoints.length - 1];
      const cur = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      this.previewLine!.setPath([last, cur]);
    });

    const onDbl = this.map.addListener('dblclick', () => this.terminarTrazado());
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.code === 'Escape') this.cancelarTrazado();
      if (ev.code === 'Enter') this.terminarTrazado();
    };

    this.drawListeners.push(onClick, onMouseMove, onDbl);
    this.addDOM?.(window, 'keydown', onKeyDown);
    this.map.setOptions({
      draggable: true,
      draggableCursor: 'crosshair',
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy',
      disableDoubleClickZoom: true
    });
  }

  moneyKeydown(e: KeyboardEvent) {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    const input = e.target as HTMLInputElement;
    const value = input.value || '';
    if (e.key === '.') {
      if (value.includes('.')) e.preventDefault();
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    const selStart = input.selectionStart ?? value.length;
    const selEnd = input.selectionEnd ?? value.length;
    const newValue = value.slice(0, selStart) + e.key + value.slice(selEnd);
    const parts = newValue.split('.');
    if (parts[1] && parts[1].length > 2) e.preventDefault();
  }

  moneyInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let v = (input.value || '').replace(',', '.');
    v = v.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }
    const parts = v.split('.');
    if (parts[1]) v = parts[0] + '.' + parts[1].slice(0, 2);
    input.value = v;
    this.tarifaForm.get('tarifaBase')?.setValue(v, { emitEvent: false });
  }

  moneyPaste(e: ClipboardEvent) {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const text = (e.clipboardData?.getData('text') || '').replace(',', '.');

    let v = text.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }
    const parts = v.split('.');
    if (parts[1]) v = parts[0] + '.' + parts[1].slice(0, 2);

    input.value = v;
    this.tarifaForm.get('tarifaBase')?.setValue(v, { emitEvent: false });
  }

  moneyBlur(e: FocusEvent) {
    const input = e.target as HTMLInputElement;
    let v = input.value;
    if (!v) return;
    if (/^\d+$/.test(v)) {
      v = v + '.00';
    } else if (/^\d+\.\d$/.test(v)) {
      v = v + '0';
    } else if (/^\d+\.\d{2}$/.test(v)) {
    } else {
      v = v.replace(',', '.').replace(/[^0-9.]/g, '');
      const parts = v.split('.');
      v = parts[0] + (parts[1] ? '.' + parts[1].slice(0, 2) : '.00');
      if (/^\d+$/.test(v)) v = v + '.00';
      if (/^\d+\.\d$/.test(v)) v = v + '0';
    }
    input.value = v;
    this.tarifaForm.get('tarifaBase')?.setValue(v, { emitEvent: false });
  }

  costoKeydown(e: KeyboardEvent) {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    const input = e.target as HTMLInputElement;
    const value = input.value || '';
    if (e.key === '.') {
      if (value.includes('.')) e.preventDefault();
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    const selStart = input.selectionStart ?? value.length;
    const selEnd = input.selectionEnd ?? value.length;
    const newValue = value.slice(0, selStart) + e.key + value.slice(selEnd);
    const parts = newValue.split('.');
    if (parts[1] && parts[1].length > 2) e.preventDefault();
  }

  costoInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let v = (input.value || '').replace(',', '.');
    v = v.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }
    const parts = v.split('.');
    if (parts[1]) v = parts[0] + '.' + parts[1].slice(0, 2);
    input.value = v;
    this.tarifaForm.get('costoAdicional')?.setValue(v, { emitEvent: false });
  }

  costoPaste(e: ClipboardEvent) {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const text = (e.clipboardData?.getData('text') || '').replace(',', '.');

    let v = text.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }
    const parts = v.split('.');
    if (parts[1]) v = parts[0] + '.' + parts[1].slice(0, 2);

    input.value = v;
    this.tarifaForm.get('costoAdicional')?.setValue(v, { emitEvent: false });
  }

  costoBlur(e: FocusEvent) {
    const input = e.target as HTMLInputElement;
    let v = input.value;
    if (!v) return;
    if (/^\d+$/.test(v)) {
      v = v + '.00';
    } else if (/^\d+\.\d$/.test(v)) {
      v = v + '0';
    } else if (/^\d+\.\d{2}$/.test(v)) {
    } else {
      v = v.replace(',', '.').replace(/[^0-9.]/g, '');
      const parts = v.split('.');
      v = parts[0] + (parts[1] ? '.' + parts[1].slice(0, 2) : '.00');
      if (/^\d+$/.test(v)) v = v + '.00';
      if (/^\d+\.\d$/.test(v)) v = v + '0';
    }
    input.value = v;
    this.tarifaForm.get('costoAdicional')?.setValue(v, { emitEvent: false });
  }

  incrementoKeydown(e: KeyboardEvent) {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowed.includes(e.key)) return;

    const input = e.target as HTMLInputElement;
    const value = input.value || '';

    if (e.key === '.') {
      if (value.includes('.')) e.preventDefault();
      return;
    }

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  incrementoInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let v = (input.value || '').replace(',', '.');
    v = v.replace(/[^0-9.]/g, '');

    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }

    input.value = v;
    this.tarifaForm.get('incrementoCadaMetros')?.setValue(v, { emitEvent: false });
  }

  incrementoPaste(e: ClipboardEvent) {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const text = (e.clipboardData?.getData('text') || '').replace(',', '.');

    let v = text.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }

    input.value = v;
    this.tarifaForm.get('incrementoCadaMetros')?.setValue(v, { emitEvent: false });
  }

  distanciaKeydown(e: KeyboardEvent) {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowed.includes(e.key)) return;

    const input = e.target as HTMLInputElement;
    const value = input.value || '';

    if (e.key === '.') {
      if (value.includes('.')) e.preventDefault();
      return;
    }

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  distanciaInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let v = (input.value || '').replace(',', '.');
    v = v.replace(/[^0-9.]/g, '');

    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }

    input.value = v;
    this.tarifaForm.get('distanciaBaseKm')?.setValue(v, { emitEvent: false });
  }

  distanciaPaste(e: ClipboardEvent) {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const text = (e.clipboardData?.getData('text') || '').replace(',', '.');

    let v = text.replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v.slice(firstDot + 1).replace(/\./g, '');
      v = before + after;
    }

    input.value = v;
    this.tarifaForm.get('distanciaBaseKm')?.setValue(v, { emitEvent: false });
  }

  agregarTarifa(): void {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.tarifaForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: Record<string, string> = {
        tarifaBase: 'Tarifa Base',
        tipoTarifa: 'Tipo Tarifa',
        distanciaBaseKm: 'Distancia Base KM',
        incrementoCadaMetros: 'Incremento por cada 100 m adicionales',
        costoAdicional: 'Costo Adicional',
        estatus: 'Estatus',
        idDerrotero: 'Derrotero',
      };

      const faltantes: string[] = [];
      Object.keys(this.tarifaForm.controls).forEach((key) => {
        const control = this.tarifaForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          faltantes.push(etiquetas[key] || key);
        }
      });

      const lista = faltantes.map((campo, i) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${i + 1}. ${campo}</strong>
      </div>
    `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Completa los siguientes campos antes de continuar:
        </p>
        <div style="max-height:350px;overflow-y:auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const v = this.tarifaForm.value;
    const payload = {
      tipoTarifa: this.toNum(v.tipoTarifa),
      tarifaBase: this.parseNumeric(v.tarifaBase),
      distanciaBaseKm: this.parseNumeric(v.distanciaBaseKm),
      incrementoCadaMetros: this.parseNumeric(v.incrementoCadaMetros),
      costoAdicional: this.parseNumeric(v.costoAdicional),
      estatus: this.toNum(v.estatus),
      idDerrotero: this.toNum(v.idDerrotero),
    };

    const etiquetasNum: Record<string, string> = {
      tarifaBase: 'Tarifa Base',
      distanciaBaseKm: 'Distancia Base KM',
      incrementoCadaMetros: 'Incremento por cada 100 m adicionales',
      costoAdicional: 'Costo Adicional',
      estatus: 'Estatus',
      idDerrotero: 'Derrotero',
    };
    const invalidNums = Object.entries(payload)
      .filter(([_, val]) => Number.isNaN(val))
      .map(([k]) => etiquetasNum[k] || k);

    if (invalidNums.length) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const lista = invalidNums.map((campo, i) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${i + 1}. ${campo} (número inválido)</strong>
      </div>
    `).join('');

      Swal.fire({
        title: 'Datos inválidos',
        background: '#002136',
        html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Revisa los siguientes campos. Deben ser valores numéricos:
        </p>
        <div style="max-height:350px;overflow-y:auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    this.tarSerice.agregarTarifa(payload).subscribe(
      () => {
        this.modalService.dismissAll();
        this.submitButton = 'Guardar';
        this.loading = false;
        this.regresar();
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo derrotero de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: `Ocurrió un error al agregar la tarifa.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  private toNum(v: any): number {
    if (v === null || v === undefined) return NaN;
    if (typeof v === 'string') v = v.replace(',', '.').trim();
    return Number(v);
  }
}