import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
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
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';

  constructor(
    private moneService: MonederosServices,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private route: Router
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.initForm();
    this.obtenerMonederos();
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

  obtenerMonederos() {
    this.loading = true;

    this.listaMonederos = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        // DevExtreme manda estos valores cuando usas remote paging
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.moneService.obtenerMonederosData(page, take)
          );

          this.loading = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];

          // ---- Manejo robusto de la meta de paginación ----
          const meta = resp?.paginated || {};
          const totalRegistros =
            toNum(meta.total) ??
            toNum(resp?.total) ??
            rows.length;

          const paginaActual =
            toNum(meta.page) ??
            toNum(resp?.page) ??
            page;

          const totalPaginas =
            toNum(meta.lastPage) ??
            toNum(resp?.pages) ??
            Math.max(1, Math.ceil(totalRegistros / take));
          // --------------------------------------------------

          const dataTransformada = rows.map((item: any) => ({
            ...item,
            estatusTexto:
              item?.estatus === 1 ? 'Activo' :
                item?.estatus === 0 ? 'Inactivo' : null
          }));

          // Si llevas estos contadores en el componente:
          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros // <- IMPORTANTE para que el grid pagine bien
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
          return { data: [], totalCount: 0 };
        }
      }
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  onGridOptionChanged(e: any) {
    if (e.fullName === "searchPanel.text") {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaMonederos);
        return;
      }
      const search = this.filtroActivo.toString().toLowerCase();
      const dataFiltrada = this.paginaActualData.filter((item: any) => {
        const idStr = item.id ? item.id.toString().toLowerCase() : '';
        const nombreStr = item.nombre ? item.nombre.toString().toLowerCase() : '';
        const descripcionStr = item.descripcion ? item.descripcion.toString().toLowerCase() : '';
        const moduloStr = item.estatusTexto ? item.estatusTexto.toString().toLowerCase() : '';
        return (
          nombreStr.includes(search) ||
          descripcionStr.includes(search) ||
          moduloStr.includes(search) ||
          idStr.includes(search)
        );
      });
      this.dataGrid.instance.option('dataSource', dataFiltrada);
    }
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

  agregarMonederos() {
    this.route.navigateByUrl('/agregarMonedero')
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
    // 1) Inyectar la serie desde el botón
    const serie = (this.selectedSerie ?? '').toString().trim();

    // 2) Obtener la fecha/hora actual en formato ISO con Z
    const fechaActual = new Date().toISOString();

    // 3) Actualizar el form
    this.recargaForm.patchValue({
      numeroSerieMonedero: serie,
      fechaHora: fechaActual
    });

    const formValue = this.recargaForm.value;

    // 4) Validaciones
    if (!formValue?.numeroSerieMonedero) {
      Swal.fire({
        background: '#22252f',
        title: '¡Error!',
        text: 'No se detectó el número de serie del monedero.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    if (formValue?.Monto <= 0) {
      Swal.fire({
        background: '#22252f',
        title: '¡Error!',
        text: 'El monto no puede ser 0 o vacío.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    // 5) Enviar al servicio
    this.loading = true;
    this.submitButton = 'Cargando...';

    this.moneService.agregarTransacciones(formValue).subscribe(
      (response: any) => {
        this.loading = false;
        this.submitButton = 'Guardar';
        this.ngOnInit();

        if (response) {
          this.cerrarModalRecarga();
          Swal.fire({
            title: '¡Operación Exitosa!',
            text: 'Se realizó la recarga de manera correcta.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
            background: '#22252f',
          });
        } else {
          console.log('Respuesta inesperada:', response);
        }
      },
      (error: string) => {
        this.loading = false;
        this.submitButton = 'Guardar';
        Swal.fire({
          title: '¡Ops!',
          text: error,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          background: '#22252f',
        });
      }
    );
  }


  crearTransaccionDebito() {
    const formValue = this.debitoForm.value;
    if (formValue.Monto <= 0) {
      Swal.fire({
        title: '¡Error!',
        text: 'El monto no puede ser 0 o vacío.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
        background: '#22252f',
      });
      return;
    }

    this.loading = true;
    this.submitButton = 'Cargando...';

    this.moneService.actualizarMonedero(formValue).subscribe(
      (response: any) => {
        this.loading = false;
        this.submitButton = 'Guardar';
        this.ngOnInit();
        if (response) {
          this.cerrarModalDebito();
          Swal.fire({
            title: '¡Operación Exitosa!',
            text: 'Se realizó el débito de manera correcta.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
            background: '#22252f',
          });
        } else {
          console.log('Respuesta inesperada:', response);
        }
      },
      (error: string) => {
        this.loading = false;
        this.submitButton = 'Guardar';
        Swal.fire({
          title: '¡Ops!',
          text: error,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          background: '#22252f',
        });
      }
    );
  }
}
