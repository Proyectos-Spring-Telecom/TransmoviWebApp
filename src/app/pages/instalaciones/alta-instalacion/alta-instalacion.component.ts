import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged, finalize, forkJoin } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { DispositivoBluevoxService } from 'src/app/shared/services/dispositivobluevox.service';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import { InstalacionesService } from 'src/app/shared/services/instalaciones.service';
import { VehiculosService } from 'src/app/shared/services/vehiculos.service';
import Swal from 'sweetalert2';

enum EstadoComponente {
  INACTIVO = 0,
  DISPONIBLE = 1,
  ASIGNADO = 2,
  EN_MANTENIMIENTO = 3,
  DANADO = 4,
  RETIRADO = 5,
}

@Component({
  selector: 'app-alta-instalacion',
  templateUrl: './alta-instalacion.component.html',
  styleUrl: './alta-instalacion.component.scss',
  animations: [fadeInUpAnimation],
})
export class AltaInstalacionComponent implements OnInit {
  submitButton = 'Guardar';
  loading = false;
  instalacionesForm!: FormGroup;
  idInstalacion!: number;
  title = 'Agregar Instalación';

  loadingDependientes = false;
  listaClientes: any[] = [];
  listaDipositivos: any[] = [];
  listaBlueVox: any[] = [];
  listaVehiculos: any[] = [];
  displayCliente = (c: any) =>
    c ? `${c.nombre || ''} ${c.apellidoPaterno || ''} ${c.apellidoMaterno || ''}`.trim() : '';

  displayDispositivo = (d: any) =>
    d ? (d.numeroSerie || d.numeroSerieDispositivo || d.serie || d.id) : '';

  displayBluevox = (b: any) =>
    b ? (b.numeroSerieBlueVox || b.numeroSerie || b.serie || b.id) : '';

  displayVehiculo = (v: any) =>
    v ? (v.placa || v.placaVehiculo || v.numeroEconomico || v.alias || v.id) : '';


  idClienteUser!: number;
  idRolUser!: number;
  get isAdmin(): boolean {
    return this.idRolUser === 1;
  }

  private bootstrapping = false;
  private lastLoadedCliente: number | null = null;

  private pendingSelecciones: {
    idDispositivo?: number;
    idBlueVox?: number;
    idVehiculo?: number;
  } = {};
  private pendingLabels: {
    dispositivo?: string | null;
    bluevox?: string | null;
    vehiculo?: string | null;
  } = {};

  initialDispositivoId?: number | null;
  initialBlueVoxId?: number | null;

  estatusDispositivoAnterior?: number | null;
  estatusBluevoxsAnterior?: number | null;
  comentariosDispositivo?: string | null;
  comentariosBluevox?: string | null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private instService: InstalacionesService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private dispoService: DispositivosService,
    private blueVoService: DispositivoBluevoxService,
    private vehiService: VehiculosService,
    private clieService: ClientesService,
    private users: AuthenticationService,
    private cdr: ChangeDetectorRef
  ) {
    const user = this.users.getUser();
    this.idClienteUser = Number(user?.idCliente);
    this.idRolUser = Number(user?.rol?.id);
  }

  ngOnInit(): void {
    this.initForm();
    this.suscribirCambioCliente();
    this.suscribirCambioEquipos();
    this.obtenerClientes();

    this.activatedRouted.params.subscribe((params) => {
      this.idInstalacion = Number(params['idInstalacion']);
      if (this.idInstalacion) {
        this.title = 'Actualizar Instalación';
        this.obtenerInstalacion();
        const opts = { emitEvent: false };
        this.instalacionesForm.get('idCliente')?.disable(opts);
        this.instalacionesForm.get('idVehiculo')?.disable(opts);
      }
    });
  }

  private keepEditLocks(): void {
    if (this.idInstalacion) {
      const opts = { emitEvent: false };
      this.instalacionesForm.get('idCliente')?.disable(opts);
      this.instalacionesForm.get('idVehiculo')?.disable(opts);
    }
  }

  initForm(): void {
    this.instalacionesForm = this.fb.group({
      estatus: [1, Validators.required],
      idCliente: [
        this.isAdmin ? null : this.idClienteUser,
        Validators.required,
      ],
      idDispositivo: [{ value: null, disabled: true }, Validators.required],
      idBlueVox: [{ value: null, disabled: true }, Validators.required],
      idVehiculo: [{ value: null, disabled: true }, Validators.required],
    });

    if (!this.isAdmin)
      this.instalacionesForm.get('idCliente')?.disable({ onlySelf: true });
  }

  private toNumOrNull(v: any): number | null {
    return v === undefined || v === null || v === '' || Number.isNaN(Number(v))
      ? null
      : Number(v);
  }

  private pickId(obj: any, keys: string[]): any {
    for (const k of keys)
      if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
    return null;
  }

  private ensureArray(maybe: any): any[] {
    if (Array.isArray(maybe)) return maybe;
    if (Array.isArray(maybe?.data)) return maybe.data;
    if (maybe && typeof maybe === 'object') {
      const vals = Object.values(maybe);
      const firstArr = vals.find((v) => Array.isArray(v));
      if (firstArr) return firstArr as any[];
    }
    return [];
  }

  private normalizeId<T>(
    arr: T[] = [],
    keys: string[] = ['id']
  ): (T & { id: number })[] {
    return (arr || []).map((x: any) => ({
      ...x,
      id: Number(this.pickId(x, keys)),
    }));
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
      this.keepEditLocks();
    }
  }

  private limpiarDependientes(): void {
    const opts = { emitEvent: false };
    this.instalacionesForm.patchValue(
      { idDispositivo: null, idBlueVox: null, idVehiculo: null },
      opts
    );
    this.listaDipositivos = [];
    this.listaBlueVox = [];
    this.listaVehiculos = [];
  }

  private ensureSelectedOptionVisible(
    list: any[],
    selectedId: number | null | undefined,
    displayLabel: string | null | undefined,
    labelField: string
  ): any[] {
    const id = selectedId == null ? null : Number(selectedId);
    if (id == null) return list;
    const exists = list.some((x) => Number(x.id) === id);
    if (!exists) list.unshift({ id, [labelField]: displayLabel || String(id) });
    return list;
  }

  private suscribirCambioCliente(): void {
    this.instalacionesForm
      .get('idCliente')
      ?.valueChanges.pipe(debounceTime(150), distinctUntilChanged())
      .subscribe((idCliente: any) => {
        if (this.bootstrapping) return;
        if (!idCliente) {
          this.limpiarDependientes();
          this.desactivarCamposDependientes(true);
          this.lastLoadedCliente = null;
          return;
        }
        const id = Number(idCliente);
        if (this.lastLoadedCliente === id) return;
        this.cargarListasPorCliente(id, false);
      });
  }

  private suscribirCambioEquipos(): void {
    this.instalacionesForm
      .get('idDispositivo')
      ?.valueChanges.subscribe(async (nuevo: any) => {
        if (this.bootstrapping || !this.idInstalacion) return;
        const prev = this.initialDispositivoId;
        if (prev != null && Number(nuevo) !== Number(prev)) {
          const r = await this.solicitarEstadoYComentarios(
            '¿A qué estado deseas cambiar el dispositivo anterior?'
          );
          if (r) {
            this.estatusDispositivoAnterior = r.estado ?? null;
            this.comentariosDispositivo =
              r.comentarios ?? this.comentariosDispositivo ?? null;
            this.initialDispositivoId = Number(nuevo);
          }
        }
      });

    this.instalacionesForm
      .get('idBlueVox')
      ?.valueChanges.subscribe(async (nuevo: any) => {
        if (this.bootstrapping || !this.idInstalacion) return;
        const prev = this.initialBlueVoxId;
        if (prev != null && Number(nuevo) !== Number(prev)) {
          const r = await this.solicitarEstadoYComentarios(
            '¿A qué estado deseas cambiar el BlueVox anterior?'
          );
          if (r) {
            this.estatusBluevoxsAnterior = r.estado ?? null;
            this.comentariosBluevox =
              r.comentarios ?? this.comentariosBluevox ?? null;
            this.initialBlueVoxId = Number(nuevo);
          }
        }
      });
  }

  private estadoInputOptions(): Record<string, string> {
    return {
      [EstadoComponente.INACTIVO]: 'INACTIVO',
      [EstadoComponente.DISPONIBLE]: 'DISPONIBLE',
      [EstadoComponente.ASIGNADO]: 'ASIGNADO',
      [EstadoComponente.EN_MANTENIMIENTO]: 'EN_MANTENIMIENTO',
      [EstadoComponente.DANADO]: 'DAÑADO',
      [EstadoComponente.RETIRADO]: 'RETIRADO',
    };
  }

  private async solicitarEstadoYComentarios(
    titulo: string
  ): Promise<{ estado: number; comentarios: string | null } | null> {
    const { value: formValues } = await Swal.fire({
      title: titulo,
      html: `
      <div style="text-align:left">
        <label style="display:block;margin:12px 0 6px;font-size:12.5px;font-weight:600;color:#9fb0c3;">
          Selecciona el estado
        </label>
        <select id="estado-select" class="swal2-input" style="height:auto">
          <option value="">-- Selecciona --</option>
          ${Object.entries(this.estadoInputOptions())
            .map(([v, l]) => `<option value="${v}">${l}</option>`)
            .join('')}
        </select>

        <label style="display:block;margin:12px 0 6px;font-size:12.5px;font-weight:600;color:#9fb0c3;">
          Comentarios (opcional)
        </label>
        <input id="comentarios-input" class="swal2-input" placeholder="Escribe comentarios" />
      </div>
    `,
      background: 'transparent',
      color: '#e9eef5',
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      didOpen: () => {
        const popup = Swal.getPopup()!;
        popup.style.background = '#0e1621';
        popup.style.border = '1px solid #213041';
        popup.style.borderRadius = '14px';
        popup.style.padding = '22px';
        popup.style.width = 'min(520px,92vw)';
        popup.style.boxShadow = '0 18px 50px rgba(0,0,0,.45)';

        const styleInput = (el: HTMLElement | null, isSelect = false) => {
          if (!el) return;
          el.style.width = '100%';
          el.style.background = '#0b121b';
          el.style.color = '#e9eef5';
          el.style.border = '1px solid #213041';
          el.style.borderRadius = '10px';
          el.style.padding = '10px 12px';
          el.style.height = isSelect ? '44px' : '44px';
          el.style.transition =
            'border-color .15s ease, box-shadow .15s ease, background .15s ease';
          el.addEventListener('focus', () => {
            el.style.borderColor = '#7aa2ff';
            el.style.boxShadow = '0 0 0 3px rgba(122,162,255,.25)';
            el.style.background = '#0e1521';
          });
          el.addEventListener('blur', () => {
            el.style.borderColor = '#213041';
            el.style.boxShadow = 'none';
            el.style.background = '#0b121b';
          });
        };

        const selectEl = document.getElementById(
          'estado-select'
        ) as HTMLSelectElement | null;
        const inputEl = document.getElementById(
          'comentarios-input'
        ) as HTMLInputElement | null;
        styleInput(selectEl, true);
        styleInput(inputEl, false);

        if (inputEl) {
          inputEl.style.width = '72%';
          inputEl.style.maxWidth = '420px';
          inputEl.style.minWidth = '240px';
          inputEl.style.margin = '0 auto';
          inputEl.style.display = 'block';
        }
      },
      preConfirm: () => {
        const estadoEl = document.getElementById(
          'estado-select'
        ) as HTMLSelectElement | null;
        const comentariosEl = document.getElementById(
          'comentarios-input'
        ) as HTMLInputElement | null;

        const estadoStr = estadoEl?.value ?? '';
        if (!estadoStr) {
          Swal.showValidationMessage('Selecciona un estado');
          return false as any;
        }

        return {
          estado: Number(estadoStr),
          comentarios: (comentariosEl?.value ?? '').trim() || null, // ← puede ir null
        };
      },
    });
    return formValues || null;
  }

  private cargarListasPorCliente(
    idCliente: number,
    applyPending: boolean
  ): void {
    this.loadingDependientes = true;
    this.limpiarDependientes();
    this.desactivarCamposDependientes(true);

    const n = (v: any) => (v == null ? null : Number(v));

    forkJoin({
      dispositivos: this.dispoService.obtenerDispositivosByCliente(idCliente),
      bluevox: this.blueVoService.obtenerDispositivosBlueByCliente(idCliente),
      vehiculos: this.vehiService.obtenerVehiculosByCliente(idCliente),
    })
      .pipe(finalize(() => (this.loadingDependientes = false)))
      .subscribe({
        next: (resp: any) => {
          const devsRaw = this.ensureArray(
            resp?.dispositivos ?? resp?.data?.dispositivos ?? resp?.data
          );
          const bvxRaw = this.ensureArray(
            resp?.bluevox ?? resp?.data?.bluevox ?? resp?.data
          );
          const vehRaw = this.ensureArray(
            resp?.vehiculos ?? resp?.data?.vehiculos ?? resp?.data
          );

          this.listaDipositivos = this.normalizeId(devsRaw, [
            'id',
            'idDispositivo',
            'IdDispositivo',
            'IDDispositivo',
          ]);
          this.listaBlueVox = this.normalizeId(bvxRaw, [
            'id',
            'idBlueVox',
            'IdBlueVox',
            'IDBlueVox',
          ]);
          this.listaVehiculos = this.normalizeId(vehRaw, [
            'id',
            'idVehiculo',
            'IdVehiculo',
            'IDVehiculo',
          ]);

          if (!this.listaDipositivos?.length) this.listaDipositivos = [];
          this.listaDipositivos = this.ensureSelectedOptionVisible(
            this.listaDipositivos,
            this.pendingSelecciones?.idDispositivo,
            this.pendingLabels.dispositivo,
            'numeroSerie'
          );

          if (!this.listaBlueVox?.length) this.listaBlueVox = [];
          this.listaBlueVox = this.ensureSelectedOptionVisible(
            this.listaBlueVox,
            this.pendingSelecciones?.idBlueVox,
            this.pendingLabels.bluevox,
            'numeroSerieBlueVox'
          );

          if (!this.listaVehiculos?.length) this.listaVehiculos = [];
          this.listaVehiculos = this.ensureSelectedOptionVisible(
            this.listaVehiculos,
            this.pendingSelecciones?.idVehiculo,
            this.pendingLabels.vehiculo,
            'placa'
          );

          this.desactivarCamposDependientes(false);

          if (applyPending) {
            const f = this.instalacionesForm;
            f.get('idDispositivo')?.setValue(
              n(this.pendingSelecciones.idDispositivo),
              { emitEvent: false }
            );
            f.get('idBlueVox')?.setValue(n(this.pendingSelecciones.idBlueVox), {
              emitEvent: false,
            });
            f.get('idVehiculo')?.setValue(
              n(this.pendingSelecciones.idVehiculo),
              { emitEvent: false }
            );
            this.pendingSelecciones = {};
          }

          this.lastLoadedCliente = idCliente;
          this.instalacionesForm.updateValueAndValidity({ emitEvent: false });
          this.bootstrapping = false;
          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error('[cargarListasPorCliente] error:', err);

          this.listaDipositivos = this.ensureSelectedOptionVisible(
            [],
            this.pendingSelecciones?.idDispositivo,
            this.pendingLabels.dispositivo,
            'numeroSerie'
          );
          this.listaBlueVox = this.ensureSelectedOptionVisible(
            [],
            this.pendingSelecciones?.idBlueVox,
            this.pendingLabels.bluevox,
            'numeroSerieBlueVox'
          );
          this.listaVehiculos = this.ensureSelectedOptionVisible(
            [],
            this.pendingSelecciones?.idVehiculo,
            this.pendingLabels.vehiculo,
            'placa'
          );

          const f = this.instalacionesForm;
          const n = (v: any) => (v == null ? null : Number(v));
          if (this.pendingSelecciones.idDispositivo != null)
            f.get('idDispositivo')?.setValue(
              n(this.pendingSelecciones.idDispositivo),
              { emitEvent: false }
            );
          if (this.pendingSelecciones.idBlueVox != null)
            f.get('idBlueVox')?.setValue(n(this.pendingSelecciones.idBlueVox), {
              emitEvent: false,
            });
          if (this.pendingSelecciones.idVehiculo != null)
            f.get('idVehiculo')?.setValue(
              n(this.pendingSelecciones.idVehiculo),
              { emitEvent: false }
            );
          this.pendingSelecciones = {};

          this.desactivarCamposDependientes(false);
          this.bootstrapping = false;
          this.instalacionesForm.updateValueAndValidity({ emitEvent: false });
          this.cdr.detectChanges();
        },
      });
  }

  obtenerInstalacion(): void {
    this.bootstrapping = true;
    this.instService
      .obtenerInstalacion(this.idInstalacion)
      .subscribe((response: any) => {
        const raw = Array.isArray(response?.data)
          ? response.data[0]
          : response?.data || {};
        if (!raw) {
          this.bootstrapping = false;
          return;
        }
        const idClienteSrv = this.toNumOrNull(
          raw.idCliente ?? raw?.idCliente2?.id
        );
        const estatus = this.toNumOrNull(raw.estatus) ?? 1;
        const idDispositivo = this.toNumOrNull(
          raw.idDispositivo ?? raw?.dispositivos?.id
        );
        const idBlueVox = this.toNumOrNull(raw.idBlueVox ?? raw?.blueVoxs?.id);
        const idVehiculo = this.toNumOrNull(
          raw.idVehiculo ?? raw?.vehiculos?.id
        );
        this.initialDispositivoId = idDispositivo ?? null;
        this.initialBlueVoxId = idBlueVox ?? null;
        this.pendingLabels = {
          dispositivo: raw?.numeroSerieDispositivo ?? raw?.numeroSerie ?? null,
          bluevox: raw?.numeroSerieBlueVox ?? raw?.numeroSerie ?? null,
          vehiculo:
            raw?.placaVehiculo ??
            raw?.placa ??
            raw?.numeroEconomicoVehiculo ??
            null,
        };
        const idCliente = this.isAdmin ? idClienteSrv : this.idClienteUser;
        this.instalacionesForm.patchValue(
          { idCliente, estatus },
          { emitEvent: false }
        );
        this.pendingSelecciones = { idDispositivo, idBlueVox, idVehiculo };
        if (idCliente) {
          this.cargarListasPorCliente(idCliente, true);
        } else {
          this.listaDipositivos = this.ensureSelectedOptionVisible(
            [],
            idDispositivo,
            this.pendingLabels.dispositivo,
            'numeroSerie'
          );
          this.listaBlueVox = this.ensureSelectedOptionVisible(
            [],
            idBlueVox,
            this.pendingLabels.bluevox,
            'numeroSerieBlueVox'
          );
          this.listaVehiculos = this.ensureSelectedOptionVisible(
            [],
            idVehiculo,
            this.pendingLabels.vehiculo,
            'placa'
          );
          const f = this.instalacionesForm;
          const opts = { emitEvent: false };
          if (idDispositivo != null)
            f.get('idDispositivo')?.patchValue(idDispositivo, opts);
          if (idBlueVox != null)
            f.get('idBlueVox')?.patchValue(idBlueVox, opts);
          if (idVehiculo != null)
            f.get('idVehiculo')?.patchValue(idVehiculo, opts);

          this.desactivarCamposDependientes(false);
          f.updateValueAndValidity({ emitEvent: false });
          this.bootstrapping = false;
          this.cdr.detectChanges();
        }
      });
  }

  obtenerClientes(): void {
    this.clieService.obtenerClientes().subscribe((response: any) => {
      this.listaClientes = this.normalizeId(response?.data);
      if (!this.idInstalacion && !this.isAdmin) {
        this.instalacionesForm
          .get('idCliente')
          ?.setValue(this.idClienteUser, { emitEvent: false });
        this.cargarListasPorCliente(this.idClienteUser, false);
      }
    });
  }

  private getNumericFormPayload() {
    const raw = this.instalacionesForm.getRawValue();
    return {
      estatus: this.toNumOrNull(raw.estatus) ?? 1,
      idCliente: this.toNumOrNull(raw.idCliente) ?? this.idClienteUser,
      idDispositivo: this.toNumOrNull(raw.idDispositivo),
      idBlueVox: this.toNumOrNull(raw.idBlueVox),
      idVehiculo: this.toNumOrNull(raw.idVehiculo),
    };
  }

  submit(): void {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idInstalacion) this.actualizar();
    else this.agregar();
  }

  agregar(): void {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.instalacionesForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        idDispositivo: 'Dispositivo',
        idBlueVox: 'Bluevox',
        idVehiculo: 'Vehículo',
        idCliente: 'Cliente',
      };
      const camposFaltantes: string[] = [];
      Object.keys(this.instalacionesForm.controls).forEach((key) => {
        const control = this.instalacionesForm.get(key);
        if (control?.invalid && control.errors?.['required'])
          camposFaltantes.push(etiquetas[key] || key);
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
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const payload = this.getNumericFormPayload();

    this.instService.agregarInstalacion(payload).subscribe(
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó una nueva instalación de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: 'Ocurrió un error al agregar la instalación',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  actualizar(): void {
    this.submitButton = 'Cargando...';
    this.loading = true;

    const base = this.getNumericFormPayload();

    const payload = {
      ...base,
      estatusDispositivoAnterior: this.estatusDispositivoAnterior ?? null,
      comentariosDispositivo: this.comentariosDispositivo ?? null,
      estatusBluevoxsAnterior: this.estatusBluevoxsAnterior ?? null,
      comentariosBluevox: this.comentariosBluevox ?? null,
    };

    this.instService
      .actualizarInstalacion(this.idInstalacion, payload)
      .subscribe(
        () => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            background: '#002136',
            text: `Los datos de la instalación se actualizaron correctamente.`,
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
          this.regresar();
        },
        () => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Ops!',
            background: '#002136',
            text: `Ocurrió un error al actualizar la instalación.`,
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      );
  }

  compareId = (a: any, b: any) =>
    a != null && b != null && Number(a) === Number(b);
  trackId = (_: number, item: any) => Number(item?.id);

  regresar(): void {
    this.route.navigateByUrl('/instalaciones');
  }
}
