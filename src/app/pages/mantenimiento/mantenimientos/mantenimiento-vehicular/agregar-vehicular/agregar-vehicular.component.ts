import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { CatReferenciaService } from 'src/app/shared/services/cat-referenciaServicio.service';
import { InstalacionesService } from 'src/app/shared/services/instalaciones.service';
import { MantenimientoVehicularService } from 'src/app/shared/services/mat-vehicular.service';
import { TallereService } from 'src/app/shared/services/talleres.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-vehicular',
  templateUrl: './agregar-vehicular.component.html',
  styleUrl: './agregar-vehicular.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarVehicularComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public manVehicularForm: FormGroup;
  public idManVehicular: number;
  public title = 'Agregar Mantenimiento Vehicular';
  public listaClientes: any[] = [];
  public listaInstalaciones: any;
  public listaReferenciasServicios: any;
  public listaTalleres: any;
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private manteVeh: MantenimientoVehicularService,
    private activatedRouted: ActivatedRoute,
    private insService: InstalacionesService,
    private route: Router,
    private refService: CatReferenciaService,
    private talleService: TallereService
  ) {}

  ngOnInit(): void {
    this.obtenerTalleres();
    this.obtenerCatRerenciaServicio();
    this.obtenerInstalaciones();
    this.initForm();
    this.activatedRouted.params.subscribe((params) => {
      this.idManVehicular = params['idManVehicular'];
      if (this.idManVehicular) {
        this.title = 'Actualizar Mantenimiento Vehicular';
        this.obtenerManVehicular();
      }
    });
  }

  displayInstalacion = (item: any) => {
    if (!item) return '';
    return `Placa: ${item.placaVehiculo}  |  BlueVox: ${item.numeroSerieBlueVox}  |  Dispositivo: ${item.numeroSerieDispositivo}`;
  };

  onTarifaFocus(): void {
    const c = this.manVehicularForm.get('costo');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  }

  onTarifaBlur(): void {
    const c = this.manVehicularForm.get('costo');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) {
      c.setValue('');
      return;
    }
    c.setValue(`$${num.toFixed(2)}`);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  obtenerTalleres() {
    this.talleService.obtenerTalleres().subscribe((response) => {
      this.listaTalleres = response;
    });
  }

  obtenerCatRerenciaServicio() {
    this.refService.obtenerReferenciaServicios().subscribe((response) => {
      this.listaReferenciasServicios = response.data;
    });
  }

  obtenerInstalaciones() {
    this.insService.obtenerInstalaciones().subscribe((response) => {
      this.listaInstalaciones = response.data;
    });
  }

  onRangoFechasChange(e: any) {
    const value = e.value || [];
    this.manVehicularForm.patchValue({
      fechaInicio: value[0] || null,
      fechaFinal: value[1] || null,
    });
  }

  private formatearFechaSwagger(date: Date | string | null): string | null {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  obtenerManVehicular() {
    this.manteVeh
      .obtenerMatVehicular(this.idManVehicular)
      .subscribe((response: any) => {
        const idModuloNum =
          response.data?.idModulo != null
            ? Number(response.data.idModulo)
            : response.data?.idModulo2?.id != null
            ? Number(response.data.idModulo2.id)
            : null;

        this.manVehicularForm.patchValue({
          nombre: response.data.nombre,
          descripcion: response.data.descripcion,
          idModulo: idModuloNum,
        });
      });
  }

  initForm() {
    this.manVehicularForm = this.fb.group({
      idInstalacion: [null, Validators.required],
      idReferencia: [null, Validators.required],
      servicioDescripcion: ['', Validators.required],
      notaServicio: ['', Validators.required],
      idEstatus: [1],
      fechaInicio: [null, Validators.required],
      fechaFinal: [null, Validators.required],
      idTaller: [null, Validators.required],
      costo: [null, Validators.required],
      encargado: ['', Validators.required],
    });
  }

  private parseCosto(value: any): number {
    if (value == null) return 0;
    const raw = value.toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    return isNaN(num) ? 0 : num;
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idManVehicular) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.manVehicularForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        idInstalacion: 'Instalación',
        idReferencia: 'Referencia',
        servicioDescripcion: 'Descripción del servicio',
        notaServicio: 'Nota del servicio',
        fechaInicio: 'Fecha inicio',
        fechaFinal: 'Fecha final',
        idTaller: 'Taller',
        costo: 'Costo',
        encargado: 'Encargado',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.manVehicularForm.controls).forEach((key) => {
        const control = this.manVehicularForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, index) => `
          <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                      background: #caa8a8; text-align: center; margin-bottom: 8px;
                      border-radius: 4px;">
            <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
          </div>
        `
        )
        .join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
            <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
              Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
              Por favor complétalos antes de continuar:
            </p>
            <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
          `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-padding swal2-border',
        },
      });
      return;
    }

    const formValue = this.manVehicularForm.value;

    const payload = {
      idInstalacion: Number(formValue.idInstalacion),
      idReferencia: Number(formValue.idReferencia),
      servicioDescripcion: formValue.servicioDescripcion,
      notaServicio: formValue.notaServicio,
      idEstatus: formValue.idEstatus ?? 1,
      fechaInicio: this.formatearFechaSwagger(formValue.fechaInicio),
      fechaFinal: this.formatearFechaSwagger(formValue.fechaFinal),
      idTaller: Number(formValue.idTaller),
      costo: this.parseCosto(formValue.costo),
      encargado: formValue.encargado,
    };

    this.manteVeh.agregarMatVehicular(payload).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo registro de mantenimiento vehicular.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: error.error,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  actualizar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.manVehicularForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        idInstalacion: 'Instalación',
        idReferencia: 'Referencia',
        servicioDescripcion: 'Descripción del servicio',
        notaServicio: 'Nota del servicio',
        fechaInicio: 'Fecha inicio',
        fechaFinal: 'Fecha final',
        idTaller: 'Taller',
        costo: 'Costo',
        encargado: 'Encargado',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.manVehicularForm.controls).forEach((key) => {
        const control = this.manVehicularForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, index) => `
          <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                      background: #caa8a8; text-align: center; margin-bottom: 8px;
                      border-radius: 4px;">
            <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
          </div>
        `
        )
        .join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
            <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
              Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
              Por favor complétalos antes de continuar:
            </p>
            <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
          `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-padding swal2-border',
        },
      });
      return;
    }

    const formValue = this.manVehicularForm.value;

    const payload = {
      idInstalacion: Number(formValue.idInstalacion),
      idReferencia: Number(formValue.idReferencia),
      servicioDescripcion: formValue.servicioDescripcion,
      notaServicio: formValue.notaServicio,
      idEstatus: formValue.idEstatus ?? 1,
      fechaInicio: this.formatearFechaSwagger(formValue.fechaInicio),
      fechaFinal: this.formatearFechaSwagger(formValue.fechaFinal),
      idTaller: Number(formValue.idTaller),
      costo: this.parseCosto(formValue.costo),
      encargado: formValue.encargado,
    };

    this.manteVeh
      .actualizarMatVehicular(this.idManVehicular, payload)
      .subscribe(
        (response) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            background: '#002136',
            text: `Los datos del registro de mantenimiento de kilometraje se actualizaron de manera correcta.`,
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
          this.regresar();
        },
        (error: any) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Ops!',
            background: '#002136',
            text: error.error,
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      );
  }

  regresar() {
    this.route.navigateByUrl('/mantenimientos');
  }
}
