import { Component, OnInit, AfterViewInit, OnDestroy, TemplateRef, ViewChild, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { RegionesService } from 'src/app/shared/services/regiones.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import Swal from 'sweetalert2';

declare global {
  interface Window { google: any; }
}
declare const google: any;

@Component({
  selector: 'app-agregar-ruta',
  templateUrl: './agregar-ruta.component.html',
  styleUrls: ['./agregar-ruta.component.scss'],
  animations: [fadeInUpAnimation],
})
export class AgregarRutaComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('exlargeModal', { static: false }) exlargeModal!: TemplateRef<any>;
  @ViewChild('datosRutaModal', { static: false }) datosRutaModal!: TemplateRef<any>;

  title = 'Agregar Ruta';
  rutaForm!: FormGroup;
  listaRegiones: any;
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  puntosCompletos = false;
  private map!: google.maps.Map;
  private clickListener?: google.maps.MapsEventListener;
  private geocoder!: google.maps.Geocoder;
  private markerInicio?: google.maps.Marker;
  private markerFin?: google.maps.Marker;
  private infoInicio?: google.maps.InfoWindow;
  private infoFin?: google.maps.InfoWindow;
  private coordInicio?: google.maps.LatLngLiteral;
  private coordFin?: google.maps.LatLngLiteral;
  private direccionInicio?: string;
  private direccionFin?: string;
  private polygons: google.maps.Polygon[] = [];
  private regionesArea: { id: number; nombre: string; coords: google.maps.LatLngLiteral[] }[] = [];
  private regionModalMostrado = false;
  displayRegion = (item: any) => {
    if (!item) return "";
    return `${item.nombre} - Cliente: ${item.nombreCliente} ${item.apellidoPaternoCliente} ${item.apellidoMaternoCliente}`;
  };

  private readonly centroToluca: google.maps.LatLngLiteral = { lat: 19.2879, lng: -99.6468 };

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private regiService: RegionesService,
    private rutService: RutasService,
    private ngZone: NgZone,
    private route: Router,
  ) { }

  extraLarge(exlargeModal: any) {
    this.modalService.open(exlargeModal, { size: 'xl', windowClass: 'modal-holder', centered: true });
  }

  ngOnInit(): void {
    this.rutaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      idRegion: [null, Validators.required],
      idRegionFin: [null],
      estatus: [1, Validators.required],
    });

    this.obtenerRegiones();
  }

  obtenerRegiones(): void {
    this.regiService.obtenerRegiones().subscribe((response) => {
      this.listaRegiones = response?.data ?? [];
      this.construirRegionesArea();
      if (this.listaRegiones?.length) {
        this.abrirModalSeleccionRegion();
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    const API_KEY = 'TU_API_KEY_AQUI';
    try {
      await this.loadGoogleMaps(API_KEY);
      this.initMap();
      this.initGeocoder();
      this.attachClickHandler();
      if (this.listaRegiones?.length) {
        this.abrirModalSeleccionRegion();
      }
    } catch (err) {
      console.error('No se pudo inicializar Google Maps:', err);
    }
  }

  ngOnDestroy(): void {
    this.clickListener?.remove();
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

  private initMap(): void {
    const el = document.getElementById('map');
    if (!el) {
      console.error('No se encontró el elemento #map');
      return;
    }

    this.map = new google.maps.Map(el, {
      center: this.centroToluca,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
  }

  private initGeocoder(): void {
    this.geocoder = new google.maps.Geocoder();
  }

  private abrirModalSeleccionRegion(): void {
    if (this.regionModalMostrado) return;
    this.regionModalMostrado = true;
    this.modalService.open(this.exlargeModal, {
      size: 'xl',
      windowClass: 'modal-holder',
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
  }

  private attachClickHandler(): void {
    this.clickListener = this.map.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const coord: google.maps.LatLngLiteral = { lat: e.latLng.lat(), lng: e.latLng.lng() };

      try {
        const idRegionSeleccionada = this.rutaForm.get('idRegion')?.value;

        if (!this.coordInicio) {
          if (!idRegionSeleccionada) {
            Swal.fire({
              title: 'Selecciona una región primero',
              background: '#002136',
              text: 'Debes elegir la región de inicio antes de marcar el punto.',
              icon: 'warning',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Entendido',
            });
            return;
          }

          const regionInicio = this.regionesArea.find(r => r.id === Number(idRegionSeleccionada));
          if (!regionInicio) return;

          const dentro = this.isPointInPolygon(coord, regionInicio.coords);
          if (!dentro) {
            Swal.fire({
              title: 'Punto fuera de la región',
              background: '#002136',
              text: 'El punto de Inicio debe estar dentro de la región seleccionada.',
              icon: 'warning',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Entendido',
            });
            return;
          }

          await this.setInicio(coord);
          this.dibujarRegionesRestantes(Number(idRegionSeleccionada));

          this.ngZone.run(() => {
            this.puntosCompletos = !!(this.coordInicio && this.coordFin);
          });
          return;
        }

        if (!this.coordFin) {
          await this.setFin(coord);
          this.ngZone.run(() => { this.puntosCompletos = !!(this.coordInicio && this.coordFin); });
          this.fitToBoth();
          this.previsualizarBody();
          return;
        }

        this.resetSelecciones();
        await this.setInicio(coord);
        this.ngZone.run(() => { this.puntosCompletos = !!(this.coordInicio && this.coordFin); });

      } catch (err) {
        console.warn('Error al procesar click en el mapa:', err);
      }
    });
  }

  private async setInicio(coord: google.maps.LatLngLiteral): Promise<void> {
    this.coordInicio = coord;

    this.markerInicio?.setMap(null);
    this.infoInicio?.close();

    this.markerInicio = new google.maps.Marker({
      position: coord,
      map: this.map,
      title: 'Inicio',
      icon: {
        url: 'assets/images/markerGreen.png',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40),
      },
    });

    try {
      const direccion = await this.reverseGeocode(coord);
      this.direccionInicio = direccion;
      const content = this.buildTooltipHTML('Punto de Inicio', direccion, '#1db110ff');
      this.infoInicio = new google.maps.InfoWindow({ content });
      this.openInfoWindowWithoutClose(this.infoInicio, this.markerInicio);
    } catch (err) {
      console.warn('[INICIO] Geocoder falló:', err);
    }
  }

  private async setFin(coord: google.maps.LatLngLiteral): Promise<void> {
    this.coordFin = coord;

    this.markerFin?.setMap(null);
    this.infoFin?.close();

    this.markerFin = new google.maps.Marker({
      position: coord,
      map: this.map,
      title: 'Destino',
      icon: {
        url: 'assets/images/markerRed.png',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40),
      },
    });

    try {
      const direccion = await this.reverseGeocode(coord);
      this.direccionFin = direccion;
      const content = this.buildTooltipHTML('Punto de Destino', direccion, '#d32f2f');
      this.infoFin = new google.maps.InfoWindow({ content });
      this.openInfoWindowWithoutClose(this.infoFin, this.markerFin);
    } catch (err) {
      console.warn('[DESTINO] Geocoder falló:', err);
    }

    this.setRegionFinFromCoord(coord);
  }

  private openInfoWindowWithoutClose(info: google.maps.InfoWindow, marker: google.maps.Marker): void {
    info.open(this.map, marker);
    google.maps.event.addListenerOnce(info, 'domready', () => {
      const btns = document.querySelectorAll('.gm-ui-hover-effect');
      btns.forEach((b) => {
        (b as HTMLElement).style.display = 'none';
      });
    });
  }

  private resetSelecciones(): void {
    this.coordInicio = undefined;
    this.coordFin = undefined;
    this.markerInicio?.setMap(null);
    this.markerFin?.setMap(null);
    this.markerInicio = undefined;
    this.markerFin = undefined;
    this.infoInicio?.close();
    this.infoFin?.close();
    this.infoInicio = undefined;
    this.infoFin = undefined;
    this.direccionInicio = undefined;
    this.direccionFin = undefined;

    this.ngZone.run(() => { this.puntosCompletos = false; });
  }

  private fitToBoth(): void {
    if (!this.coordInicio || !this.coordFin) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(this.coordInicio);
    bounds.extend(this.coordFin);

    const PADDING = 160;
    this.map.fitBounds(bounds, PADDING);
    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      const z = this.map.getZoom();
      if (typeof z === 'number') {
        this.map.setZoom(Math.max(z - 1, 3));
      }
    });
  }

  private reverseGeocode(coord: google.maps.LatLngLiteral): Promise<string> {
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ location: coord }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results.length) {
          try {
            resolve(this.pickBestFormattedAddress(results));
          } catch {
            resolve(results[0].formatted_address);
          }
        } else {
          reject(status);
        }
      });
    });
  }

  private pickBestFormattedAddress(results: google.maps.GeocoderResult[]): string {
    if (!results?.length) return 'Dirección no disponible';
    const prefer = ['street_address', 'route', 'premise', 'subpremise', 'neighborhood'];
    for (const t of prefer) {
      const hit = results.find(r => r.types?.includes(t) && r.formatted_address);
      if (hit?.formatted_address) return hit.formatted_address;
    }
    return results[0].formatted_address ?? 'Dirección no disponible';
  }

  private buildTooltipHTML(titulo: string, direccion: string, color: string): string {
    const safeDir = this.escapeHTML(direccion);
    return `
      <div style="
        font-family: 'Segoe UI', sans-serif;
        border-radius: 12px;
        max-width: 260px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        background: white;
        line-height: 1.2;
      ">
        <div style="font-size: 14px; color: #4a4a4a; padding: 6px 10px; margin-top: -12px">
          <strong style="color: ${color};">${this.escapeHTML(titulo)}</strong><br>
          <b>${safeDir}</b>
        </div>
      </div>
    `;
  }

  private escapeHTML(text: any): any {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private buildFeatureCollectionPoint(coord: google.maps.LatLngLiteral) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [coord.lng, coord.lat]
          }
        }
      ]
    };
  }

  private extraerCoordenadasPoligono(geocerca: any): google.maps.LatLngLiteral[] {
    if (!geocerca || geocerca.type !== 'FeatureCollection' || !Array.isArray(geocerca.features)) return [];
    const feature = geocerca.features.find((f: any) => f?.geometry?.type === 'Polygon');
    const rings = feature?.geometry?.coordinates;
    if (!Array.isArray(rings) || !rings.length || !Array.isArray(rings[0])) return [];
    const firstRing = rings[0] as number[][];
    return firstRing.map((pair: any) => ({
      lng: Number(pair[0]),
      lat: Number(pair[1]),
    }));
  }

  private construirRegionesArea(): void {
    this.regionesArea = [];
    if (!Array.isArray(this.listaRegiones)) return;
    this.listaRegiones.forEach((region: any) => {
      const geocerca = region?.geocerca;
      const coords = this.extraerCoordenadasPoligono(geocerca);
      if (!coords.length) return;
      this.regionesArea.push({
        id: Number(region.id),
        nombre: region.nombre,
        coords,
      });
    });
  }

  private dibujarSoloRegionInicio(idRegion: number): void {
    if (!this.map || !this.regionesArea.length) return;
    const region = this.regionesArea.find(r => r.id === Number(idRegion));
    if (!region) return;

    this.polygons.forEach(p => p.setMap(null));
    this.polygons = [];

    const polygon = new google.maps.Polygon({
      paths: region.coords,
      fillColor: '#1E88E5',
      fillOpacity: 0.15,
      strokeColor: '#1E88E5',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      clickable: false
    });

    polygon.setMap(this.map);
    this.polygons.push(polygon);
  }

  private dibujarRegionesRestantes(idRegionSeleccionada: number): void {
    if (!this.map || !this.regionesArea.length) return;

    this.regionesArea.forEach(r => {
      if (r.id === Number(idRegionSeleccionada)) return;

      const polygon = new google.maps.Polygon({
        paths: r.coords,
        fillColor: '#1E88E5',
        fillOpacity: 0.15,
        strokeColor: '#1E88E5',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        clickable: false
      });

      polygon.setMap(this.map);
      this.polygons.push(polygon);
    });
  }

  private isPointInPolygon(point: google.maps.LatLngLiteral, polygonCoords: google.maps.LatLngLiteral[]): boolean {
    let inside = false;
    for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
      const xi = polygonCoords[i].lng, yi = polygonCoords[i].lat;
      const xj = polygonCoords[j].lng, yj = polygonCoords[j].lat;

      const intersect =
        ((yi > point.lat) !== (yj > point.lat)) &&
        (point.lng < (xj - xi) * (point.lat - yi) / ((yj - yi) || 1e-12) + xi);

      if (intersect) inside = !inside;
    }
    return inside;
  }

  private detectarRegionParaPunto(coord: google.maps.LatLngLiteral): { id: number; nombre: string } | null {
    for (const r of this.regionesArea) {
      if (this.isPointInPolygon(coord, r.coords)) {
        return { id: r.id, nombre: r.nombre };
      }
    }
    return null;
  }

  private setRegionFinFromCoord(coord: google.maps.LatLngLiteral): void {
    const region = this.detectarRegionParaPunto(coord);
    const valor = region ? region.id : null;
    this.rutaForm.patchValue({ idRegionFin: valor });
  }

  private calcularCentroDePoligono(coords: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral | null {
    if (!coords.length) return null;
    let latSum = 0;
    let lngSum = 0;
    coords.forEach(c => {
      latSum += c.lat;
      lngSum += c.lng;
    });
    return {
      lat: latSum / coords.length,
      lng: lngSum / coords.length,
    };
  }

  confirmarRegionInicio(): void {
    const idRegionVal = this.rutaForm.get('idRegion')?.value;
    if (idRegionVal === null || idRegionVal === undefined || idRegionVal === '') {
      Swal.fire({
        title: 'Selecciona una región',
        background: '#002136',
        text: 'Debes seleccionar la región de inicio antes de continuar.',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const region = this.regionesArea.find(r => r.id === Number(idRegionVal));
    if (!region) {
      Swal.fire({
        title: 'Región no encontrada',
        background: '#002136',
        text: 'No se pudo obtener la geocerca de la región seleccionada.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const centro = this.calcularCentroDePoligono(region.coords);
    if (!centro) {
      Swal.fire({
        title: 'Geocerca inválida',
        background: '#002136',
        text: 'La región seleccionada no tiene una geocerca válida.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    if (!this.map || !this.geocoder) {
      Swal.fire({
        title: 'Mapa en carga',
        background: '#002136',
        text: 'Espera un momento mientras se inicializa el mapa.',
        icon: 'info',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    this.dibujarSoloRegionInicio(Number(idRegionVal));

    this.map.setCenter(centro);
    this.map.setZoom(15);

    this.modalService.dismissAll();
  }

  private previsualizarBody(): void {
    if (!this.coordInicio || !this.coordFin) return;

    const body = {
      nombre: (this.rutaForm?.get('nombre')?.value || 'Ruta sin nombre').toString().trim(),
      puntoInicio: this.buildFeatureCollectionPoint(this.coordInicio),
      nombreInicio: this.direccionInicio ?? 'Punto Inicio',
      puntoFin: this.buildFeatureCollectionPoint(this.coordFin),
      nombreFin: this.direccionFin ?? 'Punto Fin',
      estatus: this.rutaForm?.get('estatus')?.value ?? 1,
      idRegion: this.rutaForm?.get('idRegion')?.value ?? null,
      idRegionFin: this.rutaForm?.get('idRegionFin')?.value ?? null
    };

    console.group('%cBody listo para enviar (preview)', 'color:#0a7; font-weight:bold;');
    console.log('Objeto:', body);
    console.log('JSON:', JSON.stringify(body, null, 2));
    console.groupEnd();
  }

  abrirModal(): void {
    if (!this.coordInicio || !this.coordFin) {
      console.warn('Selecciona los dos puntos antes de continuar');
      return;
    }
    this.modalService.open(this.datosRutaModal, { size: 'xl', windowClass: 'modal-holder', centered: true });
  }

  cerrarModal(): void {
    this.modalService.dismissAll();
  }

  submit(): void {
    this.rutaForm.markAllAsTouched();
    this.rutaForm.updateValueAndValidity();

    const ctrlNombre = this.rutaForm.get('nombre');
    const ctrlRegion = this.rutaForm.get('idRegion');

    const nombre = String(ctrlNombre?.value ?? '').trim();
    const idRegionVal = ctrlRegion?.value;
    const idRegionFinVal = this.rutaForm.get('idRegionFin')?.value;

    const faltaNombre = !nombre || ctrlNombre?.errors?.['required'];
    const faltaRegion = idRegionVal === null || idRegionVal === undefined || idRegionVal === '' || ctrlRegion?.errors?.['required'];

    if (faltaNombre || faltaRegion) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const faltantes: string[] = [];
      if (faltaNombre) faltantes.push('Nombre');
      if (faltaRegion) faltantes.push('Región');

      const htmlLista = faltantes.map((campo, i) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;
                  background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${i + 1}. ${campo}</strong>
      </div>
    `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Por favor completa los siguientes campos antes de continuar:
        </p>
        <div style="max-height:350px;overflow-y:auto">${htmlLista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' }
      });
      return;
    }

    if (!this.coordInicio || !this.coordFin) {
      this.submitButton = 'Guardar';
      this.loading = false;

      Swal.fire({
        title: 'Selecciona Inicio y Destino',
        background: '#002136',
        html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Debes marcar <strong>dos puntos</strong> en el mapa: primero el <strong>Inicio</strong> y luego el <strong>Destino</strong>.
        </p>
      `,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' }
      });
      return;
    }

    this.submitButton = 'Guardando...';
    this.loading = true;

    const body = {
      nombre: nombre,
      puntoInicio: this.buildFeatureCollectionPoint(this.coordInicio),
      nombreInicio: this.direccionInicio ?? 'Punto Inicio',
      puntoFin: this.buildFeatureCollectionPoint(this.coordFin),
      nombreFin: this.direccionFin ?? 'Punto Fin',
      estatus: Number(this.rutaForm.get('estatus')?.value ?? 1),
      idRegion: Number(idRegionVal),
      idRegionFin: idRegionFinVal != null ? Number(idRegionFinVal) : null,
    };

    console.group('%cJSON FINAL PARA ENVIAR', 'color:#0a7; font-weight:bold;');
    console.log('Objeto:', body);
    console.log('JSON:', JSON.stringify(body, null, 2));
    console.groupEnd();

    this.rutService.agregarRuta(body)
      .pipe(finalize(() => {
        this.submitButton = 'Guardar';
        this.loading = false;
      }))
      .subscribe({
        next: () => {
          Swal.fire({
            title: '¡Ruta registrada!',
            background: '#002136',
            text: 'Se agregó una nueva ruta de manera exitosa.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          }).then(() => {
            this.modalService.dismissAll();
            this.regresar();
          });
        },
        error: (error) => {
          console.error('Error al agregar ruta:', error);
          Swal.fire({
            title: '¡Ops!',
            background: '#002136',
            text: 'Ocurrió un error al agregar la ruta.',
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      });
  }

  regresar() {
    this.modalService.dismissAll();
    this.route.navigateByUrl('/rutas');
  }

  get hayAlgoSeleccionado(): boolean {
    return !!(this.coordInicio || this.coordFin);
  }

  limpiarMapa(): void {
    this.resetSelecciones();
  }

  public cancelarYReiniciar(): void {
    this.limpiarMapa();
    this.rutaForm.reset({
      nombre: '',
      idRegion: null,
      idRegionFin: null,
      estatus: 1,
    });
    if (this.map) {
      this.map.setCenter(this.centroToluca);
      this.map.setZoom(13);
    }
    this.submitButton = 'Guardar';
    this.loading = false;
    this.modalService.dismissAll();
  }
}
