import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { RegionesService } from 'src/app/shared/services/regiones.service';
import Swal from 'sweetalert2';

declare const google: any;

@Component({
  selector: 'app-alta-region',
  templateUrl: './alta-region.component.html',
  styleUrls: ['./alta-region.component.scss'],
  animations: [fadeInUpAnimation],
})
export class AltaRegionComponent implements OnInit, AfterViewInit, OnDestroy {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public regionesForm: FormGroup;
  public idRegion: number;
  public title = 'Agregar Región';
  loadingDependientes = false;
  listaClientes: any[] = [];
  listaDipositivos: any[] = [];
  listaBlueVox: any[] = [];
  listaVehiculos: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;
  displayCliente = (c: any) =>
    c ? `${c.nombre || ''} ${c.apellidoPaterno || ''}`.trim() : '';

  public idClienteUser!: number;
  public idRolUser!: number;
  get isAdmin(): boolean {
    return this.idRolUser === 1;
  }

  private static mapsLoading?: Promise<void>;
  private map?: any;
  private resizeObserver?: ResizeObserver;
  private drawingManager?: any;
  private polygon?: any;

  private readonly defaultCenter = { lat: 19.2826, lng: -99.6557 };
  private readonly defaultZoom = 13;
  private readonly googleMapsApiKey = '';

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private regiService: RegionesService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private clieService: ClientesService,
    private users: AuthenticationService
  ) {
    const user = this.users.getUser();
    this.idClienteUser = Number(user?.idCliente);
    this.idRolUser = Number(user?.rol?.id);
  }

  ngOnInit(): void {
    this.initForm();
    this.obtenerClientes();

    this.activatedRouted.params.subscribe((params) => {
      this.idRegion = Number(params['idRegion']);
      if (this.idRegion) {
        this.title = 'Actualizar Región';
        this.submitButton = 'Actualizar';
        this.obtenerRegion();
      } else {
        this.submitButton = 'Guardar';
      }
    });
  }

  ngAfterViewInit(): void {
    this.loadGoogleMaps()
      .then(async () => {
        await this.initMap();
        this.observeResize();

        if (!(window as any).google?.maps?.drawing) {
          console.warn('[GMAPS] La librería drawing NO está cargada.');
          this.toast(
            'No se cargó la librería de dibujo. Revisa que el script tenga &libraries=drawing.',
            'warning'
          );
          return;
        }

        this.initDrawing();
        this.addDrawControl();
        this.addClearControl();

        const path = this.regionesForm.get('geocerca')?.value;
        if (Array.isArray(path) && path.length >= 3) {
          this.drawPolygonFromPath(path);
          this.fitToPolygon();
        }
      })
      .catch((err) => {
        this.showMapsErrorOverlay(
          'No se pudo cargar Google Maps',
          (err as Error)?.message || 'Error desconocido'
        );
        console.error('Google Maps no cargó:', err);
      });
  }

  private logPolygonPath(source: string = 'update'): void {
    if (!this.polygon) {
      console.warn('[Geocerca]', source, '— sin polígono');
      return;
    }
    const pathArr = this.polygon.getPath().getArray();
    const coords = pathArr.map((ll: any, i: number) => ({
      index: i + 1,
      lat: Number(ll.lat().toFixed(6)),
      lng: Number(ll.lng().toFixed(6)),
    }));

    console.group(`[Geocerca] ${source}`);
    console.table(coords);
    console.log('coords array:', coords);
    const geojson = {
      type: 'Polygon',
      coordinates: [
        [
          ...coords.map((c) => [c.lng, c.lat]),
          coords.length ? [coords[0].lng, coords[0].lat] : [],
        ],
      ],
    };
    console.log('GeoJSON Polygon:', geojson);
    console.groupEnd();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  initForm() {
    this.regionesForm = this.fb.group({
      estatus: [1, Validators.required],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      idCliente: [
        this.isAdmin ? null : this.idClienteUser,
        Validators.required,
      ],
      geocerca: [[]],
    });

    if (!this.isAdmin) {
      this.regionesForm.get('idCliente')?.disable({ onlySelf: true });
    }
  }

  private normalizeId<T extends { id: any }>(
    arr: T[] = []
  ): (T & { id: number })[] {
    return arr.map((x: any) => ({ ...x, id: Number(x.id) }));
  }

  obtenerClientes() {
    this.clieService.obtenerClientes().subscribe((response: any) => {
      this.listaClientes = this.normalizeId(response?.data || []);
      if (!this.isAdmin) {
        this.regionesForm
          .get('idCliente')
          ?.setValue(this.idClienteUser, { emitEvent: false });
      }
    });
  }

  private extractPathFromGeo(gx: any): Array<{ lat: number; lng: number }> {
    if (!gx) return [];

    if (
      gx.type === 'FeatureCollection' &&
      Array.isArray(gx.features) &&
      gx.features.length
    ) {
      const geom = gx.features[0]?.geometry;
      return this.extractPathFromGeo(geom);
    }

    if (gx.type === 'Feature' && gx.geometry) {
      return this.extractPathFromGeo(gx.geometry);
    }

    if (gx.type === 'Polygon' && Array.isArray(gx.coordinates)) {
      const ring = gx.coordinates[0] || [];
      return ring
        .map((p: any) =>
          Array.isArray(p) && p.length >= 2
            ? { lat: Number(p[1]), lng: Number(p[0]) }
            : null
        )
        .filter(Boolean) as Array<{ lat: number; lng: number }>;
    }

    if (Array.isArray(gx)) {
      return gx
        .map((p: any) => ({ lat: Number(p?.lat), lng: Number(p?.lng) }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    }

    return [];
  }

  obtenerRegion() {
    this.regiService.obtenerRegion(this.idRegion).subscribe({
      next: (response: any) => {
        const data = Array.isArray(response?.data)
          ? response.data[0]
          : response?.data;
        if (!data) return;

        const idCliSrv = Number(
          (data as any)?.idCliente ?? (data as any)?.idCliente2?.id ?? null
        );

        const gxAny: any =
          (data as any)?.geocerca ??
          (data as any)?.poligono ??
          (data as any)?.polygon ??
          (data as any)?.coordenadas ??
          null;

        const path = this.extractPathFromGeo(gxAny);

        this.regionesForm.patchValue(
          {
            estatus: data?.estatus ?? 1,
            nombre: data?.nombre ?? '',
            descripcion: data?.descripcion ?? '',
            idCliente: this.isAdmin ? idCliSrv : this.idClienteUser,
            geocerca: path || [],
          },
          { emitEvent: false }
        );

        if (this.map && Array.isArray(path) && path.length >= 3) {
          this.drawPolygonFromPath(path);
          this.fitToPolygon();
        }

        if (!this.isAdmin) {
          this.regionesForm.get('idCliente')?.disable({ onlySelf: true });
        } else {
          this.regionesForm.get('idCliente')?.enable({ onlySelf: true });
        }
      },
      error: (err) => console.error('Error al obtener región:', err),
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idRegion) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  private logPreview(payload: any, geojson: any) {
    console.groupCollapsed(
      `%c PAYLOAD LISTO PARA ENVÍO ${this.idRegion ? '(UPDATE)' : '(CREATE)'}`,
      'background:#0d6efd;color:#fff;padding:2px 6px;border-radius:4px;'
    );
    console.log('payload:', payload);

    if (Array.isArray(payload?.geocerca)) {
      const tabla = payload.geocerca.map((p: any, i: number) => ({
        index: i + 1,
        lat: p.lat,
        lng: p.lng,
      }));
      console.table(tabla);
    } else {
      console.log('geocerca: []');
    }

    if (geojson) {
      console.log('geojson:', geojson);
    } else {
      console.log('geojson: (no válido; se requieren al menos 3 vértices)');
    }
    console.groupEnd();
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.regionesForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      return;
    }

    const raw = this.regionesForm.getRawValue();
    const featureCollection = this.buildFeatureCollectionFromForm();

    const payload = {
      nombre: raw.nombre,
      descripcion: raw.descripcion,
      geocerca: featureCollection,
      estatus: raw.estatus,
      idCliente: raw.idCliente,
    };

    this.regiService.agregarRegion(payload).subscribe({
      next: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó una nueva región de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      error: (error) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: String(error),
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  private buildFeatureCollectionFromForm() {
    let path: Array<{ lat: number; lng: number }> = [];
    if (this.polygon) {
      path = this.polygon
        .getPath()
        .getArray()
        .map((ll: any) => ({
          lat: Number(ll.lat()),
          lng: Number(ll.lng()),
        }));
    } else {
      path = Array.isArray(this.regionesForm.get('geocerca')?.value)
        ? this.regionesForm.get('geocerca')!.value
        : [];
    }

    const cleaned = path
      .map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    const ring: number[][] = cleaned.map((p) => [p.lng, p.lat]);
    if (ring.length >= 3) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }
    }

    return {
      type: 'FeatureCollection',
      features:
        cleaned.length >= 3
          ? [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [ring],
                },
              },
            ]
          : [],
    };
  }

  actualizar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.regionesForm.invalid) {
      this.submitButton = 'Actualizar';
      this.loading = false;
      return;
    }

    const raw = this.regionesForm.getRawValue();
    const featureCollection = this.buildFeatureCollectionFromForm();

    const payload = {
      nombre: raw.nombre,
      descripcion: raw.descripcion,
      geocerca: featureCollection,
      estatus: raw.estatus,
      idCliente: raw.idCliente,
    };

    this.regiService.actualizarRegion(this.idRegion, payload).subscribe({
      next: () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos de la región se actualizaron correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      error: () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: `Ocurrió un error al actualizar la región.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  regresar() {
    this.route.navigateByUrl('/regiones');
  }

  private loadGoogleMaps(): Promise<void> {
    if (
      (window as any).google?.maps?.Map &&
      (window as any).google?.maps?.drawing
    ) {
      return Promise.resolve();
    }

    const existing =
      document.querySelector<HTMLScriptElement>('script[data-gmaps="js"]') ||
      (Array.from(document.getElementsByTagName('script')).find((s) =>
        s.src.includes('maps.googleapis.com/maps/api/js')
      ) as HTMLScriptElement | undefined);

    if (existing) {
      if ((window as any).google?.maps) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () =>
          reject(new Error('No se pudo cargar Google Maps'))
        );
      });
    }

    if (!AltaRegionComponent.mapsLoading) {
      AltaRegionComponent.mapsLoading = new Promise<void>((resolve, reject) => {
        if (!this.googleMapsApiKey) {
          reject(
            new Error(
              'Falta API key de Google Maps o el script no está en index.html'
            )
          );
          return;
        }
        const script = document.createElement('script');
        script.setAttribute('data-gmaps', 'js');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=drawing&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error('No se pudo cargar Google Maps'));
        document.head.appendChild(script);
      });
    }
    return AltaRegionComponent.mapsLoading;
  }

  private getMapElement(): HTMLElement | null {
    const el = document.getElementById('map');
    return el instanceof HTMLElement ? el : null;
  }

  private async initMap(): Promise<void> {
    await new Promise(requestAnimationFrame);
    const el = this.getMapElement();
    if (!el) return;

    if (!(window as any).google?.maps?.Map) {
      this.showMapsErrorOverlay(
        'Google Maps no ha cargado',
        'Revisa la API key o las restricciones del referer.'
      );
      return;
    }

    this.map = new google.maps.Map(el, {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });

    setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
        this.map.setCenter(this.defaultCenter);
      }
    }, 0);
  }

  private observeResize(): void {
    const el = this.getMapElement();
    if (!el || !('ResizeObserver' in window)) return;

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      if (this.map && this.getMapElement()) {
        google.maps.event.trigger(this.map, 'resize');
      }
    });
    this.resizeObserver.observe(el);
  }

  private initDrawing(): void {
    if (!this.map) return;
    if (!(window as any).google?.maps?.drawing) return;

    const polygonOptions: any = {
      fillColor: '#1E88E5',
      fillOpacity: 0.15,
      strokeColor: '#1E88E5',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      clickable: true,
      editable: true,
      draggable: false,
      zIndex: 10,
    };

    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions,
    });

    this.drawingManager.setMap(this.map);

    google.maps.event.addListener(
      this.drawingManager,
      'drawingmode_changed',
      () => {
        const mode = this.drawingManager.getDrawingMode();
        console.log('[Drawing] modo:', mode);
      }
    );

    google.maps.event.addListener(
      this.drawingManager,
      'polygoncomplete',
      (poly: any) => {
        if (this.polygon) this.polygon.setMap(null);
        this.polygon = poly;
        this.polygon.setEditable(true);

        const path = this.polygon.getPath();
        path.addListener('insert_at', () => {
          this.syncPolygonToForm();
          this.logPolygonPath('insert_at');
        });
        path.addListener('set_at', () => {
          this.syncPolygonToForm();
          this.logPolygonPath('set_at');
        });
        path.addListener('remove_at', () => {
          this.syncPolygonToForm();
          this.logPolygonPath('remove_at');
        });

        this.syncPolygonToForm();
        this.logPolygonPath('polygoncomplete');
        this.drawingManager.setDrawingMode(null);
      }
    );
  }

  private syncPolygonToForm(): void {
    if (!this.polygon) {
      this.regionesForm.get('geocerca')?.setValue([]);
      return;
    }
    const path: any[] = this.polygon
      .getPath()
      .getArray()
      .map((ll: any) => ({
        lat: ll.lat(),
        lng: ll.lng(),
      }));
    this.regionesForm.get('geocerca')?.setValue(path, { emitEvent: false });
    this.regionesForm.get('geocerca')?.markAsDirty();

    this.logPolygonPath('sync');
  }

  private drawPolygonFromPath(path: Array<{ lat: number; lng: number }>): void {
    if (!this.map || !Array.isArray(path) || path.length < 3) return;

    if (this.polygon) {
      this.polygon.setMap(null);
      this.polygon = undefined;
    }

    this.polygon = new google.maps.Polygon({
      paths: path,
      fillColor: '#1E88E5',
      fillOpacity: 0.15,
      strokeColor: '#1E88E5',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      editable: true,
      draggable: false,
      map: this.map,
      zIndex: 10,
    });

    const p = this.polygon.getPath();
    p.addListener('insert_at', () => this.syncPolygonToForm());
    p.addListener('set_at', () => this.syncPolygonToForm());
    p.addListener('remove_at', () => this.syncPolygonToForm());

    this.syncPolygonToForm();
  }

  private fitToPolygon(): void {
    if (!this.map || !this.polygon) return;
    const bounds = new google.maps.LatLngBounds();
    this.polygon.getPath().forEach((ll: any) => bounds.extend(ll));
    this.map.fitBounds(bounds);
  }

  private addDrawControl(): void {
    if (!this.map) return;

    const controlDiv = document.createElement('div');
    controlDiv.style.margin = '10px';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Dibujar geocerca';
    btn.style.padding = '8px 12px';
    btn.style.border = 'none';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 1px 4px rgba(0,0,0,.3)';
    btn.style.background = '#0d6efd';
    btn.style.color = '#fff';
    btn.style.fontSize = '13px';

    btn.onclick = () => {
      if (this.polygon) {
        this.polygon.setMap(null);
        this.polygon = undefined;
      }
      this.regionesForm.get('geocerca')?.setValue([], { emitEvent: false });
      this.regionesForm.get('geocerca')?.markAsDirty();

      if (this.drawingManager && (window as any).google?.maps?.drawing) {
        this.drawingManager.setDrawingMode(
          google.maps.drawing.OverlayType.POLYGON
        );
      }

      this.logPolygonPath('cleared');
    };

    controlDiv.appendChild(btn);
    this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
  }

  private addClearControl(): void {
    if (!this.map) return;

    const controlDiv = document.createElement('div');
    controlDiv.style.margin = '10px';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Borrar geocerca';
    btn.style.padding = '8px 12px';
    btn.style.border = 'none';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 1px 4px rgba(0,0,0,.3)';
    btn.style.background = '#b02a37';
    btn.style.color = '#fff';
    btn.style.fontSize = '13px';

    btn.onclick = () => {
      if (this.polygon) {
        this.polygon.setMap(null);
        this.polygon = undefined;
      }
      this.regionesForm.get('geocerca')?.setValue([], { emitEvent: false });
      this.regionesForm.get('geocerca')?.markAsDirty();

      if (this.drawingManager && (window as any).google?.maps?.drawing) {
        this.drawingManager.setDrawingMode(
          google.maps.drawing.OverlayType.POLYGON
        );
      }
      console.log('[UI] Geocerca borrada.');
    };

    controlDiv.appendChild(btn);
    this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
    this.logPolygonPath('cleared');
  }

  private showMapsErrorOverlay(title: string, detail: string) {
    const el = this.getMapElement();
    if (!el) return;

    el.innerHTML = `
      <div style="
          width:100%;height:100%;
          display:flex;align-items:center;justify-content:center;
          background:#e9ecef;border-radius:8px;">
        <div style="text-align:center; max-width: 520px; padding: 16px;">
          <div style="font-size:42px; line-height:1;">⚠️</div>
          <div style="font-weight:600; margin-top:8px; color:#333;">${title}</div>
          <div style="font-size:13px; margin-top:6px; color:#555;">
            ${detail}
          </div>
        </div>
      </div>
    `;
  }

  private toast(
    text: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'info'
  ) {
    Swal.fire({
      title:
        type === 'error' ? '¡Ops!' : type === 'warning' ? 'Atención' : 'Aviso',
      background: '#002136',
      text,
      icon: type,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'OK',
    });
  }
}
