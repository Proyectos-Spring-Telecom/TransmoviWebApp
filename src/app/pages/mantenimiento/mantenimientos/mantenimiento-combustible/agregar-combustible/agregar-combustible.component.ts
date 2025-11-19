import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { CatCombustibleService } from 'src/app/shared/services/cat-combustible.service';
import { InstalacionesService } from 'src/app/shared/services/instalaciones.service';
import { MantenimientoCombustibleService } from 'src/app/shared/services/mat-combustible.service';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-combustible',
  templateUrl: './agregar-combustible.component.html',
  styleUrl: './agregar-combustible.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarCombustibleComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public manCombustibleForm: FormGroup;
  public idManCombustible: number;
  public title = 'Agregar Mantenimiento Combustible';
  public listaClientes: any[] = [];
  public listaInstalaciones: any;
  public listaCombustibles: any;
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private combuService: MantenimientoCombustibleService,
    private activatedRouted: ActivatedRoute,
    private insService: InstalacionesService,
    private route: Router,
    private catCombustible: CatCombustibleService,
    private operService: OperadoresService
  ) {}

  ngOnInit(): void {
    this.obtenerCatCombustible();
    this.obtenerInstalaciones();
    this.initForm();
    this.obtenerOperadores();
    this.activatedRouted.params.subscribe((params) => {
      this.idManCombustible = params['idManCombustible'];
      if (this.idManCombustible) {
        this.title = 'Actualizar Mantenimiento Combustible';
        this.obtenerManCombustible();
      }
    });
  }

  listaOperadores: any[] = [];

  obtenerOperadores() {
    this.operService.obtenerOperadores().subscribe((response: any) => {
      const data = response?.data || response || [];

      this.listaOperadores = data.map((o: any) => ({
        ...o,
        nombreCompleto: [
          o.nombreUsuario,
          o.apellidoPaternoUsuario,
          o.apellidoMaternoUsuario,
        ]
          .filter(Boolean)
          .join(' '),
      }));
    });
  }

  obtenerCatCombustible() {
    this.catCombustible.obtenerCombustibles().subscribe((response) => {
      this.listaCombustibles = response.data;
    });
  }

  displayOperador = (item: any) => {
    if (!item) return '';
    const nombres = [
      item.nombreUsuario,
      item.apellidoPaternoUsuario,
      item.apellidoMaternoUsuario,
    ].filter(Boolean);
    return nombres.join(' ');
  };

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

  obtenerManCombustible() {
  this.combuService
    .obtenerMatCombustible(this.idManCombustible)
    .subscribe((response: any) => {
      const rawData = response?.data
      const data = Array.isArray(rawData) ? rawData[0] : rawData

      if (!data) {
        return
      }

      const idInstalacionRaw =
        data.idInstalacion != null
          ? data.idInstalacion
          : data.instalacion?.id != null
          ? data.instalacion.id
          : null

      const idTipoCombustibleRaw =
        data.idTipoCombustible != null
          ? data.idTipoCombustible
          : data.tipoCombustible?.id != null
          ? data.tipoCombustible.id
          : null

      const idOperadorRaw =
        data.idOperador != null
          ? data.idOperador
          : data.operador?.id != null
          ? data.operador.id
          : null

      this.manCombustibleForm.patchValue({
        idTipoCombustible:
          idTipoCombustibleRaw != null ? Number(idTipoCombustibleRaw) : null,
        cantidadCombustible: data.cantidadCombustible,
        precioCombustible: data.precioCombustible,
        idInstalacion:
          idInstalacionRaw != null ? Number(idInstalacionRaw) : null,
        estatus: data.estatus ?? 1,
        fechaHora: data.fechaHora,
        kilometraje: data.kilometraje,
        idOperador: idOperadorRaw != null ? Number(idOperadorRaw) : null,
      })
    })
}


  initForm() {
    this.manCombustibleForm = this.fb.group({
      idTipoCombustible: [null, Validators.required],
      cantidadCombustible: [null, Validators.required],
      precioCombustible: [null, Validators.required],
      idInstalacion: [null, Validators.required],
      estatus: [1], // por defecto 1
      fechaHora: [null, Validators.required],
      kilometraje: [null, Validators.required],
      idOperador: [null, Validators.required],
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
    if (this.idManCombustible) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.manCombustibleForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        idTipoCombustible: 'Tipo de combustible',
        cantidadCombustible: 'Cantidad de combustible',
        precioCombustible: 'Precio del combustible',
        idInstalacion: 'Instalación',
        fechaHora: 'Fecha y hora',
        kilometraje: 'Kilometraje',
        idOperador: 'Operador',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.manCombustibleForm.controls).forEach((key) => {
        const control = this.manCombustibleForm.get(key);
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

    const formValue = this.manCombustibleForm.value;

    const payload = {
      idTipoCombustible: Number(formValue.idTipoCombustible),
      cantidadCombustible: Number(formValue.cantidadCombustible),
      precioCombustible: this.parseCosto(formValue.precioCombustible),
      idInstalacion: Number(formValue.idInstalacion),
      estatus: Number(formValue.estatus ?? 1),
      fechaHora: formValue.fechaHora,
      kilometraje: Number(formValue.kilometraje),
      idOperador: Number(formValue.idOperador),
    };

    this.combuService.agregarMatCombustible(payload).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo registro de mantenimiento de combustible`,
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
  private formatFechaHora(fechaHora: any): string | null {
  if (!fechaHora) return null;

  if (fechaHora instanceof Date) {
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const y = fechaHora.getFullYear();
    const m = pad(fechaHora.getMonth() + 1);
    const d = pad(fechaHora.getDate());
    const hh = pad(fechaHora.getHours());
    const mm = pad(fechaHora.getMinutes());
    const ss = pad(fechaHora.getSeconds());
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
  }

  const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(fechaHora);
  if (isoLike) return fechaHora;

  const match = fechaHora.match(
    /^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})/
  );
  if (match) {
    const [, dd, MM, yyyy, HH, mm] = match;
    return `${yyyy}-${MM}-${dd}T${HH}:${mm}:00`;
  }

  return fechaHora;
}

actualizar() {
  this.submitButton = 'Cargando...';
  this.loading = true;

  if (this.manCombustibleForm.invalid) {
    this.submitButton = 'Actualizar';
    this.loading = false;

    const etiquetas: any = {
      idTipoCombustible: 'Tipo de combustible',
      cantidadCombustible: 'Cantidad de combustible',
      precioCombustible: 'Precio del combustible',
      idInstalacion: 'Instalación',
      fechaHora: 'Fecha y hora',
      kilometraje: 'Kilometraje',
      idOperador: 'Operador',
    };

    const camposFaltantes: string[] = [];
    Object.keys(this.manCombustibleForm.controls).forEach((key) => {
      const control = this.manCombustibleForm.get(key);
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

  const formValue = this.manCombustibleForm.value;

  const payload = {
    idTipoCombustible: Number(formValue.idTipoCombustible),
    cantidadCombustible: Number(formValue.cantidadCombustible),
    precioCombustible: this.parseCosto(formValue.precioCombustible),
    idInstalacion: Number(formValue.idInstalacion),
    estatus: Number(formValue.estatus ?? 1),
    fechaHora: this.formatFechaHora(formValue.fechaHora),
    kilometraje: Number(formValue.kilometraje),
    idOperador: Number(formValue.idOperador),
  };

  this.combuService
    .actualizarMatCombustible(this.idManCombustible, payload)
    .subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos del registro de mantenimiento de combustible se actualizaron de manera correcta`,
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
