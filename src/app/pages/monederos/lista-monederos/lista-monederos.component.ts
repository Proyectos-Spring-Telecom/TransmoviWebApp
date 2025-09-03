import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
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
  listaMonederos: any[] = [];
  filteredMonederos: any[] = [];
  paginatedMonederos: any[] = [];
  searchTerm: string = '';
  startDate: string = '';
  endDate: string = '';
  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSize: number = 10;
  currentPage: number = 0;
  totalRecords: number = 0;
  totalPages: number = 0;
  isLoading: boolean = false;

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

  constructor(
    private moneService: MonederosServices,
    private modalService: NgbModal,
    private fb: FormBuilder
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
      IdMonedero: [null],
      Monto: [null, [Validators.required]],
      TipoTransaccion: ['Recarga'],
      Latitud: [19.4326],
      Longitud: [-99.1332],
    });

    this.debitoForm = this.fb.group({
      IdMonedero: [null],
      Monto: [null, [Validators.required]],
      TipoTransaccion: ['Debito'],
      Latitud: [19.4326],
      Longitud: [-99.1332],
    });
  }

  obtenerMonederos() {
    this.loading = true;
    this.moneService.obtenerMonederos().subscribe(
      (res: any) => {
        this.listaMonederos = res.monederos.sort((a, b) => b.Id - a.Id);;
        setTimeout(()=> {
          this.loading = false;
        },2000)
      },
      (error) => {
        console.error('Error al obtener monederos:', error);
        this.loading = false;
      }
    );
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
    const formValue = this.recargaForm.value;
    if (formValue.Monto <= 0) {
      Swal.fire({
        title: '¡Error!',
        text: 'El monto no puede ser 0 o vacío.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    this.loading = true;
    this.submitButton = 'Cargando...';

    this.moneService.crearTransaccion(formValue).subscribe(
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
      });
      return;
    }

    this.loading = true;
    this.submitButton = 'Cargando...';

    this.moneService.crearTransaccion(formValue).subscribe(
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
        });
      }
    );
  }
}
