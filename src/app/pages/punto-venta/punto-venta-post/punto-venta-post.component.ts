import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import Swal from 'sweetalert2';

/* Tipado */
interface Monedero {
  id: number;
  numeroSerie: string;
  titular: string;
  saldo: number;
}
@Component({
  selector: 'app-punto-venta-post',
  templateUrl: './punto-venta-post.component.html',
  styleUrl: './punto-venta-post.component.scss',
  animations: [fadeInUpAnimation],
})
export class PuntoVentaPostComponent implements OnInit {

  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  /**
   * Open extra large modal
   * @param exlargeModal extra large modal data
   */
  monederoSeleccionado: any = null;
  wallets: Monedero[] = [
    { id: 1, numeroSerie: 'MN-001-AZ', titular: 'María López', saldo: 320.5 },
    { id: 2, numeroSerie: 'MN-002-BX', titular: 'Juan Pérez', saldo: 1520 },
    { id: 3, numeroSerie: 'MN-003-QW', titular: 'Logística MX SA', saldo: 90 },
    { id: 4, numeroSerie: 'MN-004-ZZ', titular: 'Luis Hernández', saldo: 780.25 },
    { id: 5, numeroSerie: 'MN-005-KL', titular: 'Sofía Ramos', saldo: 245.75 }
  ];
  selectedWalletId: number | null = null;
  step = 1;

  query = '';
  monederos = [
    { id: 1, numeroSerie: 'MX-001-AB', pasajero: 'Andrea López', cliente: 'Transp. Aurora', saldo: 320.50 },
    { id: 2, numeroSerie: 'MX-002-CD', pasajero: 'Luis Pérez', cliente: 'Transp. Aurora', saldo: 150.00 },
    { id: 3, numeroSerie: 'MX-003-EF', pasajero: 'María Ruiz', cliente: 'Logística Sol', saldo: 980.75 },
  ];

  monederosFiltrados = [...this.monederos];
  monederosPaginados: any[] = [];
  pageIndex = 0;
  pageSize = 9;
  totalPages = 1;

  monto = 0;
  montoView = '';
  sliderMax = 2000;
  @ViewChild('exlargeModal', { static: true }) exlargeModal!: TemplateRef<any>;
  public listaMonederos: any
  public transaccionForm: FormGroup;
  public showForm = false;

  constructor(
    private modalService: NgbModal,
    private moneService: MonederosServices,
    private transaccionService: TransaccionesService,
    private fb: FormBuilder,
    private route: Router
  ) {

  }

  irTransacciones(){
    this.route.navigateByUrl('/transacciones')
  }

  ngOnInit() {
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
    this.recalcPages();
    this.aplicarPaginacion();
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
      latitud: [null],
      longitud: [null],
      fechaHora: [null, Validators.required],
      numeroSerieMonedero: ['', Validators.required],
      numeroSerieDispositivo: [null],
    });
  }

  showRecargaExitosa = false;
  private modalRef: any | null = null;
  public idTransaccion: any;

  agregarTransaccion() {
    if (!this.monederoSeleccionado || !this.monto || this.monto <= 0) {
      Swal.fire({
        title: 'Atención',
        text: 'Debes seleccionar un monedero y definir un monto válido.',
        icon: 'warning',
        background: '#002136',
        confirmButtonColor: '#3085d6',
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
      didOpen: () => {
        Swal.showLoading();
      }
    });
    const numSerie = this.monederoSeleccionado.numeroserie || this.monederoSeleccionado.numeroSerie || '';
    this.transaccionForm.patchValue({
      numeroSerieMonedero: numSerie,
      fechaHora: this.nowZulu(),
    });
    const raw = this.transaccionForm.value;
    const payload = {
      tipoTransaccion: 'RECARGA',
      monto: (() => {
        if (raw?.monto === '' || raw?.monto == null) return null;
        const n = Number(parseFloat(String(raw.monto).toString().replace(',', '.')).toFixed(2));
        return isNaN(n) ? null : n;
      })(),
      latitud: null,
      longitud: null,
      fechaHora: raw?.fechaHora || this.nowZulu(),
      numeroSerieMonedero: raw?.numeroSerieMonedero || numSerie,
      numeroSerieDispositivo: null,
    };
    let holdTimer: any = null;
    this.transaccionService.agregarTransaccion(payload).subscribe({
      next: (_res: any) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        this.modalRef?.close();
        this.modalRef = null;
        this.idTransaccion = _res.data.id
        holdTimer = setTimeout(() => {
          Swal.close();
          this.showRecargaExitosa = true;
        }, 3000);
      },
      error: (err: any) => {
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        this.submitButton = 'Guardar';
        this.loading = false;
        this.modalRef?.close();
        this.modalRef = null;
        Swal.close();
        Swal.fire({
          title: '¡Error!',
          text: (typeof err === 'string' ? err : 'Ocurrió un problema al registrar la transacción.'),
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
    this.monederoSeleccionado = m;
  }


  get selectedWallet(): Monedero | null {
    return this.wallets.find(w => w.id === this.selectedWalletId) || null;
  }

  irPaso(n: 1 | 2) {
    this.step = n;
    if (n === 2 && this.monederoSeleccionado) {
      const numSerie = this.monederoSeleccionado.numeroserie || this.monederoSeleccionado.numeroSerie || '';
      this.transaccionForm.patchValue({
        numeroSerieMonedero: numSerie,
        fechaHora: this.nowZulu(),
      });
    }
  }

  private nowZulu(): string {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  private resetFormState(): void {
    this.transaccionForm.reset({
      tipoTransaccion: 'RECARGA',
      monto: null,
      latitud: null,
      longitud: null,
      fechaHora: null,
      numeroSerieMonedero: '',
      numeroSerieDispositivo: null,
    });
    this.monto = 0;
    this.montoView = '';
    this.monederoSeleccionado = null;
    this.step = 1;
  }

  private openModalFromStart(): void {
    this.resetFormState();
    if (this.exlargeModal) {
      this.extraLarge(this.exlargeModal);
    }
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

  inc(delta: number) {
    this.monto = Math.max(0, (this.monto || 0) + delta);
    this.montoView = this.monto.toFixed(2);
    this.transaccionForm.patchValue({ monto: this.monto });
  }

  filtrarMonederos() {
    const q = (this.query || '').toLowerCase().trim();
    this.monederosFiltrados = q
      ? this.monederos.filter(m =>
        `${m.numeroSerie} ${m.pasajero} ${m.cliente}`.toLowerCase().includes(q)
      )
      : [...this.monederos];
    this.pageIndex = 0;
    this.recalcPages();
    this.aplicarPaginacion();
  }

  private recalcPages() {
    this.totalPages = Math.max(1, Math.ceil(this.monederosFiltrados.length / this.pageSize));
  }

  private aplicarPaginacion() {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.monederosPaginados = this.monederosFiltrados.slice(start, end);
  }

  goFirst() { if (this.pageIndex > 0) { this.pageIndex = 0; this.aplicarPaginacion(); } }
  goPrev() { if (this.pageIndex > 0) { this.pageIndex--; this.aplicarPaginacion(); } }
  goNext() { if (this.pageIndex < this.totalPages - 1) { this.pageIndex++; this.aplicarPaginacion(); } }
  goLast() { if (this.pageIndex < this.totalPages - 1) { this.pageIndex = this.totalPages - 1; this.aplicarPaginacion(); } }

  getIniciales(nombre: string): string {
    if (!nombre) return '?';
    return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
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
    this.monederosFiltrados = [...this.monederos];
    this.pageIndex = 0;
    this.recalcPages();
    this.aplicarPaginacion();
    if (this.modalRef) {
    this.modalRef.close();
    this.modalRef = null;
  }
  this.irTransacciones()
  }

}