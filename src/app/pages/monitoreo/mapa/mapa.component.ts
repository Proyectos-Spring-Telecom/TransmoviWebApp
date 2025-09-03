import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.scss',
  animations: [fadeInUpAnimation]
})

export class MapaComponent implements OnInit {
  center = { lat: 23.6345, lng: -102.5528 };
  zoom = 5;
  operations = [
  {
    opertion: 'Ruta 1 - Terminal / Alfredo del Mazo',
    name: 'Mercedes-Benz Boxer',
    det: 3201,
    company: 'Autotransportes Toluca Centro',
    date: '2025-06-04 07:35 AM',
    imageUrl: 'https://www.portalautomotriz.com/sites/portalautomotriz.com/files/styles/pa3_modal/public/media/photos/00076422-original.jpeg?itok=CiFmSMuT',
    position: { lat: 19.2908, lng: -99.6580 },
    label: { color: 'black', text: '3201' }
  },
  {
    opertion: 'Ruta 7 - Col. Universidad / Centro',
    name: 'Volkswagen Worker 15.190',
    det: 1457,
    company: 'Rutas Urbanas del Valle',
    date: '2025-06-04 08:02 AM',
    imageUrl: 'https://www.artectrucks.com.mx/dist/images/unidades/buses/03/portada.webp',
    position: { lat: 19.2929, lng: -99.6544 },
    label: { color: 'black', text: '1457' }
  },
  {
    opertion: 'Ruta 3 - San Lorenzo / Mercado Juárez',
    name: 'Mercedes-Benz Boxer',
    det: 'RU-903',
    company: 'Transportes Unidos Toluca',
    date: '2025-06-04 08:20 AM',
    imageUrl: 'https://www.portalautomotriz.com/sites/portalautomotriz.com/files/styles/pa3_modal/public/media/photos/00076422-original.jpeg?itok=CiFmSMuT',
    position: { lat: 19.2876, lng: -99.6601 },
    label: { color: 'black', text: 'RU-903' }
  },
  {
    opertion: 'Ruta 9 - Zinacantepec / Centro',
    name: 'Mercedes-Benz Boxer',
    det: 7784,
    company: 'Autobuses El Volcán',
    date: '2025-06-04 08:40 AM',
    imageUrl: 'https://www.portalautomotriz.com/sites/portalautomotriz.com/files/styles/pa3_modal/public/media/photos/00076422-original.jpeg?itok=CiFmSMuT',
    position: { lat: 19.2861, lng: -99.6667 },
    label: { color: 'black', text: '7784' }
  },
  {
    opertion: 'Ruta 5 - Las Torres / Instituto Tecnológico',
    name: 'Volkswagen Worker 15.190',
    det: 6622,
    company: 'Rápidos del Centro',
    date: '2025-06-04 09:05 AM',
    imageUrl: 'https://www.artectrucks.com.mx/dist/images/unidades/buses/03/portada.webp',
    position: { lat: 19.2912, lng: -99.6502 },
    label: { color: 'black', text: '6622' }
  }
];



  constructor(private route: Router){

  }

  ngOnInit(): void {
    this.loadGoogleMaps();
    this.initializeTooltips();
    this.showMapZoom = false;
  }

  irDetalle(){
    this.route.navigateByUrl('/estaciones/detalle-estaciones')
  }

  map!: google.maps.Map;
  public showMapZoom: boolean;


  loadGoogleMaps() {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBpLS8xONczrVarb5aZz-mXj1hBMLxhQpU&callback=initMap`;
  script.defer = true;
  document.head.appendChild(script);

  (window as any).initMap = () => {
    this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: this.center,
      zoom: this.zoom
    });

    const icon = {
      url: 'assets/images/icons8-marker-48.png',
      scaledSize: new google.maps.Size(50, 50),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(20, 40)
    };

    this.operations.forEach(operation => {
      const marker = new google.maps.Marker({
        position: operation.position,
        map: this.map,
        label: operation.label,
        icon: icon
      });

      const infoWindow = new google.maps.InfoWindow({
  content: `
    <div style="font-family: 'Segoe UI', sans-serif; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); background: white; line-height: 1.4;">
      <style>
        .gm-style-iw-d {
          padding: 0 !important;
          overflow: hidden !important;
        }
        .gm-style-iw {
          max-width: none !important;
        }
      </style>
      <div style="font-weight: 600; font-size: 16px; color: #2c3e50; margin-bottom: 8px;">
        ${operation.opertion}
      </div>
      <div style="font-size: 14px; color: #4a4a4a;">
        <strong>Vehiculo:</strong> ${operation.name}
      </div>
      <div style="font-size: 14px; color: #4a4a4a;">
        <strong>Eco:</strong> ${operation.det}
      </div>
      <div style="font-size: 14px; color: #4a4a4a;">
        <strong>Fecha:</strong> ${operation.date}
      </div>
    </div>
  `
});



      marker.addListener('mouseover', () => infoWindow.open(this.map, marker));
      marker.addListener('mouseout', () => infoWindow.close());

      this.markerMap.set(operation.det, { marker, infoWindow });
    });
  };
  }

  restaurarMapa() {
    if (this.map) {
      this.showMapZoom = false;
      this.map.setCenter(this.center);
      this.map.setZoom(this.zoom);    
    }
  }
  
  markerMap = new Map<string | number, { marker: google.maps.Marker, infoWindow: google.maps.InfoWindow }>();
  activeInfoWindow: google.maps.InfoWindow | null = null;


  centrarEnUbicacion(position: { lat: number; lng: number }, detId: string | number) {
  console.log('Centrando en posición:', position);
  if (!this.map) return;

  this.showMapZoom = true;
  this.map.panTo(position);

  const targetZoom = 15;
  const currentZoom = this.map.getZoom() || this.zoom;
  const step = currentZoom < targetZoom ? 1 : -1;
  let zoom = currentZoom;

  const zoomInterval = setInterval(() => {
    zoom = this.map.getZoom() || zoom;

    if (zoom === targetZoom) {
      clearInterval(zoomInterval);

      const item = this.markerMap.get(detId);
      if (item) {
        // ✅ Cierra el anterior si existe
        if (this.activeInfoWindow) {
          this.activeInfoWindow.close();
        }

        // ✅ Abre el nuevo y lo guarda como el activo
        item.infoWindow.open(this.map, item.marker);
        this.activeInfoWindow = item.infoWindow;

        // Opcional: cerrarlo automáticamente después de 4 segundos
        setTimeout(() => {
          if (this.activeInfoWindow === item.infoWindow) {
            item.infoWindow.close();
            this.activeInfoWindow = null;
          }
        }, 4000);
      }
      return;
    }

    this.map.setZoom(zoom + step);
  }, 100);
}

  ngAfterViewInit() {
    this.initializeTooltips();
  }

  initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl: HTMLElement) {
      new (window as any).bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
  
}
