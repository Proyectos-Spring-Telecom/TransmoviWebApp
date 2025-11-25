import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { PasajerosService } from 'src/app/shared/services/pasajeros.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-tipo-pasajero',
  templateUrl: './agregar-tipo-pasajero.component.html',
  styleUrl: './agregar-tipo-pasajero.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarTipoPasajeroComponent {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public tipoPasajeroForm: FormGroup;
  public idTipoPasajero: number;
  public title = 'Agregar Tipo Pasajero';
  public listaClientes: any[] = [];
  public listaTiposDescuentos: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private tipoService: PasajerosService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private clienService: ClientesService,
  ) { }

  ngOnInit(): void {
    this.obtenerClientes();
    this.obtenerTiposDescuentos();
    this.initForm();

    this.tipoPasajeroForm.get('idCatTipoDescuento')?.valueChanges.subscribe(() => {
      this.formatearCantidad();
    });

    this.activatedRouted.params.subscribe((params) => {
      this.idTipoPasajero = params['idTipoPasajero'];
      if (this.idTipoPasajero) {
        this.title = 'Actualizar Tipo Pasajero';
        this.obtenerTipo();
      }
    });
  }

  obtenerTiposDescuentos() {
    this.tipoService.obtenerTipoDescuento().subscribe((response: any) => {
      this.listaTiposDescuentos = (response.data || []).map((x: any) => ({
        ...x,
        idCatTipoDescuento: Number(x.idCatTipoDescuento),
        nombreCatTipoDescuento:
          x.nombreCatTipoDescuento === 'NULO'
            ? 'Sin Descuento'
            : x.nombreCatTipoDescuento === 'MONETARIO'
              ? 'Monetario'
              : x.nombreCatTipoDescuento === 'PORCENTAJE'
                ? 'Porcentaje'
                : x.nombreCatTipoDescuento
      }));
    });
  }

  obtenerClientes() {
    this.clienService.obtenerClientes().subscribe((response: any) => {
      this.listaClientes = (response.data || []).map((x: any) => ({
        ...x,
        id: Number(x.id)
      }));
    });
  }

  obtenerTipo() {
    this.tipoService.obtenerTipoPasajero(this.idTipoPasajero).subscribe(
      (response: any) => {
        const d = Array.isArray(response)
          ? response[0]
          : (Array.isArray(response.data) ? response.data[0] : response.data);

        if (!d) {
          console.log('Sin datos en obtenerTipo', response);
          return;
        }

        const idTipo = Number(d.idCatTipoDescuento);
        const cantidadNum = Number(d.cantidad);

        let cantidadFormateada: string;

        // 1 = Porcentaje, 2 = Monetario, 3 = Ningún Porcentaje
        if (idTipo === 2) {
          cantidadFormateada = `$${cantidadNum.toFixed(2)}`;     // Monetario
        } else if (idTipo === 1) {
          cantidadFormateada = `${cantidadNum} %`;               // Porcentaje
        } else {
          cantidadFormateada = `${cantidadNum}`;                 // Ningún Porcentaje u otros
        }

        this.tipoPasajeroForm.patchValue({
          nombre: d.nombre,
          idCatTipoDescuento: idTipo,
          cantidad: cantidadFormateada,
          idCliente: Number(d.idCliente),
        });
      },
      (error: any) => {
        console.log(error.error || error);
      }
    );
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  formatearCantidad() {
    const tipo = this.tipoPasajeroForm.get('idCatTipoDescuento')?.value;
    const control = this.tipoPasajeroForm.get('cantidad');
    let valor = control?.value;

    if (valor == null || valor === '') {
      return;
    }

    if (typeof valor === 'string') {
      valor = valor.replace(/[^0-9.]/g, '');
    }

    const numero = parseFloat(valor);
    if (isNaN(numero)) {
      control?.setValue('', { emitEvent: false });
      return;
    }

    const tipoObj = this.listaTiposDescuentos.find(
      x => x.idCatTipoDescuento === tipo
    );
    const nombreTipo = tipoObj ? tipoObj.nombreCatTipoDescuento : null;

    if (nombreTipo === 'MONETARIO') {
      control?.setValue(`$${numero.toFixed(2)}`, { emitEvent: false });
    } else if (nombreTipo === 'PORCENTAJE') {
      control?.setValue(`${numero} %`, { emitEvent: false });
    } else {
      control?.setValue(numero.toString(), { emitEvent: false });
    }
  }


  removerFormatoCantidad() {
    const control = this.tipoPasajeroForm.get('cantidad');
    let valor = control?.value;

    if (valor == null || valor === '') {
      return;
    }

    if (typeof valor === 'string') {
      valor = valor.replace(/[^0-9.]/g, '');
    }

    control?.setValue(valor, { emitEvent: false });
  }

  private parseCantidad(value: any): number | null {
    if (value == null || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return value;
    }
    const limpio = value.toString().replace(/[^0-9.]/g, '');
    const num = parseFloat(limpio);
    return isNaN(num) ? null : num;
  }

  private buildPayload(): any {
    const raw = this.tipoPasajeroForm.value;
    return {
      ...raw,
      cantidad: this.parseCantidad(raw.cantidad)
    };
  }

  initForm() {
    this.tipoPasajeroForm = this.fb.group({
      nombre: ['', Validators.required],
      idCatTipoDescuento: [null, Validators.required],
      cantidad: [null, Validators.required],
      idCliente: [null, Validators.required],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idTipoPasajero) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.tipoPasajeroForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        nombre: 'Nombre',
        idCatTipoDescuento: 'Tipo de descuento',
        cantidad: 'Cantidad',
        idCliente: 'Cliente',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.tipoPasajeroForm.controls).forEach((key) => {
        const control = this.tipoPasajeroForm.get(key);
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
          popup: 'swal2-padding swal2-border'
        }
      });
      return;
    }

    this.tipoPasajeroForm.removeControl('id');
    this.tipoService.agregarTipoPasajero(this.buildPayload()).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo tipo de pasajero de manera exitosa.`,
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

    if (this.tipoPasajeroForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        nombre: 'Nombre',
        idCatTipoDescuento: 'Tipo de descuento',
        cantidad: 'Cantidad',
        idCliente: 'Cliente',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.tipoPasajeroForm.controls).forEach((key) => {
        const control = this.tipoPasajeroForm.get(key);
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
          popup: 'swal2-padding swal2-border'
        }
      });
    }

    this.tipoService.actualizarTipoPasajero(
      this.idTipoPasajero,
      this.buildPayload()
    ).subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos del tipo de pasajero se actualizaron correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error) => {
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
    this.route.navigateByUrl('/tipo-pasajero');
  }

}