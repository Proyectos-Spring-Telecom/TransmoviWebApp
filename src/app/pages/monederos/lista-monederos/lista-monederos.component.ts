import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-monederos',
  templateUrl: './lista-monederos.component.html',
  styleUrls: ['./lista-monederos.component.scss'],
  animations: [fadeInUpAnimation],
})
export class ListaMonederosComponent implements OnInit {
  listaMonederos: any;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public submitButton: string = 'Aceptar';
  public recargaForm: FormGroup;
  public debitoForm: FormGroup;
  public selectedTransactionId: number | null = null;
  public selectedSerie: any | null = null;
  public selectedMonto: number | null = null;
  private modalRef: NgbModalRef | null = null;
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  @ViewChild(DxDataGridComponent, { static: false })
  dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';

  constructor(
    private moneService: MonederosServices,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private route: Router,
    private permissionsService: NgxPermissionsService,
    private transaccionService: TransaccionesService
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.initForm();
    this.obtenerMonederos();
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  actualizarMonederos(idMonedero: number) {
    this.route.navigateByUrl('/monederos/editar-monedero/' + idMonedero);
  }

  initForm() {
    this.recargaForm = this.fb.group({
      tipoTransaccion: ['RECARGA'],
      monto: [null, [Validators.required]],
      latitud: [null],
      longitud: [null],
      fechaHora: [null],
      numeroSerieMonedero: [null],
      numeroSerieDispositivo: [null],
    });

    this.debitoForm = this.fb.group({
      tipoTransaccion: ['DEBITO'],
      monto: [null, [Validators.required]],
      latitud: [null],
      longitud: [null],
      fechaHora: [null],
      numeroSerieMonedero: [null],
      numeroSerieDispositivo: [null],
    });
  }

  agregarMonedero() {
    this.route.navigateByUrl('/monederos/agregar-monedero');
  }

  obtenerMonederos() {
    this.loading = true;
    this.listaMonederos = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.moneService.obtenerMonederosData(page, take)
          );
          this.loading = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};

          const totalRegistros =
            toNum(meta.total) ?? toNum(resp?.total) ?? rows.length;
          const paginaActual = toNum(meta.page) ?? toNum(resp?.page) ?? page;
          const totalPaginas =
            toNum(meta.lastPage) ??
            toNum(resp?.pages) ??
            Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((item: any) => {
            const nombre = [
              item?.pasajeroNombre,
              item?.pasajeroApellidoPaterno,
              item?.pasajeroApellidoMaterno,
            ]
              .filter(Boolean)
              .join(' ')
              .trim();

            return {
              ...item,
              // Texto de estatus
              estatusTexto:
                item?.estatus === 1
                  ? 'Activo'
                  : item?.estatus === 0
                  ? 'Inactivo'
                  : null,
              // Campo que engloba nombre y fallback
              pasajeroCompleto: nombre || 'sin registro',
            };
          });

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return { data: dataTransformada, totalCount: totalRegistros };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
          return { data: [], totalCount: 0 };
        }
      },
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  }

  onGridOptionChanged(e: any) {
    if (e.fullName !== 'searchPanel.text') return;
    const grid = this.dataGrid?.instance;
    const texto = (e.value ?? '').toString().trim().toLowerCase();
    if (!texto) {
      grid?.option('dataSource', this.listaMonederos);
      this.filtroActivo = '';
      return;
    }
    this.filtroActivo = texto;
    let columnas: any[] = [];
    try {
      const colsOpt = grid?.option('columns');
      if (Array.isArray(colsOpt) && colsOpt.length) columnas = colsOpt;
    } catch {}
    if (!columnas.length && grid?.getVisibleColumns) {
      columnas = grid.getVisibleColumns();
    }
    const dataFields: string[] = columnas
      .map((c: any) => c?.dataField)
      .filter((df: any) => typeof df === 'string' && df.trim().length > 0);
    const normalizar = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (val instanceof Date) {
        const dd = ('0' + val.getDate()).slice(2 - 2);
        const mm = ('0' + (val.getMonth() + 1)).slice(2 - 2);
        const yyyy = val.getFullYear();
        return `${dd}/${mm}/${yyyy}`.toLowerCase();
      }
      if (typeof val === 'number') return String(val).toLowerCase();
      const s = String(val).toLowerCase();
      return s;
    };
    const dataFiltrada = (this.paginaActualData || []).filter((row: any) => {
      const hitEnColumnas = dataFields.some((df) => {
        const v = row?.[df];
        if (df.toLowerCase().includes('fecha')) {
          try {
            const d = new Date(v);
            if (!isNaN(d.getTime())) {
              const dd = ('0' + d.getDate()).slice(-2);
              const mm = ('0' + (d.getMonth() + 1)).slice(-2);
              const yyyy = d.getFullYear();
              const ddmmyyyy = `${dd}/${mm}/${yyyy}`.toLowerCase();
              if (ddmmyyyy.includes(texto)) return true;
            }
          } catch {}
        }
        return normalizar(v).includes(texto);
      });
      const extras = [normalizar(row?.id), normalizar(row?.estatusTexto)];

      return hitEnColumnas || extras.some((s) => s.includes(texto));
    });
    grid?.option('dataSource', dataFiltrada);
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  cerrarModalRecarga() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }

  cerrarModalDebito() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }

  centerModalRecarga(
    centerDataModalRecarga: any,
    id: number,
    numeroSerie: any,
    saldo: any
  ) {
    this.selectedTransactionId = id;
    this.selectedSerie = numeroSerie;
    this.selectedMonto = saldo;
    this.recargaForm.patchValue({
      IdMonedero: this.selectedTransactionId,
    });
    this.modalRef = this.modalService.open(centerDataModalRecarga, {
      centered: true,
      windowClass: 'modal-holder',
      backdrop: 'static',
      keyboard: false,
    });
  }

  centerModalDebito(
    centerDataModalDebito: any,
    id: number,
    numeroSerie: any,
    saldo: any
  ) {
    this.selectedTransactionId = id;
    this.selectedSerie = numeroSerie;
    this.selectedMonto = saldo;
    this.debitoForm.patchValue({
      IdMonedero: this.selectedTransactionId,
    });
    this.modalRef = this.modalService.open(centerDataModalDebito, {
      centered: true,
      windowClass: 'modal-holder',
      backdrop: 'static',
      keyboard: false,
    });
  }

  crearTransaccionRecarga() {
    const serie = (this.selectedSerie ?? '').toString().trim();
    const fechaActual = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    this.recargaForm.patchValue({
      numeroSerieMonedero: serie,
      fechaHora: fechaActual,
    });

    const formValue = this.recargaForm.value;

    if (!formValue?.numeroSerieMonedero) {
      Swal.fire({
        background: '#002136',
        title: '¡Error!',
        text: 'No se detectó el número de serie del monedero.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
      });
      return;
    }
    if (Number(formValue?.monto) <= 0) {
      Swal.fire({
        background: '#002136',
        title: '¡Error!',
        text: 'El monto no puede ser 0 o vacío.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    const payload = {
      idTipoTransaccion: 1,
      monto: Number(
        parseFloat(
          String(formValue.monto).toString().replace(',', '.')
        ).toFixed(2)
      ),
      latitud: null,
      longitud: null,
      fechaHora: formValue?.fechaHora || fechaActual,
      numeroSerieMonedero: formValue?.numeroSerieMonedero || serie,
      numeroSerieDispositivo: null,
    };

    this.loading = true;
    this.submitButton = 'Cargando...';

    this.transaccionService.recargaTransaccion(payload).subscribe(
      (response: any) => {
        this.loading = false;
        this.submitButton = 'Guardar';
        this.ngOnInit();
        this.cerrarModalRecarga();
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se realizó la recarga de manera correcta.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          background: '#002136',
        });
      },
      (err: any) => {
        this.loading = false;
        this.submitButton = 'Guardar';

        let msg = '';
        if (typeof err?.error === 'string' && err.error.trim()) msg = err.error;
        else if (err?.error && typeof err.error === 'object')
          msg =
            err.error.message ||
            err.error.mensaje ||
            err.error.detail ||
            err.error.error ||
            JSON.stringify(err.error);
        else if (typeof err === 'string' && err.trim()) msg = err;
        else if (err?.message) msg = err.message;
        else if (err?.status)
          msg = `HTTP ${err.status}${
            err.statusText ? ' - ' + err.statusText : ''
          }`;
        else msg = 'Error desconocido';

        Swal.fire({
          title: '¡Ops!',
          text: String(msg),
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          background: '#002136',
        });
      }
    );
  }

  crearTransaccionDebito() {
    const serie = (this.selectedSerie ?? '').toString().trim();
    const fechaActual = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

    this.debitoForm.patchValue({
      IdMonedero: this.selectedTransactionId,
      numeroSerieMonedero: serie,
      fechaHora: fechaActual,
      tipoTransaccion: 'DEBITO',
    });

    const formValue = this.debitoForm.value;

    if (!formValue?.numeroSerieMonedero) {
      Swal.fire({
        background: '#002136',
        title: '¡Error!',
        text: 'No se detectó el número de serie del monedero.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
      });
      return;
    }
    if (Number(formValue?.monto) <= 0) {
      Swal.fire({
        background: '#002136',
        title: '¡Error!',
        text: 'El monto no puede ser 0 o vacío.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    const payload = {
      idTipoTransaccion: 2,
      monto: Number(
        parseFloat(
          String(formValue.monto).toString().replace(',', '.')
        ).toFixed(2)
      ),
      latitud: null,
      longitud: null,
      fechaHora: formValue?.fechaHora || fechaActual,
      numeroSerieMonedero: formValue?.numeroSerieMonedero || serie,
      numeroSerieDispositivo: null,
    };

    this.loading = true;
    this.submitButton = 'Cargando...';

    this.transaccionService.debitoTransaccion(payload).subscribe(
      (response: any) => {
        this.loading = false;
        this.submitButton = 'Guardar';
        this.ngOnInit();
        this.cerrarModalDebito();
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se realizó el débito de manera correcta.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          background: '#002136',
        });
      },
      (err: any) => {
        this.loading = false;
        this.submitButton = 'Guardar';

        let msg = '';
        if (typeof err?.error === 'string' && err.error.trim()) msg = err.error;
        else if (err?.error && typeof err.error === 'object')
          msg =
            err.error.message ||
            err.error.mensaje ||
            err.error.detail ||
            err.error.error ||
            JSON.stringify(err.error);
        else if (typeof err === 'string' && err.trim()) msg = err;
        else if (err?.message) msg = err.message;
        else if (err?.status)
          msg = `HTTP ${err.status}${
            err.statusText ? ' - ' + err.statusText : ''
          }`;
        else msg = 'Error desconocido';

        Swal.fire({
          title: '¡Ops!',
          text: String(msg),
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          background: '#002136',
        });
      }
    );
  }
}
