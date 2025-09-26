import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged, finalize, forkJoin } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { DispositivoBluevoxService } from 'src/app/shared/services/dispositivobluevox.service';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import { InstalacionesService } from 'src/app/shared/services/instalaciones.service';
import { VehiculosService } from 'src/app/shared/services/vehiculos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-instalacion',
  templateUrl: './alta-instalacion.component.html',
  styleUrl: './alta-instalacion.component.scss',
  animations: [fadeInUpAnimation]
})
export class AltaInstalacionComponent implements OnInit {

  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public instalacionesForm: FormGroup;
  public idInstalacion: number;
  public title = 'Agregar Instalación';
  loadingDependientes = false;
  listaClientes: any[] = [];
  listaDipositivos: any[] = [];
  listaBlueVox: any[] = [];
  listaVehiculos: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private instService: InstalacionesService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private dispoService: DispositivosService,
    private blueVoService: DispositivoBluevoxService,
    private vehiService: VehiculosService,
    private clieService: ClientesService
  ) { }

  // --- NUEVO: buffer para restaurar selección en edición ---
  private pendingSelecciones: {
    idDispositivo?: number;
    idBlueVox?: number;
    idVehiculo?: number;
  } = {};

  // --- igual que ya lo tienes ---
  ngOnInit(): void {
    this.initForm();
    this.suscribirCambioCliente();
    this.obtenerClientes();

    this.activatedRouted.params.subscribe(params => {
      this.idInstalacion = params['idInstalacion'];
      if (this.idInstalacion) {
        this.title = 'Actualizar Instalación';
        this.obtenerInstalacion();
      }
    });
  }

  initForm() {
    this.instalacionesForm = this.fb.group({
      estatus: [1, Validators.required],
      idCliente: [null, Validators.required],
      idDispositivo: [{ value: null, disabled: true }, Validators.required],
      idBlueVox: [{ value: null, disabled: true }, Validators.required],
      idVehiculo: [{ value: null, disabled: true }, Validators.required],
    });
  }

  obtenerInstalacion() {
    this.instService.obtenerInstalacion(this.idInstalacion).subscribe((response: any) => {
      const d = response?.data ?? {};
      // 1) SOLO CLIENTE aquí (dispara valueChanges para cargar listas ByCliente)
      this.instalacionesForm.patchValue({
        idCliente: Number(d?.idCliente2?.id ?? null),
        estatus: Number(d?.estatus ?? 1),
      }, { emitEvent: true });

      // 2) Guarda dependientes para aplicarlos cuando lleguen las listas
      this.pendingSelecciones = {
        idDispositivo: Number(d?.dispositivos?.id ?? null),
        idBlueVox: Number(d?.blueVoxs?.id ?? null),
        idVehiculo: Number(d?.vehiculos?.id ?? null),
      };
    });
  }


  private desactivarCamposDependientes(disabled: boolean) {
    if (!this.instalacionesForm) return;
    const opts = { emitEvent: false };
    const idDispositivo = this.instalacionesForm.get('idDispositivo');
    const idBlueVox = this.instalacionesForm.get('idBlueVox');
    const idVehiculo = this.instalacionesForm.get('idVehiculo');

    if (disabled) {
      idDispositivo?.disable(opts);
      idBlueVox?.disable(opts);
      idVehiculo?.disable(opts);
    } else {
      idDispositivo?.enable(opts);
      idBlueVox?.enable(opts);
      idVehiculo?.enable(opts);
    }
  }

  private limpiarDependientes() {
    if (!this.instalacionesForm) return;
    const opts = { emitEvent: false };

    this.instalacionesForm.patchValue({
      idDispositivo: null,
      idBlueVox: null,
      idVehiculo: null
    }, opts);

    this.listaDipositivos = [];
    this.listaBlueVox = [];
    this.listaVehiculos = [];
  }


  // NO CAMBIES tu suscripción; solo asegúrate de que exista el form
  private suscribirCambioCliente() {
    this.instalacionesForm.get('idCliente')?.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged())
      .subscribe((idCliente: any) => {
        if (!idCliente) {
          this.limpiarDependientes();
          this.desactivarCamposDependientes(true);
          return;
        }
        this.cargarListasPorCliente(Number(idCliente));
      });
  }
  private cargarListasPorCliente(idCliente: number) {
    this.loadingDependientes = true;

    // Limpia visualmente mientras carga, pero NO borra el buffer pendingSelecciones
    this.limpiarDependientes();
    this.desactivarCamposDependientes(true);

    forkJoin({
      dispositivos: this.dispoService.obtenerDispositivosByCliente(idCliente),
      bluevox: this.blueVoService.obtenerDispositivosBlueByCliente(idCliente),
      vehiculos: this.vehiService.obtenerVehiculosByCliente(idCliente),
    })
      .pipe(finalize(() => (this.loadingDependientes = false)))
      .subscribe({
        next: (resp: any) => {
          this.listaDipositivos = this.normalizeId(resp?.dispositivos?.data ?? []);
          this.listaBlueVox = this.normalizeId(resp?.bluevox?.data ?? []);
          this.listaVehiculos = this.normalizeId(resp?.vehiculos?.data ?? []);

          // Habilita selects
          this.desactivarCamposDependientes(false);

          // --- NUEVO: si hay valores pendientes (modo edición), re-aplícalos ahora ---
          const p = this.pendingSelecciones || {};
          const opts = { emitEvent: false };

          // Coerción a number y verificación de que existan en las listas (evita valores huérfanos)
          if (p.idDispositivo && this.listaDipositivos.some(x => x.id === p.idDispositivo)) {
            this.instalacionesForm.get('idDispositivo')?.patchValue(p.idDispositivo, opts);
          }
          if (p.idBlueVox && this.listaBlueVox.some(x => x.id === p.idBlueVox)) {
            this.instalacionesForm.get('idBlueVox')?.patchValue(p.idBlueVox, opts);
          }
          if (p.idVehiculo && this.listaVehiculos.some(x => x.id === p.idVehiculo)) {
            this.instalacionesForm.get('idVehiculo')?.patchValue(p.idVehiculo, opts);
          }

          // Limpia el buffer para no re-parchear en cambios futuros
          this.pendingSelecciones = {};
        },
        error: () => {
          this.limpiarDependientes();
          this.desactivarCamposDependientes(true);
        }
      });
  }

  private normalizeId<T extends { id: any }>(arr: T[] = []): (T & { id: number })[] {
    return arr.map((x: any) => ({ ...x, id: Number(x.id) }));
  }

  obtenerClientes() {
    this.clieService.obtenerClientes().subscribe((response: any) => {
      this.listaClientes = this.normalizeId(response?.data);
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idInstalacion) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.instalacionesForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        idDispositivo: 'Dispositivo',
        idBlueVox: 'Bluevox',
        idVehiculo: 'Vehiculo',
        idCliente: 'Cliente',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.instalacionesForm.controls).forEach(key => {
        const control = this.instalacionesForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
            <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                        background: #caa8a8; text-align: center; margin-bottom: 8px;
                        border-radius: 4px;">
              <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
            </div>
          `).join('');

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
    this.instalacionesForm.removeControl('id');
    this.instService.agregarInstalacion(this.instalacionesForm.value).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo módulo de manera exitosa.`,
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
          text: error,
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
    if (this.instalacionesForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        idDispositivo: 'Dispositivo',
        idBlueVox: 'Bluevox',
        idVehiculo: 'Vehiculo',
        idCliente: 'Cliente',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.instalacionesForm.controls).forEach(key => {
        const control = this.instalacionesForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
            <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                        background: #caa8a8; text-align: center; margin-bottom: 8px;
                        border-radius: 4px;">
              <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
            </div>
          `).join('');

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
    this.instService.actualizarInstalacion(this.idInstalacion, this.instalacionesForm.value).subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos del módulo se actualizaron correctamente.`,
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
          text: `Ocurrió un error al actualizar el módulo.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/instalaciones');
  }
}