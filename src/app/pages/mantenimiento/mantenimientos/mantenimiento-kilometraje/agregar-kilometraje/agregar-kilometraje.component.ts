import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { InstalacionesService } from 'src/app/shared/services/instalaciones.service';
import { MantenimientoKilometrosService } from 'src/app/shared/services/mat-kilometraje.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-kilometraje',
  templateUrl: './agregar-kilometraje.component.html',
  styleUrl: './agregar-kilometraje.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarKilometrajeComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public manKilometrajeForm: FormGroup;
  public idManKilometraje: number;
  public title = 'Agregar Mantenimiento Kilometraje';
  public listaClientes: any[] = [];
  public listaInstalaciones: any;
  public listaReferenciasServicios: any;
  public listaTalleres: any;
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;
  mesesPeriodo = [
    { value: 1, text: 'Enero' },
    { value: 2, text: 'Febrero' },
    { value: 3, text: 'Marzo' },
    { value: 4, text: 'Abril' },
    { value: 5, text: 'Mayo' },
    { value: 6, text: 'Junio' },
    { value: 7, text: 'Julio' },
    { value: 8, text: 'Agosto' },
    { value: 9, text: 'Septiembre' },
    { value: 10, text: 'Octubre' },
    { value: 11, text: 'Noviembre' },
    { value: 12, text: 'Diciembre' }
  ];

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private manteKiloMe: MantenimientoKilometrosService,
    private activatedRouted: ActivatedRoute,
    private insService: InstalacionesService,
    private route: Router
  ) { }

  ngOnInit(): void {
    this.obtenerInstalaciones();
    this.initForm();
    this.activatedRouted.params.subscribe((params) => {
      this.idManKilometraje = params['idManKilometraje'];
      if (this.idManKilometraje) {
        this.title = 'Actualizar Mantenimiento Kilometraje';
        this.obtenerManKilometraje();
      }
    });
  }

  displayInstalacion = (item: any) => {
    if (!item) return '';
    return `Placa: ${item.placaVehiculo}  |  BlueVox: ${item.numeroSerieBlueVox}  |  Dispositivo: ${item.numeroSerieDispositivo}`;
  };

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  obtenerInstalaciones() {
    this.insService.obtenerInstalaciones().subscribe((response) => {
      this.listaInstalaciones = response.data;
    });
  }

  obtenerManKilometraje() {
    this.manteKiloMe
      .obtenerMatKilometraje(this.idManKilometraje)
      .subscribe((response: any) => {
        const rawData = response?.data;
        const data = Array.isArray(rawData) ? rawData[0] : rawData;

        if (!data) {
          return;
        }

        const idInstalacionRaw =
          data.idInstalacion != null
            ? data.idInstalacion
            : data.instalacion?.id != null
              ? data.instalacion.id
              : null;

        const kmInicialDisplay =
          data.kmInicial != null ? `${data.kmInicial} Km` : null;

        const kmDeseadoDisplay =
          data.kmDeseado != null ? `${data.kmDeseado} Km` : null;

        this.manKilometrajeForm.patchValue({
          idInstalacion:
            idInstalacionRaw != null ? Number(idInstalacionRaw) : null,
          kmInicial: kmInicialDisplay,
          kmDeseado: kmDeseadoDisplay,
          periodo: data.periodo,
          anio: data.anio,
        });
      });
  }

  initForm() {
    this.manKilometrajeForm = this.fb.group({
      idInstalacion: [null, Validators.required],
      kmInicial: [null, Validators.required],
      kmDeseado: [null, Validators.required],
      periodo: [null, Validators.required],
      anio: [null, Validators.required],
    });
  }

  private parseCosto(value: any): number {
    if (value == null) return 0;
    const raw = value.toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    return isNaN(num) ? 0 : num;
  }

  private parseDecimal(value: any): number {
    if (value == null) return 0;
    const raw = value
      .toString()
      .replace(/[^0-9.,-]/g, '')
      .replace(',', '.');
    const num = parseFloat(raw);
    return isNaN(num) ? 0 : num;
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idManKilometraje) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.manKilometrajeForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        idInstalacion: 'Instalación',
        kmInicial: 'Kilometraje inicial',
        kmDeseado: 'Kilometraje deseado',
        periodo: 'Periodo (km)',
        anio: 'Año',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.manKilometrajeForm.controls).forEach((key) => {
        const control = this.manKilometrajeForm.get(key);
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

    const formValue = this.manKilometrajeForm.value;

    const payload = {
      idInstalacion: Number(formValue.idInstalacion),
      kmInicial: this.parseDecimal(formValue.kmInicial),
      kmDeseado: this.parseDecimal(formValue.kmDeseado),
      periodo: Number(formValue.periodo),
      anio: Number(formValue.anio),
    };

    this.manteKiloMe.agregarMatKilometraje(payload).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo registro de mantenimiento de kilometraje.`,
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

    if (this.manKilometrajeForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        idInstalacion: 'Instalación',
        kmInicial: 'Kilometraje inicial',
        kmDeseado: 'Kilometraje deseado',
        periodo: 'Periodo (km)',
        anio: 'Año',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.manKilometrajeForm.controls).forEach((key) => {
        const control = this.manKilometrajeForm.get(key);
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

    const formValue = this.manKilometrajeForm.value;

    const payload = {
      idInstalacion: Number(formValue.idInstalacion),
      kmInicial: this.parseDecimal(formValue.kmInicial),
      kmDeseado: this.parseDecimal(formValue.kmDeseado),
      periodo: Number(formValue.periodo),
      anio: Number(formValue.anio),
    };

    this.manteKiloMe
      .actualizarMatKilometraje(this.idManKilometraje, payload)
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

  onKInicialFocus(): void {
    const c = this.manKilometrajeForm.get('kmInicial');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  }

  onKInicialBlur(): void {
    const c = this.manKilometrajeForm.get('kmInicial');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9.,-]/g, '').replace(',', '.');
    const num = parseFloat(raw);
    if (isNaN(num)) {
      c.setValue('');
      return;
    }
    c.setValue(`${num} Km`);
  }

  onKilometrajeDeseadoFocus(): void {
    const c = this.manKilometrajeForm.get('kmDeseado');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  }

  onKilometrajeDeseadoBlur(): void {
    const c = this.manKilometrajeForm.get('kmDeseado');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9.,-]/g, '').replace(',', '.');
    const num = parseFloat(raw);
    if (isNaN(num)) {
      c.setValue('');
      return;
    }
    c.setValue(`${num} Km`);
  }
}
