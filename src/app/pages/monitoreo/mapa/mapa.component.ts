import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { MonitoreoService } from 'src/app/shared/services/monitoreo.service';
import Swal from 'sweetalert2';
import { TransaccionesRoutingModule } from '../../transacciones/transacciones-routing.module';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss'],
  animations: [fadeInUpAnimation]
})
export class MapaComponent implements OnInit, AfterViewInit {
  center = { lat: 23.6345, lng: -102.5528 };
  zoom = 5;
  idCliente: number;
  operations: any[] = [];
  operationVehiculo: any[] = [];
  map!: google.maps.Map;
  showMapZoom = false;
  markerMap = new Map<string | number, { marker: google.maps.Marker; infoWindow: google.maps.InfoWindow }>();
  activeInfoWindow: google.maps.InfoWindow | null = null;
  derroteros: any[] = [];
  searchTerm = '';
  filtroTipo = 'Todos';
  filtroTipoItems = ['Todos', 'Con dispositivo', 'Sin dispositivo'];
  selectedDerroteroId: number | null = null;
  showCenterButton = true;
  private recorridoPolylines: google.maps.Polyline[] = [];
  private pathPointMarkers: google.maps.Marker[] = [];
  private readonly TRACE_COLOR = '#f30606';
  private readonly TRACE_WEIGHT = 4;
  private readonly TRACE_REPEAT = '20px';
  private readonly VERTEX_FILL = '#000000';
  private readonly VERTEX_STROKE = '#ffffff';
  private readonly VERTEX_SCALE = 5;
  private readonly MAX_FIT_ZOOM_INIT = 12;
  private readonly MAX_FIT_ZOOM_ROUTE = 16;
  private readonly DEFAULT_FOTO = 'assets/images/noimage.jpg';
  private centerMarker?: google.maps.Marker;
  private centerInfoWindow?: google.maps.InfoWindow;
  private readonly FIRST_POINT_ICON = 'assets/images/markerGreen.png';
  private readonly LAST_POINT_ICON = 'assets/images/markerRed.png';
  private geocoder!: google.maps.Geocoder;
  private ultimaUbicacionMap = new Map<string | number, { marker: google.maps.Marker; infoWindow: google.maps.InfoWindow }>();

  constructor(
    private route: Router,
    private auth: AuthenticationService,
    private monitoreoService: MonitoreoService
  ) { }

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.idCliente = user.idCliente;
    this.obtenerMonitoreo();
  }

  ngAfterViewInit(): void {
    this.initializeTooltips();
  }

  private formatFecha(fechaStr: string): string {
    if (!fechaStr) return 'Sin registro';

    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return 'Sin registro';

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  }

  get filteredOperations(): any[] {
    let result = [...this.operations];

    if (this.filtroTipo === 'Con dispositivo') {
      result = result.filter(o => !!o.numeroSerieDispositivo);
    } else if (this.filtroTipo === 'Sin dispositivo') {
      result = result.filter(o => !o.numeroSerieDispositivo);
    }

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter(o => {
        const eco = (o.eco ?? '').toString().toLowerCase();
        const placa = (o.placaVehiculo ?? '').toString().toLowerCase();
        return eco.includes(term) || placa.includes(term);
      });
    }

    return result;
  }

  obtenerMonitoreo(): void {
    if (!this.idCliente) {
      return;
    }

    this.monitoreoService.obtenerMonitoreoByCliente(this.idCliente).subscribe(resp => {
      const derroteros = resp.derroteros || [];
      const posiciones = resp.posicion || [];

      this.derroteros = derroteros;

      this.operations = posiciones.map((p: any) => ({
        id: p.id,
        eco: p.numeroEconomicoVehiculo,
        placaVehiculo: p.placaVehiculo,
        fechaHora: p.fechaHora,
        numeroSerieDispositivo: p.numeroSerieDispositivo,
        numeroSerieBlueVox: p.numeroSerieBlueVox,
        position: {
          lat: Number(p.latitud),
          lng: Number(p.longitud)
        },
        foto: p.foto || this.DEFAULT_FOTO,
        recorridoBloqueado: false
      }));


      this.loadGoogleMaps();
    });
  }

  verRecorridoDelDia(op: any): void {
    if (!this.map || !op?.numeroSerieDispositivo) {
      return;
    }

    const idCliente = this.idCliente;
    const numeroSerieDispositivo = op.numeroSerieDispositivo;

    this.monitoreoService
      .obtenerRecorridoDelDia(idCliente, numeroSerieDispositivo)
      .subscribe(resp => {
        const posiciones = Array.isArray(resp.posicion) ? resp.posicion : [];

        if (!posiciones.length) {
          op.recorridoBloqueado = true;

          Swal.fire({
            icon: 'info',
            background: '#002136',
            title: '¡Ops!',
            text: 'Este vehículo no tiene recorrido registrado para el día de hoy.',
            confirmButtonText: 'Aceptar'
          });
          this.showCenterButton = true;
          return;
        }

        this.recorridoPolylines.forEach(p => p.setMap(null));
        this.recorridoPolylines = [];
        this.pathPointMarkers.forEach(m => m.setMap(null));
        this.pathPointMarkers = [];

        const bounds = new google.maps.LatLngBounds();

        const points = posiciones
          .map((p: any) => {
            const lat = Number(p.latitud ?? p.lat);
            const lng = Number(p.longitud ?? p.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              return null;
            }
            const ll = new google.maps.LatLng(lat, lng);
            bounds.extend(ll);
            return { ll, data: p };
          })
          .filter(Boolean) as { ll: google.maps.LatLng; data: any }[];

        if (!points.length) {
          return;
        }

        const path = points.map(pt => pt.ll);

        const polyline = new google.maps.Polyline({
          path,
          geodesic: true,
          clickable: false,
          strokeColor: '#00836d',
          strokeOpacity: 0.8,
          strokeWeight: 4
        });

        polyline.setMap(this.map);
        this.recorridoPolylines.push(polyline);

        points.forEach((pt, index) => {
          const mk = new google.maps.Marker({
            position: pt.ll,
            map: this.map,
            zIndex: 1000,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: this.VERTEX_FILL,
              fillOpacity: 1,
              strokeColor: this.VERTEX_STROKE,
              strokeOpacity: 1,
              strokeWeight: 2,
              scale: this.VERTEX_SCALE
            }
          });

          const key = `rec-${numeroSerieDispositivo}-${index}`;
          const infoWindow = new google.maps.InfoWindow({
            content: this.buildRecorridoPointContent(pt.data, key, op.placaVehiculo)
          });

          mk.addListener('mouseover', () => {
            if (this.activeInfoWindow && this.activeInfoWindow !== infoWindow) {
              this.activeInfoWindow.close();
            }
            infoWindow.open(this.map, mk);
          });

          mk.addListener('mouseout', () => {
            if (this.activeInfoWindow === infoWindow) {
              return;
            }
            infoWindow.close();
          });

          mk.addListener('click', () => {
            if (this.activeInfoWindow && this.activeInfoWindow !== infoWindow) {
              this.activeInfoWindow.close();
            }
            infoWindow.open(this.map, mk);
            this.activeInfoWindow = infoWindow;
          });

          infoWindow.addListener('domready', () => {
            const closeBtn = document.getElementById(`recorrido-close-${key}`);
            if (closeBtn) {
              closeBtn.onclick = () => {
                infoWindow.close();
                if (this.activeInfoWindow === infoWindow) {
                  this.activeInfoWindow = null;
                }
              };
            }
          });

          this.pathPointMarkers.push(mk);
        });

        if (!bounds.isEmpty()) {
          this.map.fitBounds(bounds);
          const listener = this.map.addListener('bounds_changed', () => {
            const currentZoom = this.map.getZoom();
            if (currentZoom && currentZoom > this.MAX_FIT_ZOOM_ROUTE) {
              this.map.setZoom(this.MAX_FIT_ZOOM_ROUTE);
            }
            google.maps.event.removeListener(listener);
          });
        }
      });
  }


  private buildDerroteroPointContent(address: string, key: string | number): string {
    const direccion = address || 'Sin dirección disponible';

    return `
    <div style="
      font-size: 12px;
      line-height: 1.5;
      min-width: 220px;
      width: 260px;
      max-width: 320px;
      color: #111827;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        padding-bottom: 4px;
        border-bottom: 1px solid #e5e7eb;
      ">
        <span style="font-weight: 600; font-size: 12px; color: #3b82f6;">Punto del Derrotero</span>
        <button
          id="derrotero-close-${key}"
          style="
            background: transparent;
            border: none;
            font-size: 14px;
            line-height: 1;
            padding: 0 0 0 8px;
            cursor: pointer;
            color: #6b7280;
          "
        >
          &times;
        </button>
      </div>
      <div>
        <div style="margin-bottom: 2px;">
          <span style="font-weight: 600; color: #374151;">Dirección:</span>
          <span style="color: #4b5563;"> ${direccion}</span>
        </div>
      </div>
    </div>
  `;
  }



  loadGoogleMaps(): void {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBpLS8xONczrVarb5aZz-mXj1hBMLxhQpU&callback=initMap`;
    script.defer = true;
    document.head.appendChild(script);

    (window as any).initMap = () => {
      (this as any).map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: this.center,
        zoom: this.zoom
      });

      this.geocoder = new google.maps.Geocoder();


      const bounds = new google.maps.LatLngBounds();

      this.pathPointMarkers.forEach(m => m.setMap(null));
      this.pathPointMarkers = [];
      this.markerMap.clear();
      this.ultimaUbicacionMap.clear();
      this.activeInfoWindow = null;

      this.operations.forEach((op, index) => {
        if (!op.position) {
          return;
        }

        const lat = Number(op.position.lat);
        const lng = Number(op.position.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return;
        }

        const position = new google.maps.LatLng(lat, lng);
        const key = op.id ?? op.eco ?? index;

        const marker = new google.maps.Marker({
          position,
          map: this.map,
          icon: 'assets/images/icons8-marker-48.png',
          title: op.eco ? `Económico: ${op.eco}` : undefined
        });

        const infoWindow = new google.maps.InfoWindow({
          content: this.buildInfoContent(op, key)
        });

        this.markerMap.set(key, { marker, infoWindow });

        marker.addListener('mouseover', () => {
          if (this.activeInfoWindow && this.activeInfoWindow !== infoWindow) {
            this.activeInfoWindow.close();
          }
          infoWindow.open(this.map, marker);
        });

        marker.addListener('mouseout', () => {
          if (this.activeInfoWindow === infoWindow) {
            return;
          }
          infoWindow.close();
        });

        marker.addListener('click', () => {
          if (this.activeInfoWindow && this.activeInfoWindow !== infoWindow) {
            this.activeInfoWindow.close();
          }
          infoWindow.open(this.map, marker);
          this.activeInfoWindow = infoWindow;
        });

        infoWindow.addListener('domready', () => {
          const closeBtn = document.getElementById(`tooltip-close-${key}`);
          if (closeBtn) {
            closeBtn.onclick = () => {
              infoWindow.close();
              if (this.activeInfoWindow === infoWindow) {
                this.activeInfoWindow = null;
              }
            };
          }
        });

        this.pathPointMarkers.push(marker);
        bounds.extend(position);
      });

      if (!bounds.isEmpty()) {
        this.map.fitBounds(bounds);
        const listener = this.map.addListener('bounds_changed', () => {
          const currentZoom = this.map.getZoom();
          if (currentZoom && currentZoom > this.MAX_FIT_ZOOM_INIT) {
            this.map.setZoom(this.MAX_FIT_ZOOM_INIT);
          }
          google.maps.event.removeListener(listener);
        });
      } else {
        this.map.setCenter(this.center);
        this.map.setZoom(this.zoom);
      }
    };
  }

  onDerroteroChange(derroteroId: number): void {
    if (!this.map || !derroteroId) {
      return;
    }

    const derrotero = this.derroteros.find((d: any) => d.id === derroteroId);
    if (!derrotero || !Array.isArray(derrotero.recorridoDetallado) || !derrotero.recorridoDetallado.length) {
      return;
    }

    this.recorridoPolylines.forEach(p => p.setMap(null));
    this.recorridoPolylines = [];

    this.pathPointMarkers.forEach(m => m.setMap(null));
    this.pathPointMarkers = [];

    const bounds = new google.maps.LatLngBounds();

    const puntos = derrotero.recorridoDetallado
      .map((p: any) => {
        const lat = Number(p.lat);
        const lng = Number(p.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }
        const ll = new google.maps.LatLng(lat, lng);
        bounds.extend(ll);
        return { ll, data: p };
      })
      .filter(Boolean) as { ll: google.maps.LatLng; data: any }[];

    if (!puntos.length) {
      return;
    }

    const path = puntos.map(pt => pt.ll);

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeOpacity: 0,
      clickable: false,
      icons: [
        {
          icon: {
            path: 'M 0,-1 0,1',
            strokeColor: this.TRACE_COLOR,
            strokeOpacity: 1,
            strokeWeight: this.TRACE_WEIGHT
          },
          offset: '0',
          repeat: this.TRACE_REPEAT
        }
      ]
    });

    polyline.setMap(this.map);
    this.recorridoPolylines.push(polyline);

    puntos.forEach((pt, index) => {
      let icon: any;

      if (index === 0) {
        icon = {
          url: 'assets/images/markerGreen.png',
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 40)
        };
      } else if (index === puntos.length - 1) {
        icon = {
          url: 'assets/images/markerRed.png',
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 40)
        };
      } else {
        icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: this.VERTEX_FILL,
          fillOpacity: 1,
          strokeColor: this.VERTEX_STROKE,
          strokeOpacity: 1,
          strokeWeight: 2,
          scale: this.VERTEX_SCALE
        };
      }

      const mk = new google.maps.Marker({
        position: pt.ll,
        map: this.map,
        zIndex: 1000,
        icon
      });

      const key = `der-${derroteroId}-${index}`;

      // Tooltip inicial mientras busca la dirección
      const infoWindow = new google.maps.InfoWindow({
        content: this.buildDerroteroPointContent('Buscando dirección...', key)
      });

      // Reverse geocoding para obtener la dirección exacta
      if (this.geocoder) {
        this.geocoder.geocode({ location: pt.ll }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address || 'Sin dirección disponible';
            infoWindow.setContent(this.buildDerroteroPointContent(address, key));
          } else {
            infoWindow.setContent(this.buildDerroteroPointContent('Sin dirección disponible', key));
          }
        });
      }

      mk.addListener('mouseover', () => {
        if (this.activeInfoWindow && this.activeInfoWindow !== infoWindow) {
          this.activeInfoWindow.close();
        }
        infoWindow.open(this.map, mk);
      });

      mk.addListener('mouseout', () => {
        if (this.activeInfoWindow === infoWindow) {
          return;
        }
        infoWindow.close();
      });

      mk.addListener('click', () => {
        if (this.activeInfoWindow && this.activeInfoWindow !== infoWindow) {
          this.activeInfoWindow.close();
        }
        infoWindow.open(this.map, mk);
        this.activeInfoWindow = infoWindow;
      });

      infoWindow.addListener('domready', () => {
        const closeBtn = document.getElementById(`derrotero-close-${key}`);
        if (closeBtn) {
          closeBtn.onclick = () => {
            infoWindow.close();
            if (this.activeInfoWindow === infoWindow) {
              this.activeInfoWindow = null;
            }
          };
        }
      });

      this.pathPointMarkers.push(mk);
    });

    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds);
      const listener = this.map.addListener('bounds_changed', () => {
        const currentZoom = this.map.getZoom();
        if (currentZoom && currentZoom > this.MAX_FIT_ZOOM_ROUTE) {
          this.map.setZoom(this.MAX_FIT_ZOOM_ROUTE);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }

  limpiarMapa(): void {
    this.selectedDerroteroId = null;
    this.showCenterButton = true;

    if (!this.map) {
      return;
    }

    this.recorridoPolylines.forEach(p => p.setMap(null));
    this.recorridoPolylines = [];

    this.pathPointMarkers.forEach(m => m.setMap(null));
    this.pathPointMarkers = [];

    this.markerMap.forEach(item => {
      item.marker.setMap(null);
      item.infoWindow.close();
    });
    this.markerMap.clear();
    this.ultimaUbicacionMap.clear();
    this.activeInfoWindow = null;

    const bounds = new google.maps.LatLngBounds();

    this.operations.forEach((op, index) => {
      if (!op.position) {
        return;
      }

      const lat = Number(op.position.lat);
      const lng = Number(op.position.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      const position = new google.maps.LatLng(lat, lng);
      const key = op.id ?? op.eco ?? index;

      const marker = new google.maps.Marker({
        position,
        map: this.map,
        icon: 'assets/images/icons8-marker-48.png',
        title: op.eco ? `Económico: ${op.eco}` : undefined
      });

      const infoWindow = new google.maps.InfoWindow({
        content: this.buildInfoContent(op, key)
      });

      this.markerMap.set(key, { marker, infoWindow });

      marker.addListener('mouseover', () => {
        if (this.activeInfoWindow && this.activeInfoWindow !== infoWindow) {
          this.activeInfoWindow.close();
        }
        infoWindow.open(this.map, marker);
      });

      marker.addListener('mouseout', () => {
        if (this.activeInfoWindow === infoWindow) {
          return;
        }
        infoWindow.close();
      });

      marker.addListener('click', () => {
        if (this.activeInfoWindow && this.activeInfoWindow !== infoWindow) {
          this.activeInfoWindow.close();
        }
        infoWindow.open(this.map, marker);
        this.activeInfoWindow = infoWindow;
      });

      infoWindow.addListener('domready', () => {
        const closeBtn = document.getElementById(`tooltip-close-${key}`);
        if (closeBtn) {
          closeBtn.onclick = () => {
            infoWindow.close();
            if (this.activeInfoWindow === infoWindow) {
              this.activeInfoWindow = null;
            }
          };
        }
      });

      this.pathPointMarkers.push(marker);
      bounds.extend(position);
    });

    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds);
      const listener = this.map.addListener('bounds_changed', () => {
        const currentZoom = this.map.getZoom();
        if (currentZoom && currentZoom > this.MAX_FIT_ZOOM_INIT) {
          this.map.setZoom(this.MAX_FIT_ZOOM_INIT);
        }
        google.maps.event.removeListener(listener);
      });
    } else {
      this.map.setCenter(this.center);
      this.map.setZoom(this.zoom);
    }
  }

  centrarEnUbicacion(op: any): void {
    if (!this.map || !op?.position) {
      return;
    }

    const lat = Number(op.position.lat);
    const lng = Number(op.position.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const position = new google.maps.LatLng(lat, lng);

    if (this.centerMarker) {
      this.centerMarker.setMap(null);
      this.centerMarker = undefined;
    }
    if (this.centerInfoWindow) {
      this.centerInfoWindow.close();
      this.centerInfoWindow = undefined;
    }

    const key = op.id ?? op.eco ?? op.numeroSerieDispositivo ?? 'center';

    this.centerMarker = new google.maps.Marker({
      position,
      map: this.map,
      icon: 'assets/images/icons8-marker-48.png',
      title: op.eco ? `Económico: ${op.eco}` : undefined,
    });

    const content = this.buildInfoContent(op, key);
    this.centerInfoWindow = new google.maps.InfoWindow({
      content,
    });

    const targetZoom = 17;
    this.map.setCenter(position);
    this.map.setZoom(targetZoom);

    if (this.activeInfoWindow && this.activeInfoWindow !== this.centerInfoWindow) {
      this.activeInfoWindow.close();
    }
    this.centerInfoWindow.open(this.map, this.centerMarker);
    this.activeInfoWindow = this.centerInfoWindow;

    this.centerInfoWindow.addListener('domready', () => {
      const closeBtn = document.getElementById(`tooltip-close-${key}`);
      if (closeBtn) {
        closeBtn.onclick = () => {
          this.centerInfoWindow?.close();
          if (this.activeInfoWindow === this.centerInfoWindow) {
            this.activeInfoWindow = null;
          }
        };
      }
    });
  }

  irDetalle(): void {
    this.route.navigateByUrl('/estaciones/detalle-estaciones');
  }

  initializeTooltips(): void {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl: HTMLElement) {
      new (window as any).bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  private buildInfoContent(op: any, key: string | number): string {
    const eco = op.eco || 'Sin registro';
    const vehiculo = op.placaVehiculo || 'Sin registro';
    const fechaHora = this.formatFecha(op.fechaHora);
    const dispositivo = op.numeroSerieDispositivo || 'Sin registro';
    const bluevox = op.numeroSerieBlueVox || 'Sin registro';

    return `
      <div style="
        font-size: 12px;
        line-height: 1.5;
        min-width: 220px;
        color: #111827;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e5e7eb;
        ">
          <span style="font-weight: 600; font-size: 12px; color: #34c38f">Última Posición</span>
          <button
            id="tooltip-close-${key}"
            style="
              background: transparent;
              border: none;
              font-size: 14px;
              line-height: 1;
              padding: 0 0 0 8px;
              cursor: pointer;
              color: #6b7280;
            "
          >
            &times;
          </button>
        </div>
        <div>
          <div style="margin-bottom: 2px;">
            <span style="font-weight: 600; color: #374151;">Económico:</span>
            <span style="color: #4b5563;"> ${eco}</span>
          </div>
          <div style="margin-bottom: 2px;">
            <span style="font-weight: 600; color: #374151;">Vehículo:</span>
            <span style="color: #4b5563;"> ${vehiculo}</span>
          </div>
          <div style="margin-bottom: 2px;">
            <span style="font-weight: 600; color: #374151;">Fecha/Hora:</span>
            <span style="color: #4b5563;"> ${fechaHora}</span>
          </div>
          <div style="margin-bottom: 2px;">
            <span style="font-weight: 600; color: #374151;">Dispositivo:</span>
            <span style="color: #4b5563;"> ${dispositivo}</span>
          </div>
          <div>
            <span style="font-weight: 600; color: #374151;">Bluevox:</span>
            <span style="color: #4b5563;"> ${bluevox}</span>
          </div>
        </div>
      </div>
    `;
  }

  private buildRecorridoPointContent(p: any, key: string | number, placaVehiculo: string | null | undefined): string {
    const lat = Number(p.latitud ?? p.lat);
    const lng = Number(p.longitud ?? p.lng);
    const fechaHora = this.formatFecha(p.fechaHora);
    const placa = placaVehiculo || p.placaVehiculo || 'Sin registro';

    return `
      <div style="
        font-size: 12px;
        line-height: 1.5;
        min-width: 220px;
        color: #111827;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e5e7eb;
        ">
          <span style="font-weight: 600; font-size: 12px; color: #3b82f6;">Punto del Recorrido</span>
          <button
            id="recorrido-close-${key}"
            style="
              background: transparent;
              border: none;
              font-size: 14px;
              line-height: 1;
              padding: 0 0 0 8px;
              cursor: pointer;
              color: #6b7280;
            "
          >
            &times;
          </button>
        </div>
        <div>
          <div style="margin-bottom: 2px;">
            <span style="font-weight: 600; color: #374151;">Vehículo:</span>
            <span style="color: #4b5563;"> ${placa}</span>
          </div>
          <div style="margin-bottom: 2px;">
            <span style="font-weight: 600; color: #374151;">Fecha/Hora:</span>
            <span style="color: #4b5563;"> ${fechaHora}</span>
          </div>
          <div style="margin-bottom: 2px;">
            <span style="font-weight: 600; color: #374151;">Latitud:</span>
            <span style="color: #4b5563;"> ${Number.isFinite(lat) ? lat.toFixed(6) : ''}</span>
          </div>
          <div>
            <span style="font-weight: 600; color: #374151;">Longitud:</span>
            <span style="color: #4b5563;"> ${Number.isFinite(lng) ? lng.toFixed(6) : ''}</span>
          </div>
        </div>
      </div>
    `;
  }
}