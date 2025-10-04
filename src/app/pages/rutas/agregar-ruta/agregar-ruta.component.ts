import { Component, OnInit, AfterViewInit, OnDestroy, TemplateRef, ViewChild, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
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

  title = 'Agregar Ruta';
  rutaForm!: FormGroup;
  listaRegiones: any;
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  // Estado UI
  puntosCompletos = false;

  // Google Maps
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

  private readonly centroToluca: google.maps.LatLngLiteral = { lat: 19.2879, lng: -99.6468 };

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private regiService: RegionesService,
    private rutService: RutasService,
    private ngZone: NgZone,
    private route: Router,
  ) { }

  /**
   * Open extra large modal (si lo quieres usar directo)
   */
  extraLarge(exlargeModal: any) {
    this.modalService.open(exlargeModal, { size: 'xl', windowClass: 'modal-holder', centered: true });
  }

  ngOnInit(): void {
    this.rutaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      idRegion: [null, Validators.required],
      estatus: [1, Validators.required],
    });

    this.obtenerRegiones();
  }

  obtenerRegiones(): void {
    this.regiService.obtenerRegiones().subscribe((response) => {
      this.listaRegiones = response?.data ?? [];
    });
  }

  async ngAfterViewInit(): Promise<void> {
    const API_KEY = 'TU_API_KEY_AQUI';
    try {
      await this.loadGoogleMaps(API_KEY);
      this.initMap();
      this.initGeocoder();
      this.attachClickHandler();
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

  private attachClickHandler(): void {
    this.clickListener = this.map.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const coord: google.maps.LatLngLiteral = { lat: e.latLng.lat(), lng: e.latLng.lng() };

      try {
        if (!this.coordInicio) {
          await this.setInicio(coord);
          this.ngZone.run(() => { this.puntosCompletos = !!(this.coordInicio && this.coordFin); });
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
      this.infoInicio.open(this.map, this.markerInicio);
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
      this.infoFin.open(this.map, this.markerFin);
    } catch (err) {
      console.warn('[DESTINO] Geocoder falló:', err);
    }
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
        <div style="font-size: 14px; color: #4a4a4a; padding: 6px 10px;">
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

  private previsualizarBody(): void {
    if (!this.coordInicio || !this.coordFin) return;

    const body = {
      nombre: (this.rutaForm?.get('nombre')?.value || 'Ruta sin nombre').toString().trim(),
      puntoInicio: this.buildFeatureCollectionPoint(this.coordInicio),
      nombreInicio: this.direccionInicio ?? 'Punto Inicio',
      puntoFin: this.buildFeatureCollectionPoint(this.coordFin),
      nombreFin: this.direccionFin ?? 'Punto Fin',
      estatus: this.rutaForm?.get('estatus')?.value ?? 1,
      idRegion: this.rutaForm?.get('idRegion')?.value ?? null
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
    this.modalService.open(this.exlargeModal, { size: 'xl', windowClass: 'modal-holder', centered: true });
  }

  cerrarModal(): void {
    this.modalService.dismissAll();
  }

  submit(): void {
    if (this.rutaForm.invalid) {
      this.rutaForm.markAllAsTouched();
      return;
    }
    if (!this.coordInicio || !this.coordFin) {
      console.warn('Faltan puntos en el mapa');
      return;
    }

    this.submitButton = 'Guardando...';
    this.loading = true;

    const body = {
      nombre: (this.rutaForm.get('nombre')?.value || 'Ruta sin nombre').toString().trim(),
      puntoInicio: this.buildFeatureCollectionPoint(this.coordInicio),
      nombreInicio: this.direccionInicio ?? 'Punto Inicio',
      puntoFin: this.buildFeatureCollectionPoint(this.coordFin),
      nombreFin: this.direccionFin ?? 'Punto Fin',
      estatus: Number(this.rutaForm.get('estatus')?.value ?? 1),
      idRegion: Number(this.rutaForm.get('idRegion')?.value ?? 0),
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
        next: (response) => {
          this.regresar()
          Swal.fire({
            title: '¡Operación Exitosa!',
            background: '#002136',
            text: 'Se agregó una nueva ruta de manera exitosa.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
          this.modalService.dismissAll();
          // (opcional) limpia selección y form:
          // this.resetSelecciones();
          // this.rutaForm.reset({ nombre: '', idRegion: null, estatus: 1 });
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
    this.route.navigateByUrl('/rutas')
  }

  get hayAlgoSeleccionado(): boolean {
    return !!(this.coordInicio || this.coordFin);
  }

  limpiarMapa(): void {
    this.resetSelecciones();
  }
}
