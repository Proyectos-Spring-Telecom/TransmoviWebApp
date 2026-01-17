import { AfterViewInit, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import Swal from 'sweetalert2';

declare const google: any;

@Component({
  selector: 'app-agregar-transaccion',
  templateUrl: './agregar-transaccion.component.html',
  styleUrl: './agregar-transaccion.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarTransaccionComponent implements OnInit, AfterViewInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public listaModulos: any;
  public transaccionForm: FormGroup;
  public idPermiso: number;
  public title = 'Generar Transacción';
  public listaDispositivos: any;
  public listaMonederos: any;
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;
  getSerie = (d: any) => (d ? d.numeroSerie ?? d.numeroserie ?? '' : '');
  public listaMetodosPago = [
    { id: 1, nombre: 'Efectivo' },
    { id: 2, nombre: 'Tarjetas de Crédito' },
    { id: 3, nombre: 'Tarjeta de Débito' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: Router,
    private transaccionService: TransaccionesService,
    private dispService: DispositivosService,
    private moneService: MonederosServices,
    private zone: NgZone
  ) { }

  ngOnInit(): void {
    this.obtenerDispositivos();
    this.obtenerMonederos();
    this.initForm();
  }

  private montoValidoValidator(control: any) {
    const v = control?.value;
    if (v === null || v === undefined || v === '') return null; // que lo marque 'required', no aquí
    const cleaned = String(v)
      .replace(/[^0-9.,-]/g, '')
      .replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? null : { montoInvalido: true };
  }

  initForm() {
    this.transaccionForm = this.fb.group({
      tipoTransaccion: [null, Validators.required],
      monto: [
        null,
        [Validators.required, this.montoValidoValidator.bind(this)],
      ],
      latitudFinal: [null],
      longitudFinal: [null],
      fechaHoraFinal: [null, Validators.required],
      numeroSerieMonedero: ['', Validators.required],
      numeroSerieDispositivo: [null],
      idMetodoPago: [null],
    });
  }

  toDatetimeLocal(isoZ: string | null): string {
    if (!isoZ) return '';
    const d = new Date(isoZ);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  }

  onComisionFocus(): void {
    const c = this.transaccionForm.get('monto');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  }

  onComisionBlur(): void {
    const c = this.transaccionForm.get('monto');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) {
      c.setValue('');
      return;
    }
    c.setValue(`$${num.toFixed(2)}`);
  }

  toIsoZulu(localStr: string | null): string | null {
    if (!localStr) return null;
    const value = localStr.toString().trim();
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      return `${value}:00Z`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
      return `${value}Z`;
    }
    return value;
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (!this.transaccionForm.get('fechaHoraFinal')?.value) {
      const nowLocal = this.toDatetimeLocal(new Date().toISOString());
      this.transaccionForm.patchValue({ fechaHoraFinal: nowLocal });
    }
    this.agregar();
  }

  obtenerDispositivos() {
    this.dispService.obtenerDispositivos().subscribe((response) => {
      const data = Array.isArray(response?.data) ? response.data : [];
      this.listaDispositivos = data.length
        ? data
        : [{ numeroSerie: 'Sin registros', disabled: true }];
    });
  }

  private mapTipoToId(t: string | null): string | null {
    const x = (t || '').toUpperCase();
    return x === 'RECARGA' ? '1' : x === 'DEBITO' ? '2' : null;
  }

  obtenerMonederos() {
    this.moneService.obtenerMonederos().subscribe((response) => {
      this.listaMonederos = Array.isArray(response?.data) ? response.data : [];
    });
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    const etiquetas: Record<string, string> = {
      tipoTransaccion: 'Tipo de Transacción',
      monto: 'Monto',
      fechaHoraFinal: 'Fecha y Hora',
      numeroSerieMonedero: 'N° de Serie de Monedero',
    };

    if (this.transaccionForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const camposFaltantes: string[] = [];
      Object.keys(this.transaccionForm.controls).forEach((key) => {
        const control = this.transaccionForm.get(key);
        if (control?.errors?.['required']) camposFaltantes.push(etiquetas[key] || key);
        if (key === 'monto' && control?.errors?.['montoInvalido']) camposFaltantes.push('Monto (formato inválido)');
      });

      const lista = camposFaltantes.map((campo, i) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${i + 1}. ${campo}</strong>
      </div>
    `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Los siguientes <strong>campos</strong> están vacíos o con formato inválido.<br>
          Por favor complétalos antes de continuar:
        </p>
        <div style="max-height:350px;overflow-y:auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const raw = this.transaccionForm.value;
    const tipo = (raw?.tipoTransaccion || '').toString().toUpperCase();

    const idTipoTransaccion =
      tipo === 'RECARGA' ? 1 :
        tipo === 'DEBITO' ? 2 : null;

    if (idTipoTransaccion == null) {
      this.submitButton = 'Guardar';
      this.loading = false;
      Swal.fire({
        title: '¡Ops!',
        background: '#002136',
        text: 'Tipo de transacción no válido. Elige RECARGA o DEBITO.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
        allowOutsideClick: false
      });
      return;
    }

    const payload = {
      idTipoTransaccion,
      monto: (() => {
        const v = raw?.monto;
        if (v === '' || v == null) return null;
        const cleaned = String(v).replace(/[^0-9.,-]/g, '').replace(',', '.');
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? +n.toFixed(2) : null;
      })(),
      latitudFinal: this.toNumber6(raw?.latitudFinal),
      longitudFinal: this.toNumber6(raw?.longitudFinal),
      fechaHoraFinal: this.toIsoZulu(raw?.fechaHoraFinal || null),
      numeroSerieMonedero: raw?.numeroSerieMonedero || null,
      numeroSerieDispositivo: raw?.numeroSerieDispositivo || null,
      idMetodoPago: raw?.idMetodoPago || null
    };

    const request$ = idTipoTransaccion === 1
      ? this.transaccionService.recargaTransaccion(payload)
      : this.transaccionService.debitoTransaccion(payload);

    request$.subscribe(
      (resp: any) => {
        this.submitButton = 'Guardar';
        this.loading = false;

        const contenido =
          typeof resp === 'string'
            ? resp
            : (resp?.message ?? resp?.mensaje ?? resp?.detail ?? resp?.error ?? JSON.stringify(resp));

        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: 'Se agregó una nueva transacción de manera exitosa.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });

        this.regresar();
      },
      (error: any) => {
        this.submitButton = 'Guardar';
        this.loading = false;

        let msg = '';
        const e = error;

        if (typeof e?.error === 'string' && e.error.trim()) {
          msg = e.error;
        } else if (e?.error && typeof e.error === 'object') {
          msg = e.error.message || e.error.mensaje || e.error.detail || e.error.error || JSON.stringify(e.error);
        } else if (typeof e === 'string' && e.trim()) {
          msg = e;
        } else if (e?.message) {
          msg = e.message;
        } else if (e?.status) {
          msg = `HTTP ${e.status}${e.statusText ? ' - ' + e.statusText : ''}`;
        } else {
          msg = 'Error desconocido';
        }

        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: String(msg),
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          allowOutsideClick: false
        });
      }
    );
  }



  moneyKeydown(e: KeyboardEvent) {
    const allowed = [
      'Backspace',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Home',
      'End',
    ];
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
    this.transaccionForm.get('monto')?.setValue(v, { emitEvent: false });
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
    this.transaccionForm.get('monto')?.setValue(v, { emitEvent: false });
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
    this.transaccionForm.get('monto')?.setValue(v, { emitEvent: false });
  }

  regresar() {
    this.route.navigateByUrl('/transacciones');
  }

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
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        this.lat = lat;
        this.lng = lng;
        this.transaccionForm.patchValue({ latitudFinal: lat, longitudFinal: lng });
        this.placeMarker(e.latLng);
        this.openInfoAt(e.latLng);
      });
    });
  }

  private openInfoAt(latLng: any): void {
    this.geocoder.geocode(
      { location: latLng },
      (results: any, status: string) => {
        let address =
          status === 'OK' && results && results[0]?.formatted_address
            ? results[0].formatted_address
            : `Lat: ${latLng.lat().toFixed(6)}, Lng: ${latLng
              .lng()
              .toFixed(6)}`;

        const html = `
      <div style="font-family: 'Segoe UI', sans-serif; border-radius: 12px; max-width: 250px; word-wrap: break-word; box-shadow: 0 4px 12px rgba(0,0,0,0.15); background: white; line-height: 1.2;">
        <strong style="font-size: 16px; color: #002136">Punto de Destino</strong>
        <div style="font-size: 14px; color: #4a4a4a;">${address}</div>
      </div>
    `;
        this.infoWindow.setContent(html);
        this.infoWindow.open(this.map, this.marker);
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
