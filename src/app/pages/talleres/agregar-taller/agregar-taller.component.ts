import { Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { TallereService } from 'src/app/shared/services/talleres.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-taller',
  templateUrl: './agregar-taller.component.html',
  styleUrls: ['./agregar-taller.component.scss'],
  animations: [fadeInUpAnimation],
})
export class AgregarTallerComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public title = 'Agregar Taller';

  listaClientes: any[] = [];
  displayCliente = (c: any) =>
    c
      ? `${c.nombre || ''} ${c.apellidoPaterno || ''} ${
          c.apellidoMaterno || ''
        }`.trim()
      : '';

  public tallerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private tallService: TallereService,
    private zone: NgZone,
    private clieService: ClientesService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.obtenerClientes();
  }

  obtenerClientes() {
    this.clieService.obtenerClientes().subscribe((response) => {
      this.listaClientes = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c?.id ?? c?.Id ?? c?.ID),
      }));
    });
  }

  initForm() {
    // Estructura alineada al swagger (imagen):
    // {
    //  nombre, descripcion, icono, direccion, lat, lng, estatus, idCliente
    // }
    this.tallerForm = this.fb.group({
      idCliente: [null, Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      icono: [''],
      direccion: [''],
      lat: [null, Validators.required],
      lng: [null, Validators.required],
      estatus: [1, Validators.required],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.tallerForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: Record<string, string> = {
        idCliente: 'Cliente',
        nombre: 'Nombre',
        lat: 'Latitud (seleccione en el mapa)',
        lng: 'Longitud (seleccione en el mapa)',
        estatus: 'Estatus',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.tallerForm.controls).forEach((key) => {
        const control = this.tallerForm.get(key);
        if (control?.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, i) => `
        <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
          <strong style="color:#b02a37;">${i + 1}. ${campo}</strong>
        </div>
      `
        )
        .join('');

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

    const raw = this.tallerForm.value;

    const payload = {
      nombre: (raw?.nombre ?? '').toString().trim(),
      descripcion: (raw?.descripcion ?? '').toString().trim(),
      icono: (raw?.icono ?? '').toString().trim(),
      direccion: (raw?.direccion ?? '').toString().trim(),
      lat: this.toNumber6(raw?.lat),
      lng: this.toNumber6(raw?.lng),
      estatus: Number(raw?.estatus ?? 1),
      idCliente: Number(raw?.idCliente),
    };

    this.tallService.agregarTaller(payload).subscribe(
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: 'Se agregó un nuevo taller de manera exitosa.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error: string) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: `${error}`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          allowOutsideClick: false,
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/talleres');
  }

  // --------- MAPA ---------
  lat: number | null = null;
  lng: number | null = null;
  private map!: any;
  private marker!: any;
  private infoWindow!: any;
  private geocoder!: any;

  async ngAfterViewInit(): Promise<void> {
    await this.loadGoogleMaps('AIzaSyBpLS8xONczrVarb5aZz-mXj1hBMLxhQpU');
    this.initMap();
  }

  private initMap(): void {
    const center = { lat: 19.284, lng: -99.655 };
    const el = document.getElementById('map') as HTMLElement;
    this.map = new google.maps.Map(el, { center, zoom: 14 });
    this.geocoder = new google.maps.Geocoder();
    this.infoWindow = new google.maps.InfoWindow();

    this.map.addListener('click', (e: any) => {
      this.zone.run(() => {
        const lat = this.toNumber6(e.latLng.lat());
        const lng = this.toNumber6(e.latLng.lng());

        this.lat = lat;
        this.lng = lng;

        // Primero guardamos lat/lng
        this.tallerForm.patchValue({ lat, lng });

        // Luego resolvemos y guardamos la dirección
        this.setAddressFromLatLng(e.latLng);

        this.placeMarker(e.latLng);
      });
    });
  }

  /** Obtiene la dirección y la guarda en el form: direccion */
  private setAddressFromLatLng(latLng: google.maps.LatLng): void {
    this.geocoder.geocode(
      { location: latLng },
      (results: any, status: string) => {
        let address = '';
        if (status === 'OK' && results && results[0]?.formatted_address) {
          address = results[0].formatted_address;
        } else {
          // Fallback si falla el geocoder
          address = `Lat: ${latLng.lat().toFixed(6)}, Lng: ${latLng
            .lng()
            .toFixed(6)}`;
        }

        // Guarda en el form para que viaje en el payload
        this.tallerForm.patchValue({ direccion: address });

        // Muestra el InfoWindow (opcional)
        const html = `
      <div style="font-family:'Segoe UI',sans-serif;border-radius:12px;max-width:260px;word-wrap:break-word;
                  box-shadow:0 4px 12px rgba(0,0,0,0.15);background:white;line-height:1.2;">
        <strong style="font-size:16px;color:#002136">Ubicación seleccionada</strong>
        <div style="font-size:14px;color:#4a4a4a;">${address}</div>
      </div>`;
        this.infoWindow.setContent(html);
        this.infoWindow.open(this.map, this.marker);
      }
    );
  }

  private reverseGeocodeAndFill(latLng: any): void {
    this.geocoder.geocode(
      { location: latLng },
      (results: any, status: string) => {
        const address =
          status === 'OK' && results && results[0]?.formatted_address
            ? results[0].formatted_address
            : `Lat: ${latLng.lat().toFixed(6)}, Lng: ${latLng
                .lng()
                .toFixed(6)}`;

        // Muestra y guarda la dirección para el payload (campo "direccion")
        const html = `
        <div style="font-family: 'Segoe UI', sans-serif; border-radius: 12px; max-width: 260px; word-wrap: break-word; box-shadow: 0 4px 12px rgba(0,0,0,0.15); background: white; line-height: 1.2;">
          <strong style="font-size: 16px; color: #002136">Ubicación seleccionada</strong>
          <div style="font-size: 14px; color: #4a4a4a;">${address}</div>
        </div>
      `;
        this.infoWindow.setContent(html);
        this.infoWindow.open(this.map, this.marker);

        this.tallerForm.patchValue({ direccion: address });
      }
    );
  }

  private placeMarker(location: any): void {
    if (this.marker) {
      this.marker.setPosition(location);
    } else {
      this.marker = new google.maps.Marker({
        position: location,
        map: this.map,
        icon: {
          url: 'assets/images/marker.png',
          scaledSize: new google.maps.Size(50, 40),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(20, 40),
        },
      });
    }
    this.map.panTo(location);
  }

  private toNumber6(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? Number(n.toFixed(6)) : null;
  }

  private loadGoogleMaps(apiKey: string): Promise<void> {
    const w = window as any;
    if (w.google && w.google.maps) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const scriptId = 'gmaps-sdk';
      if (document.getElementById(scriptId)) {
        (
          document.getElementById(scriptId) as HTMLScriptElement
        ).addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
      document.head.appendChild(script);
    });
  }
}
