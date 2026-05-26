import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import Swal from 'sweetalert2';

export type MetodoPagoUiVariant = 'efectivo' | 'grupo';

export interface OpcionMetodoPagoUi {
  id: number;
  nombre: string;
  variant: MetodoPagoUiVariant;
}

@Component({
  selector: 'app-punto-venta-post',
  templateUrl: './punto-venta-post.component.html',
  styleUrl: './punto-venta-post.component.scss',
  animations: [
    fadeInUpAnimation,
  ],
})
export class PuntoVentaPostComponent implements OnInit {

  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  /**
   * Open extra large modal
   * @param exlargeModal extra large modal data
   */
  monederoSeleccionado: any = null;
  showContinueForId: number | null = null;
  step = 1;

  query = '';

  monto = 0;
  montoView = '';
  sliderMax = 2000;
  @ViewChild('exlargeModal', { static: true }) exlargeModal!: TemplateRef<any>;
  public listaMonederos: any
  public transaccionForm: FormGroup;
  public showForm = false;
  public listaMetodosPago: any[] = [];
  /** Paso 2: efectivo y el resto del catálogo agrupado (un id representativo: el menor del grupo). */
  public opcionesMetodoPagoUi: OpcionMetodoPagoUi[] = [];

  constructor(
    private modalService: NgbModal,
    private moneService: MonederosServices,
    private transaccionService: TransaccionesService,
    private fb: FormBuilder,
    private route: Router
  ) {

  }

  obtenerMetodosPago(){
    this.moneService.obtenerMetodosPago().subscribe({
      next: (response: any) => {
        const raw = response?.data ?? response ?? [];
        this.listaMetodosPago = Array.isArray(raw) ? raw.map((m: any) => ({
          id: Number(m?.id ?? m?.Id ?? m?.idMetodoPago ?? m?.ID),
          nombre: m?.nombre ?? m?.Nombre ?? m?.descripcion ?? m?.Descripcion ?? 'Sin nombre',
        })) : [];
        this.rebuildOpcionesMetodoPago();
      },
      error: (error) => {
        console.error('Error al cargar métodos de pago', error);
        this.listaMetodosPago = [];
        this.opcionesMetodoPagoUi = [];
      }
    });
  }

  irTransacciones(){
    this.route.navigateByUrl('/transacciones')
  }

  ngOnInit() {
    this.obtenerMetodosPago();
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
    this.initForm();
    setTimeout(() => this.extraLarge(this.exlargeModal), 0);
    this.obtenerMonerderos()
  }

  public mensajeMonederos: string = '';

  obtenerMonerderos() {
    this.mensajeMonederos = '';
    this.moneService.obtenerMonederos().subscribe({
      next: (response: any) => {
        this.listaMonederos = response?.data ?? [];
        if (!this.listaMonederos.length) this.mensajeMonederos = 'No se encontraron monederos.';
        setTimeout(() => Swal.close(), 600);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.submitButton = 'Confirmar';
        setTimeout(() => Swal.close(), 0);
        this.listaMonederos = [];
        this.mensajeMonederos = err.status === 404
          ? 'No se encontraron monederos.'
          : 'No se encontraron monederos para realizar una recarga.';
      }
    });
  }

  private async getErrorMessage(err: any): Promise<string> {
    if (err?.status === 0 && !err?.error)
      return 'No hay conexión con el servidor (status 0). Verifica tu red.';
    if (err?.error instanceof Blob) {
      try {
        const txt = await err.error.text();
        if (txt) return txt;
      } catch { }
    }
    if (typeof err?.error === 'string' && err.error.trim()) return err.error;
    if (typeof err?.message === 'string' && err.message.trim())
      return err.message;
    if (err?.error?.message) return String(err.error.message);
    if (err?.error?.errors) {
      const e = err.error.errors;
      if (Array.isArray(e)) return e.filter(Boolean).join('\n');
      if (typeof e === 'object') {
        const lines: string[] = [];
        for (const k of Object.keys(e)) {
          const val = e[k];
          if (Array.isArray(val)) lines.push(`${k}: ${val.join(', ')}`);
          else if (val) lines.push(`${k}: ${val}`);
        }
        if (lines.length) return lines.join('\n');
      }
    }
    const statusLine = err?.status
      ? `HTTP ${err.status}${err.statusText ? ' ' + err.statusText : ''}`
      : '';
    return statusLine;
  }

  extraLarge(exlargeModal: any) {
    this.modalRef = this.modalService.open(exlargeModal, {
      size: 'xl',
      windowClass: 'modal-holder',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
  }

  initForm() {
    this.transaccionForm = this.fb.group({
      tipoTransaccion: ['RECARGA', Validators.required],
      monto: [null, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      latitudFinal: [null],
      longitudFinal: [null],
      fechaHoraFinal: [null, Validators.required],
      numeroSerieMonedero: ['', Validators.required],
      numeroSerieDispositivo: [null],
      idMetodoPago: [null],
    });
  }

  showRecargaExitosa = false;
  private modalRef: any | null = null;
  public idTransaccion: any;
  public fechaFinal: string | null = null;
  public montoFinal: number | null = null;
  public metodoPago: string | null = null;

  agregarTransaccion() {
  const faltantes: string[] = [];
  const metodoPagoSeleccionado = this.transaccionForm.get('idMetodoPago')?.value;
  if (!this.monederoSeleccionado) faltantes.push('Monedero: selecciona uno en la pantalla anterior (botón "Cambiar monedero").');
  if (!this.monto || this.monto <= 0) faltantes.push('Monto: Escribe una cantidad a recargar.');
  if (!metodoPagoSeleccionado) faltantes.push('Método de Pago: Marca una opción.');

  if (faltantes.length > 0) {
    Swal.fire({
      title: '¡Ops!',
      html: `<div>Para continuar, completa lo siguiente:</div><div style="text-align:left;">${faltantes.map((item) => `• ${item}`).join('<br>')}</div>`,
      icon: 'warning',
      background: '#002136',
      confirmButtonText: 'Ir a completar',
    });
    return;
  }

  this.submitButton = 'Cargando...';
  this.loading = true;
  Swal.fire({
    title: 'Cargando…',
    html: '<div style="margin-top:.5rem;opacity:.85">Procesando tu recarga, espere un momento</div>',
    background: '#03131dff',
    backdrop: 'rgba(0, 0, 0, 0.86)',
    color: '#e3f8f2',
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => { Swal.showLoading(); }
  });

  // Obtener el número de serie del monedero seleccionado directamente del objeto
  const numSerie = this.monederoSeleccionado?.numeroSerie || this.monederoSeleccionado?.numeroserie || '';
  
  if (!numSerie) {
    Swal.fire({
      title: 'Error',
      text: 'No se pudo obtener el número de serie del monedero seleccionado.',
      icon: 'error',
      background: '#002136',
      confirmButtonColor: '#3085d6',
    });
    this.loading = false;
    this.submitButton = 'Guardar';
    Swal.close();
    return;
  }

  this.transaccionForm.patchValue({
    numeroSerieMonedero: numSerie,
    fechaHoraFinal: this.nowZulu(),
  });

  const raw = this.transaccionForm.value;

  // Body alineado a Swagger; idTipoTransaccion como NUMBER (1 por defecto)
  const payload = {
    idTipoTransaccion: 1,
    monto: (() => {
      if (raw?.monto === '' || raw?.monto == null) return null;
      const n = Number(parseFloat(String(raw.monto).toString().replace(',', '.')).toFixed(2));
      return isNaN(n) ? null : n;
    })(),
    latitudFinal: null,
    longitudFinal: null,
    fechaHoraFinal: raw?.fechaHoraFinal || this.nowZulu(),
    numeroSerieMonedero: numSerie, // Usar directamente numSerie para evitar problemas
    numeroSerieDispositivo: null,
    idMetodoPago: raw?.idMetodoPago || null,
  };

  let holdTimer: any = null;

  // >>> Usa el servicio correcto para RECARGA
  this.transaccionService.recargaTransaccion(payload).subscribe({
    next: (_res: any) => {
      this.submitButton = 'Guardar';
      this.loading = false;
      this.modalRef?.close();
      this.modalRef = null;
      this.idTransaccion = _res?.data?.id || _res?.id;
      // Guardar datos de la respuesta del servicio
      this.fechaFinal = _res?.fechaFinal || null;
      this.montoFinal = _res?.montoFinal != null ? Number(_res.montoFinal) : null;
      this.metodoPago = _res?.metodoPago || null;
      holdTimer = setTimeout(() => {
        Swal.close();
        this.showRecargaExitosa = true;
      }, 3000);
    },
    error: async (err: any) => {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      this.submitButton = 'Guardar';
      this.loading = false;
      this.modalRef?.close();
      this.modalRef = null;
      Swal.close();

      // Mostrar el error DIRECTO del backend
      const msg = await this.getErrorMessage(err);
      Swal.fire({
        title: '¡Error!',
        text: String(msg || 'Error desconocido'),
        icon: 'error',
        background: '#002136',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
        allowOutsideClick: false
      }).then(() => {
        this.openModalFromStart();
      });
    }
  });
}


  isSelected(m: any): boolean {
    return !!this.monederoSeleccionado && this.monederoSeleccionado.id === m.id;
  }

  regresar() {
    this.route.navigateByUrl('/monederos')
  }

  seleccionarMonedero(m: any) {
    if (this.monederoSeleccionado?.id === m?.id) {
      this.showContinueForId = this.showContinueForId === m.id ? null : m.id;
      return;
    }

    // Crear una copia del objeto para asegurar que tenemos la referencia correcta
    this.monederoSeleccionado = {
      id: m.id,
      numeroSerie: m.numeroSerie || m.numeroserie,
      numeroserie: m.numeroserie || m.numeroSerie,
      saldo: m.saldo,
      pasajeroNombre: m.pasajeroNombre,
      pasajeroApellidoPaterno: m.pasajeroApellidoPaterno,
      pasajeroApellidoMaterno: m.pasajeroApellidoMaterno,
      clienteNombre: m.clienteNombre,
      clienteApellidoPaterno: m.clienteApellidoPaterno,
      clienteApellidoMaterno: m.clienteApellidoMaterno,
      ...m // Incluir cualquier otra propiedad
    };
    this.showContinueForId = m.id;
    console.log('Monedero seleccionado:', this.monederoSeleccionado);
  }

  irPaso(n: 1 | 2) {
    this.step = n;
    if (n === 2 && this.monederoSeleccionado) {
      const numSerie = this.monederoSeleccionado.numeroSerie || this.monederoSeleccionado.numeroserie || '';
      this.transaccionForm.patchValue({
        numeroSerieMonedero: numSerie,
        fechaHoraFinal: this.nowZulu(),
      });
      return;
    }

    if (n === 1) {
      if (!this.modalRef && this.exlargeModal) {
        this.extraLarge(this.exlargeModal);
      }
    }
  }

  private nowZulu(): string {
    const now = new Date();

    const y  = now.getFullYear();
    const m  = String(now.getMonth() + 1).padStart(2, '0');
    const d  = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
  }


  private resetFormState(): void {
    this.transaccionForm.reset({
      tipoTransaccion: 'RECARGA',
      monto: null,
      latitudFinal: null,
      longitudFinal: null,
      fechaHoraFinal: null,
      numeroSerieMonedero: '',
      numeroSerieDispositivo: null,
      idMetodoPago: null,
    });
    this.monto = 0;
    this.montoView = '';
    this.monederoSeleccionado = null;
    this.step = 1;
    this.fechaFinal = null;
    this.montoFinal = null;
    this.metodoPago = null;
    this.idTransaccion = null;
  }

  formatearFechaHora(fechaISO: string | null): string {
    if (!fechaISO) return 'Sin información';
    try {
      const fecha = new Date(fechaISO);
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const hours = String(fecha.getHours()).padStart(2, '0');
      const minutes = String(fecha.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return fechaISO;
    }
  }

  private openModalFromStart(): void {
    this.resetFormState();
    if (this.exlargeModal) {
      this.extraLarge(this.exlargeModal);
    }
  }

  realizarOtraRecarga(): void {
    this.showRecargaExitosa = false;
    this.openModalFromStart();
  }

  onInputMonto(ev: Event) {
    const val = (ev.target as HTMLInputElement).value;
    this.monto = Math.max(0, this.sanitizeNumber(val));
    this.montoView = val;
    this.transaccionForm.patchValue({ monto: this.monto });
  }

  setMonto(v: number) {
    this.monto = Math.max(0, v);
    this.montoView = this.monto.toFixed(2);
    this.transaccionForm.patchValue({ monto: this.monto });
  }

  /** Indica si el monto actual coincide con un botón rápido ($1, $5, etc.). */
  isMontoPresetActivo(valorPreset: number): boolean {
    const m = Number((this.monto ?? 0).toFixed(2));
    return m === Number(valorPreset);
  }

  inc(delta: number) {
    this.monto = Math.max(0, (this.monto || 0) + delta);
    this.montoView = this.monto.toFixed(2);
    this.transaccionForm.patchValue({ monto: this.monto });
  }

  getMonederosFiltrados(): any[] {
    const base = Array.isArray(this.listaMonederos) ? this.listaMonederos : [];
    const q = (this.query || '').toLowerCase().trim();
    if (!q) return base;

    return base.filter((m: any) => {
      const numeroSerie = String(m?.numeroSerie || m?.numeroserie || '').toLowerCase();
      const clienteNombre = String(m?.clienteNombre || '').toLowerCase();
      const clienteApellidoPaterno = String(m?.clienteApellidoPaterno || '').toLowerCase();
      const clienteApellidoMaterno = String(m?.clienteApellidoMaterno || '').toLowerCase();
      const clienteCompleto = `${clienteNombre} ${clienteApellidoPaterno} ${clienteApellidoMaterno}`.trim();
      return numeroSerie.includes(q) || clienteCompleto.includes(q);
    });
  }

  private sanitizeNumber(str: string): number {
    const clean = (str || '').replace(/[^\d.]/g, '');
    const parts = clean.split('.');
    const fixed = parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : parts[0];
    const n = parseFloat(fixed);
    return isNaN(n) ? 0 : n;
  }

  onSlider(val: number) {
    this.monto = Math.max(0, val || 0);
    this.montoView = this.monto.toFixed(2);
  }

  onMetodoPagoChange(metodoId: number, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const currentValue = this.transaccionForm.get('idMetodoPago')?.value;
    // Si ya está seleccionado, deseleccionar; si no, seleccionar (single-select)
    if (currentValue === metodoId) {
      this.transaccionForm.patchValue({
        idMetodoPago: null
      });
    } else {
      this.transaccionForm.patchValue({
        idMetodoPago: metodoId
      });
    }
  }

  isMetodoPagoSelected(metodoId: number): boolean {
    const currentValue = this.transaccionForm.get('idMetodoPago')?.value;
    return currentValue === metodoId;
  }

  private static isEfectivoNombre(nombre: string): boolean {
    return /efectivo|cash/i.test(String(nombre || '').trim());
  }

  private static isMercadoPagoNombre(nombre: string): boolean {
    const n = String(nombre || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return /mercado\s*pago|mercadopago/.test(n);
  }

  /** Muestra chip «Mercado Pago» solo si el catálogo aún no trae ese método (sin id usable). */
  get mostrarMercadoPagoPlaceholder(): boolean {
    const raw = this.listaMetodosPago;
    if (!Array.isArray(raw) || raw.length === 0) return false;
    return !raw.some((m) => PuntoVentaPostComponent.isMercadoPagoNombre(String(m?.nombre ?? '')));
  }

  /**
   * Métodos de pago en UI:
   * - Efectivo: tal cual el catálogo (p. ej. id 1, nombre «Efectivo»).
   * - «Tarjeta y pago electrónico»: agrupa todo lo que no es efectivo; al elegirla se envía un solo
   *   `idMetodoPago` representativo: el **menor id** del grupo (p. ej. con Transferencia=2,
   *   Tarjetas crédito=3, Débito=4 → se usa **2**). Si el catálogo cambia, sigue siendo el mínimo
   *   entre los no-efectivo.
   * - Mercado Pago: tarjeta solo visual en plantilla mientras no exista en el catálogo (sin id ni clic).
   */
  private rebuildOpcionesMetodoPago(): void {
    const raw = Array.isArray(this.listaMetodosPago) ? [...this.listaMetodosPago] : [];
    const out: OpcionMetodoPagoUi[] = [];

    const efectivo = raw.filter((m) => PuntoVentaPostComponent.isEfectivoNombre(m.nombre));
    const grupo = raw.filter((m) => !PuntoVentaPostComponent.isEfectivoNombre(m.nombre));

    if (efectivo.length) {
      const m = efectivo[0];
      out.push({ id: m.id, nombre: m.nombre, variant: 'efectivo' });
    }

    if (grupo.length) {
      const sorted = [...grupo].sort((a, b) => a.id - b.id);
      const m = sorted[0];
      out.push({
        id: m.id,
        nombre: 'Tarjeta y pago electrónico',
        variant: 'grupo',
      });
    }

    this.opcionesMetodoPagoUi = out;
  }

  confirmarRecarga() {
    if (!this.monederoSeleccionado || !this.monto || this.monto <= 0) return;
    console.log('RECARGA (Bootstrap) =>', {
      idMonedero: this.monederoSeleccionado.id,
      numeroSerie: this.monederoSeleccionado.numeroSerie,
      monto: this.monto
    });
  }

  cancelar() {
    this.step = 1;
    this.query = '';
    this.monto = 0;
    this.montoView = '';
    this.monederoSeleccionado = null;
    if (this.modalRef) {
    this.modalRef.close();
    this.modalRef = null;
  }
  this.irTransacciones()
  }

}