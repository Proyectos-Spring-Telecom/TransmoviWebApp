import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { RegionesService } from 'src/app/shared/services/regiones.service';

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

  // ====== UI / Template bindings ======
  title = 'Agregar Ruta';
  rutaForm!: FormGroup;
  listaRegiones: any;

  // ====== Google Maps ======
  private map!: google.maps.Map;
  private clickListener?: google.maps.MapsEventListener;
  private geocoder!: google.maps.Geocoder;

  // Marcadores / InfoWindows
  private markerInicio?: google.maps.Marker;
  private markerFin?: google.maps.Marker;
  private infoInicio?: google.maps.InfoWindow;
  private infoFin?: google.maps.InfoWindow;

  // Coordenadas seleccionadas
  private coordInicio?: google.maps.LatLngLiteral;
  private coordFin?: google.maps.LatLngLiteral;

  // Direcciones legibles (texto “gris” de Google Maps)
  private direccionInicio?: string;
  private direccionFin?: string;

  // Centro: Toluca
  private readonly centroToluca: google.maps.LatLngLiteral = { lat: 19.2879, lng: -99.6468 };

  constructor(private fb: FormBuilder, private modalService: NgbModal, private regiService: RegionesService) { }

  /**
   * Open extra large modal
   * @param exlargeModal extra large modal data
   */
  extraLarge(exlargeModal: any) {
    this.modalService.open(exlargeModal, { size: 'xl',windowClass:'modal-holder', centered: true });
  }

  // ================== Ciclo de vida ==================
  ngOnInit(): void {
    this.rutaForm = this.fb.group({
      nombreFinal: ['', [Validators.required, Validators.maxLength(200)]],
      idRegion: [null, Validators.required],
      estatus: [1, Validators.required],
    });

    this.obtenerRegiones()
  }

  obtenerRegiones(){
    this.regiService.obtenerRegiones().subscribe((response) => {
      this.listaRegiones = response.data
    })
  }


  async ngAfterViewInit(): Promise<void> {
    const API_KEY = 'TU_API_KEY_AQUI'; // o de environment
    await this.loadGoogleMaps(API_KEY);
    this.initMap();
    this.initGeocoder();
    this.attachClickHandler();
  }

  ngOnDestroy(): void {
    this.clickListener?.remove();
  }

  // ================== Carga e init ==================
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
    // Click #1: INICIO, Click #2: DESTINO (y LOG del body), Click #3: reinicia
    this.clickListener = this.map.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const coord: google.maps.LatLngLiteral = { lat: e.latLng.lat(), lng: e.latLng.lng() };

      try {
        if (!this.coordInicio) {
          await this.setInicio(coord); // <-- esperamos geocoding
          return;
        }

        if (!this.coordFin) {
          await this.setFin(coord);    // <-- esperamos geocoding
          this.previsualizarBody();    // ya tenemos dirección FIN garantizada
          this.fitToBoth();
          return;
        }

        // Si ya había 2 puntos, reiniciamos y comenzamos de nuevo con INICIO
        this.resetSelecciones();
        await this.setInicio(coord);
      } catch (err) {
        console.warn('Error al procesar click en el mapa:', err);
      }
    });
  }

  // ================== Marcadores / Tooltips ==================
  private async setInicio(coord: google.maps.LatLngLiteral): Promise<void> {
    this.coordInicio = coord;

    this.markerInicio?.setMap(null);
    this.infoInicio?.close();

    this.markerInicio = new google.maps.Marker({
      position: coord,
      map: this.map,
      title: 'Inicio',
      icon: {
        url: 'assets/images/markerGreen.png', // <-- tu imagen
        scaledSize: new google.maps.Size(40, 40), // tamaño ajustable
        anchor: new google.maps.Point(20, 40)    // centro en la punta
      }
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
        url: 'assets/images/markerRed.png', // <-- tu imagen
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40)
      }
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
  }

  private fitToBoth(): void {
    if (!this.coordInicio || !this.coordFin) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(this.coordInicio);
    bounds.extend(this.coordFin);
    this.map.fitBounds(bounds, 30);
  }

  // ================== Geocoder & Tooltip ==================
  private reverseGeocode(coord: google.maps.LatLngLiteral): Promise<string> {
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ location: coord }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address); // texto “gris”
        } else {
          reject(status);
        }
      });
    });
  }

  private buildTooltipHTML(titulo: string, direccion: string, color: string): string {
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
          <strong style="color: ${color};">${titulo}</strong><br>
          <b>${this.escapeHTML(direccion)}</b>
        </div>
      </div>
    `;
  }

  // Evitar inyección en la dirección
  private escapeHTML(text: any): any {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  // ================== Body (console preview) ==================
  private buildFeatureCollectionPoint(coord: google.maps.LatLngLiteral) {
    // GeoJSON requiere [lng, lat]
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {}, // si quieres, luego agregamos { nombre: ... }
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

    const idRegion = this.rutaForm?.get('idPadre')?.value ?? null;
    const nombreRuta = this.rutaForm?.get('nombreFinal')?.value ?? 'Ruta sin nombre';

    const body = {
      nombre: nombreRuta,                                 // nombre de la RUTA (form)
      puntoInicio: this.buildFeatureCollectionPoint(this.coordInicio),
      nombreInicio: this.direccionInicio ?? 'Punto Inicio', // dirección legible de INICIO
      puntoFin: this.buildFeatureCollectionPoint(this.coordFin),
      nombreFinal: this.direccionFin ?? 'Punto Fin',        // dirección legible de FIN (¡ya espera geocoder!)
      estatus: 1,
      idRegion: idRegion
    };

    console.group('%cBody listo para enviar', 'color:#0a7; font-weight:bold;');
    console.log('Objeto:', body);
    console.log('JSON:', JSON.stringify(body, null, 2));
    console.groupEnd();
  }

   /**
   * Open Large modal
   * @param largeDataModal large modal data
   */
  largeModal(largeDataModal: any) {
    this.modalService.open(largeDataModal, { size: 'lg',windowClass:'modal-holder', centered: true, backdrop: 'static',
      keyboard: false, });
  }
}
