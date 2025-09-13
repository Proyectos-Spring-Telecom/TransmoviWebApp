import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnInit,
  NgZone,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { RutasService } from 'src/app/shared/services/rutas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-ruta',
  templateUrl: './agregar-ruta.component.html',
  styleUrl: './agregar-ruta.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarRutaComponent implements OnInit {
  public guardarRutaNueva: FormGroup;
  public configRuta: FormGroup;
  public idRutaEspecifica: any;
  public title: string = 'Planeación de Rutas';
  public subtitle: string = 'Define y registra el recorrido que seguirán.';
  public informacion: any;
  center = { lat: 19.2866, lng: -99.6557 };
  zoom = 13;
  map!: google.maps.Map;
  polyline!: google.maps.Polyline;
  path: google.maps.LatLngLiteral[] = [];
  startMarker!: google.maps.Marker;
  endMarker!: google.maps.Marker;

  geocoder!: google.maps.Geocoder;
  customPolyline!: google.maps.Polyline;
  hasStart = false;
  mostrarBotonDeshacer = false;

  public recorridoDeta: any;
  public distanciak: any;
  @ViewChild('largeDataModals', { static: false })
  largeDataModals!: TemplateRef<any>;
  @ViewChild('largeDataModalsConfig', { static: false })
  largeDataModalsConfig!: TemplateRef<any>;

  public nombreRuta: any;
  public tarifa: any;
  public distancia: any;
  public incrementoMetros: any;
  public costoAdicional: any;
  public showId: boolean = false;
  private scrolled = false;

  rutaGuardada!: {
    puntoInicio: { coordenadas: google.maps.LatLngLiteral; direccion: string };
    puntoFin: { coordenadas: google.maps.LatLngLiteral; direccion: string };
    recorrido: google.maps.LatLngLiteral[];
  };

  constructor(
    private zone: NgZone,
    private route: Router,
    private http: HttpClient,
    private modalService: NgbModal,
    private rutaSe: RutasService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.activatedRoute.params.subscribe((params) => {
      this.idRutaEspecifica = params['idRutaEspecifica'];

      if (this.idRutaEspecifica) {
        this.title = 'Visualizar Ruta';
        this.subtitle = 'Revisa el camino por donde pasaran sus unidades.';
        this.obtenerRuta();
        this.showId = true;
      } else {
        this.showId = false;
      }

      this.loadGoogleMaps();
    });
  }

  ngAfterViewChecked(): void {
    if (this.showId && !this.scrolled) {
      this.scrolled = true;

      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 1000);
    }
  }


  initForm() {
    this.guardarRutaNueva = this.fb.group({
      nombreRuta: ['', Validators.required],
    });
    this.configRuta = this.fb.group({
      idRuta: [''],
      tarifaBase: ['', Validators.required],
      distanciaBaseKm: ['', Validators.required],
      incrementoCadaMetros: ['', Validators.required],
      costoAdicional: ['', Validators.required],
    });
  }

  obtenerRuta() {
    this.rutaSe
      .obtenerRuta(this.idRutaEspecifica)
      .subscribe((response: any) => {
        this.informacion = response;
        this.nombreRuta = response.nombre?.trim() ? response.nombre : 'Sin información';
        this.tarifa = this.toNumber(response.tarifa?.tarifaBase);
        this.distancia = response.distanciaKm ?? 'Sin información';
        this.incrementoMetros = (response.tarifa?.incrementoCadaMetros != null)
        ? response.tarifa.incrementoCadaMetros + 'km'
        : 'Sin información';
        this.costoAdicional = this.toNumber(response.tarifa?.costoAdicional);
        if (
          response.puntoInicio &&
          response.puntoFin &&
          response.recorridoDetallado
        ) {
          const ruta = {
            puntoInicio: response.puntoInicio,
            puntoFin: response.puntoFin,
            recorrido: response.recorridoDetallado,
          };
          this.mostrarRutaGuardada(ruta);
        }
      });
  }

  toNumber(value: any): number | null {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  
  isNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  public loading: boolean = false;
detalleRuta() {
  if (!this.lastDirectionsResult || this.path.length < 2) return;
  this.loading = true;

  const route = this.lastDirectionsResult.routes[0];
  const leg = route.legs[0];

  this.rutaGuardada = {
    puntoInicio: { coordenadas: leg.start_location.toJSON(), direccion: leg.start_address || 'Sin dirección' },
    puntoFin: { coordenadas: leg.end_location.toJSON(), direccion: leg.end_address || 'Sin dirección' },
    recorrido: [...this.path], // puntos del overview_path
  };

  let timeoutRef: any = null;
  timeoutRef = setTimeout(() => {
    Swal.fire({ title: 'Cargando...', text: 'Por favor espera un momento.', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
  }, 10000);

  this.rutaSe.detallarRuta(this.rutaGuardada).subscribe(
    (response) => {
      clearTimeout(timeoutRef);
      Swal.close();
      this.recorridoDeta = response.recorridoDetallado;
      this.distanciak = response.distanciaKm;
      setTimeout(() => {
        this.loading = false;
        this.largeModal(this.largeDataModals);
      }, 550);
    },
    (error) => {
      this.loading = false;
      clearTimeout(timeoutRef);
      Swal.close();
      Swal.fire({ title: 'Ops!', text: error, icon: 'error' });
    }
  );
}


  guardarRutaServi(modal: any) {
    if (this.guardarRutaNueva.invalid) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor llena todos los campos obligatorios antes de guardar.',
        icon: 'warning',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Entendido',
      });
      return;
    }
    modal.close();
    const datos = {
      nombreRuta: this.guardarRutaNueva.get('nombreRuta')?.value,
      puntoInicio: this.rutaGuardada.puntoInicio,
      puntoFin: this.rutaGuardada.puntoFin,
      recorridoDetallado: this.recorridoDeta,
      distanciaKm: this.distanciak,
    };
    console.log('📤 Datos a enviar a guardarRutas:', datos);
    this.loading = true;
    let timeoutRef: any = null;
    timeoutRef = setTimeout(() => {
      Swal.fire({
        title: 'Cargando...',
        text: 'Por favor espera un momento.',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }, 10000);

    this.rutaSe.guardarRutas(datos).subscribe(
      (response) => {
        clearTimeout(timeoutRef);
        setTimeout(() => {
          this.loading = false;
          setTimeout(() => {
            Swal.close();
            this.idRuta = response.idRuta;
            this.largeModal(this.largeDataModalsConfig);
          }, 500);
        }, 800);
      },
      (error) => {
        clearTimeout(timeoutRef);
        this.loading = false;
        Swal.close();
        Swal.fire({
          title: 'Ops!',
          text: error,
          icon: 'error',
        });
      }
    );
  }

  modalRef!: NgbModalRef;
  largeModals(largeDataModal: any) {
    this.modalRef = this.modalService.open(largeDataModal, {
      size: 'lg',
      windowClass: 'modal-holder',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
  }

  public idRuta: any;
  configurarRuta(modal: any) {
    if (this.configRuta.invalid) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor llena todos los campos obligatorios antes de guardar.',
        icon: 'warning',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Entendido',
      });
      return;
    }
    const confg = {
      ...this.configRuta.value,
      idRuta: this.idRuta,
    };
    modal.close();
    this.loading = true;
    let timeoutRef: any = null;
    timeoutRef = setTimeout(() => {
      Swal.fire({
        title: 'Cargando...',
        text: 'Por favor espera un momento.',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }, 10000);

    this.rutaSe.configurarTarifa(confg).subscribe(
      (response) => {
        clearTimeout(timeoutRef);
        setTimeout(() => {
          this.loading = false;
          setTimeout(() => {
            Swal.close();
            Swal.fire({
              title: '¡Ruta Guardada Con Éxito!',
              text: 'La configuración de la ruta se ha registrado correctamente.',
              icon: 'success',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Entendido',
              showCancelButton: false,
            }).then((result) => {
              if (result.isConfirmed) {
                this.irRuta();
              }
            });
          }, 500);
        }, 1500);
      },
      (error) => {
        clearTimeout(timeoutRef);
        this.loading = false;
        Swal.close();
        Swal.fire({
          title: 'Ops!',
          text: error,
          icon: 'error',
        });
      }
    );
  }

  cerrarModal(modal: any) {
    modal.close();
  }

  descargarJSON(nombreArchivo: string, data: any) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  cargarRutaDesdeArchivo() {
    this.http.get<any>('assets/ruta.json').subscribe(
      (data) => {
        this.mostrarRutaGuardada(data);
      },
      (err) => {
        console.error('Error al cargar ruta:', err);
      }
    );
  }

  irRuta() {
    this.route.navigateByUrl('/rutas/lista-rutas');
  }

  mostrarRutaGuardada(ruta: {
    puntoInicio: { coordenadas: google.maps.LatLngLiteral; direccion: string };
    puntoFin: { coordenadas: google.maps.LatLngLiteral; direccion: string };
    recorrido: google.maps.LatLngLiteral[];
  }) {
    if (!ruta) return;

    const bounds = new google.maps.LatLngBounds();
    ruta.recorrido.forEach((punto) => bounds.extend(punto));
    bounds.extend(ruta.puntoInicio.coordenadas);
    bounds.extend(ruta.puntoFin.coordenadas);
    this.map.fitBounds(bounds);
    const center = bounds.getCenter();
    this.map.setCenter(center);

    if (this.startMarker) this.startMarker.setMap(null);
    if (this.endMarker) this.endMarker.setMap(null);
    if (this.polyline) this.polyline.setMap(null);

    this.polyline = new google.maps.Polyline({
      path: ruta.recorrido,
      geodesic: true,
      strokeOpacity: 0,
      icons: [
        {
          icon: {
            path: 'M 0,-1 0,1',
            strokeColor: '#0000ff',
            strokeOpacity: 1,
            strokeWeight: 4,
          },
          offset: '0',
          repeat: '20px',
        },
      ],
      map: this.map,
    });

    this.startMarker = new google.maps.Marker({
      position: ruta.puntoInicio.coordenadas,
      map: this.map,
      label: 'A',
      icon: {
        url: 'assets/images/markerGreen.png',
      },
    });

    const infoA = new google.maps.InfoWindow({
      content: `
        <div style="font-family: 'Segoe UI', sans-serif; border-radius: 12px; max-width: 250px; word-wrap: break-word; box-shadow: 0 4px 12px rgba(0,0,0,0.15); background: white; line-height: 1.2;">
          <div style="font-size: 14px; color: #4a4a4a;">
            <strong style="color: green;">Punto de Destino</strong><br><b>${ruta.puntoInicio.direccion}</b>
          </div>
        </div>`,
    });
    this.startMarker.addListener('click', () =>
      infoA.open(this.map, this.startMarker)
    );
    infoA.open(this.map, this.startMarker);

    this.endMarker = new google.maps.Marker({
      position: ruta.puntoFin.coordenadas,
      map: this.map,
      label: 'B',
      icon: {
        url: 'assets/images/markerRed.png',
      },
    });

    const infoB = new google.maps.InfoWindow({
      content: `
        <div style="font-family: 'Segoe UI', sans-serif; border-radius: 12px; max-width: 250px; word-wrap: break-word; box-shadow: 0 4px 12px rgba(0,0,0,0.15); background: white; line-height: 1.2;">
          <div style="font-size: 14px; color: #4a4a4a;">
            <strong style="color: red;">Punto de Destino</strong><br><b>${ruta.puntoFin.direccion}</b>
          </div>
        </div>`,
    });
    this.endMarker.addListener('click', () =>
      infoB.open(this.map, this.endMarker)
    );
    infoB.open(this.map, this.endMarker);
  }

  cancelar(modal: any) {
    modal.close();
    this.guardarRutaNueva.reset();
    this.configRuta.reset();
    this.informacion = null;
    this.nombreRuta = '';
    this.tarifa = 0;
    this.distancia = 0;
    this.incrementoMetros = 0;
    this.costoAdicional = 0;
    this.recorridoDeta = null;
    this.distanciak = null;
    this.rutaGuardada = undefined;
    this.idRuta = null;
    this.path = [];
    this.showId = false;
    if (this.startMarker) this.startMarker.setMap(null);
    if (this.endMarker) this.endMarker.setMap(null);
    if (this.polyline) this.polyline.setMap(null);
    this.startMarker = undefined!;
    this.endMarker = undefined!;
    this.polyline = undefined!;
    this.mostrarBotonDeshacer = false;
    if (this.modalRef) {
      this.modalRef.close();
    }
    this.title = 'Planeación de Rutas';
    this.subtitle = 'Define y registra el recorrido que seguirán.';
    this.idRutaEspecifica = null;
    this.initForm();
    this.initMap();
  }

  loadGoogleMaps() {
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      this.initMap();
      return;
    }
    const script = document.createElement('script');
    script.src =
      'https://maps.googleapis.com/maps/api/js?key=AIzaSyCViGKafQxsHPmgGtlPsUDIaOdttLKJLk4';
    script.async = true;
    script.defer = true;
    script.onload = () => this.zone.run(() => this.initMap());
    document.head.appendChild(script);
  }

  // arriba, junto con tus otras props:
directionsService!: google.maps.DirectionsService;
directionsRenderer!: google.maps.DirectionsRenderer;

// guarda también el último resultado para reusar direcciones/leg:
private lastDirectionsResult?: google.maps.DirectionsResult;


initMap() {
  const mapElement = document.getElementById('map') as HTMLElement;

  this.map = new google.maps.Map(mapElement, {
    center: this.center,
    zoom: this.zoom,
    draggable: true,
    scrollwheel: true,
    disableDefaultUI: false,
  });

  this.geocoder = new google.maps.Geocoder();

  // NUEVO: Directions
  this.directionsService = new google.maps.DirectionsService();
  this.directionsRenderer = new google.maps.DirectionsRenderer({
    map: this.map,
    suppressMarkers: true,      // usaremos tus markers personalizados A/B
    preserveViewport: true,     // no haga zoom agresivo; tú controlas bounds
    polylineOptions: {
      strokeOpacity: 0,         // oculto para usar tu patrón punteado
    },
  });

  // Mantén tu polyline punteada (la usaremos para estilizar la ruta calculada):
  this.polyline = new google.maps.Polyline({
    path: this.path,
    geodesic: true,
    strokeOpacity: 0,
    icons: [
      {
        icon: { path: 'M 0,-1 0,1', strokeColor: '#0000ff', strokeOpacity: 1, strokeWeight: 4 },
        offset: '0',
        repeat: '20px',
      },
    ],
    map: this.map,
  });

  if (!this.idRutaEspecifica) {
    this.map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const latLng = e.latLng.toJSON();

      // LÓGICA NUEVA:
      if (!this.startMarker) {
        // Primer click => Punto A
        this.path = [latLng];
        this.polyline.setPath(this.path);
        this.addStartMarker(latLng);
        this.mostrarBotonDeshacer = true;
      } else if (!this.endMarker) {
        // Segundo click => Punto B => Calcula ruta
        this.addEndMarker(latLng);
        this.calcularRuta(this.startMarker.getPosition()!.toJSON(), latLng);
      } else {
        // Si ya había A y B, interpretamos nuevo click como nuevo destino B:
        this.addEndMarker(latLng);
        this.calcularRuta(this.startMarker.getPosition()!.toJSON(), latLng);
      }
    });
  }
}

private calcularRuta(origen: google.maps.LatLngLiteral, destino: google.maps.LatLngLiteral) {
  const req: google.maps.DirectionsRequest = {
    origin: origen,
    destination: destino,
    travelMode: google.maps.TravelMode.DRIVING, // o WALKING/BICYCLING/TRANSIT
    provideRouteAlternatives: false,
  };

  this.directionsService.route(req, (result, status) => {
    if (status === 'OK' && result) {
      this.lastDirectionsResult = result;
      this.directionsRenderer.setDirections(result);

      const route = result.routes[0];
      const leg = route.legs[0];

      // Usa overview_path para alimentar tu polyline punteada:
      const overview = route.overview_path?.map(p => p.toJSON()) ?? [];

      // IMPORTANTÍSIMO: sincroniza tu `path` para que tus flujos posteriores funcionen
      this.path = overview;
      this.polyline.setPath(this.path);

      // Coloca/actualiza markers en los puntos exactos de la ruta
      if (leg.start_location) {
        const start = leg.start_location.toJSON();
        this.addStartMarker(start);
      }
      if (leg.end_location) {
        const end = leg.end_location.toJSON();
        this.addEndMarker(end);
      }

      // Ajusta bounds a la ruta
      const bounds = new google.maps.LatLngBounds();
      overview.forEach(pt => bounds.extend(pt));
      this.map.fitBounds(bounds);

      // Opcional: precarga `rutaGuardada` con direcciones del leg (más preciso que geocoder)
      this.rutaGuardada = {
        puntoInicio: { coordenadas: leg.start_location.toJSON(), direccion: leg.start_address || 'Sin dirección' },
        puntoFin: { coordenadas: leg.end_location.toJSON(), direccion: leg.end_address || 'Sin dirección' },
        recorrido: [...this.path],
      };

      // Si quieres tener la distancia en km de inmediato:
      this.distanciak = (leg.distance?.value ?? 0) / 1000;

    } else {
      Swal.fire({ title: 'No se pudo trazar la ruta', text: `${status}`, icon: 'warning' });
    }
  });
}


  addStartMarker(position: google.maps.LatLngLiteral) {
    this.mostrarBotonDeshacer = true;
    if (this.startMarker) this.startMarker.setMap(null);
    this.startMarker = new google.maps.Marker({
      position,
      map: this.map,
      label: 'A',
      icon: {
        url: 'assets/images/markerGreen.png',
      },
    });

    this.geocoder.geocode({ location: position }, (results, status) => {
      const direccion =
        status === 'OK' && results && results[0]
          ? results[0].formatted_address
          : 'Dirección no encontrada';

      const info = new google.maps.InfoWindow({
        content: `
            <div style="font-family: 'Segoe UI', sans-serif; border-radius: 12px; max-width: 250px; word-wrap: break-word; box-shadow: 0 4px 12px rgba(0,0,0,0.15); background: white; line-height: 1.2;">
              <div style="font-size: 14px; color: #4a4a4a;">
                <strong style="color: green;">Punto de Destino</strong><br><b>${direccion}</b>
              </div>
            </div>
          `,
      });
      this.startMarker.addListener('click', () => {
        info.open(this.map, this.startMarker);
      });
      info.open(this.map, this.startMarker);
    });
  }

  addEndMarker(position: google.maps.LatLngLiteral) {
    if (this.endMarker) this.endMarker.setMap(null);

    this.endMarker = new google.maps.Marker({
      position,
      map: this.map,
      label: 'B',
      icon: {
        url: 'assets/images/markerRed.png',
      },
    });

    this.geocoder.geocode({ location: position }, (results, status) => {
      const direccion =
        status === 'OK' && results && results[0]
          ? results[0].formatted_address
          : 'Dirección no encontrada';

      const info = new google.maps.InfoWindow({
        content: `
            <div style="font-family: 'Segoe UI', sans-serif; border-radius: 12px; max-width: 250px; word-wrap: break-word; box-shadow: 0 4px 12px rgba(0,0,0,0.15); background: white; line-height: 1.2;">
              <div style="font-size: 14px; color: #4a4a4a;">
                <strong style="color: red;">Punto de Destino</strong><br><b>${direccion}</b>
              </div>
            </div>
          `,
      });

      this.endMarker.addListener('click', () => {
        info.open(this.map, this.endMarker);
      });

      info.open(this.map, this.endMarker);
    });
  }
eliminarUltimoPunto() {
  // Si hay destino B (ruta trazada), quítalo primero:
  if (this.endMarker) {
    this.endMarker.setMap(null);
    this.endMarker = undefined!;
    this.lastDirectionsResult = undefined;
    this.directionsRenderer.setDirections({ routes: [] } as any);
    // Vuelve al estado de solo A
    this.path = this.startMarker ? [this.startMarker.getPosition()!.toJSON()] : [];
    this.polyline.setPath(this.path);
    return;
  }

  // Si solo queda A o nada, comportarse como antes:
  if (this.path.length <= 1) {
    if (this.startMarker) { this.startMarker.setMap(null); this.startMarker = undefined!; }
    this.path = [];
    this.polyline.setPath(this.path);
    this.mostrarBotonDeshacer = false;
    return;
  }

  // (Modo manual) — si quieres conservarlo por compatibilidad:
  this.path.pop();
  this.polyline.setPath(this.path);
  const nuevoFinal = this.path[this.path.length - 1];
  if (this.endMarker) { this.endMarker.setMap(null); this.endMarker = undefined!; }
  this.addEndMarker(nuevoFinal);
}


  /**
   * Open Large modal
   * @param largeDataModal large modal data
   */
  largeModal(largeDataModal: any) {
    this.modalService.open(largeDataModal, {
      size: 'lg',
      windowClass: 'modal-holder',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
  }

  validarMaxCaracteres(event: any, maxLength: number) {
    if (event.target.value.length > maxLength) {
      event.target.value = event.target.value.slice(0, maxLength);
    }
  }
}