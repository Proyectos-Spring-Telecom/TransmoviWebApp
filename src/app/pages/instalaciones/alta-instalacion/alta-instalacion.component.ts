import { Component, OnInit, ChangeDetectorRef, HostListener, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { catchError, debounceTime, distinctUntilChanged, finalize, forkJoin, of } from 'rxjs';
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
  showBluevoxDropdown = false;
  @ViewChild('bluevoxModal', { static: false }) bluevoxModal!: TemplateRef<any>;
  bluevoxModalRef?: NgbModalRef;
  searchBluevoxText = '';
  estadoBluevoxAlAbrirModal?: number[];
  restaurandoBluevox = false; // Bandera para evitar que se dispare Swal.fire al restaurar
  displayCliente = (c: any) =>
    c ? `${c.nombre || ''} ${c.apellidoPaterno || ''} ${c.apellidoMaterno || ''}`.trim() : '';

  displayDispositivo = (d: any) =>
    d ? (d.numeroSerie || d.numeroSerieDispositivo || d.serie || d.id) : '';

  displayBluevox = (b: any) =>
    b ? (b.numeroSerieBlueVox || b.numeroSerie || b.serie || '') : '';

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
    idsDispositivos?: number[];
    idDispositivoPrincipal?: number | null;
    idsBlueVoxs?: number[];
    idVehiculo?: number;
  } = {};
  private pendingLabels: {
    dispositivo?: string | null;
    dispositivos?: string | null;
    bluevox?: string | null;
    vehiculo?: string | null;
  } = {};
  private blueVoxsDataFromService: { [key: number]: any } = {}; // Almacenar datos completos de bluevox por ID
  private dispositivosDataFromService: { [key: number]: any } = {};
  private blueVoxsEstatusAnterior: { [key: number]: number } = {}; // Almacenar estatus anterior de cada bluevox por ID
  private ultimoValorBluevox: number[] = []; // Guardar el último valor de idsBlueVoxs antes del cambio
  private ultimoValorDispositivos: number[] = [];

  initialDispositivoIds?: number[] | null;
  initialBlueVoxIds?: number[] | null;
  maxDispositivosEnEdicion?: number | null;
  maxBluevoxEnEdicion?: number | null; // Límite máximo de Bluevox en modo edición (basado en los iniciales)

  @ViewChild('dispositivosModal', { static: false }) dispositivosModal!: TemplateRef<any>;
  dispositivosModalRef?: NgbModalRef;
  searchDispositivosText = '';
  estadoDispositivosAlAbrirModal?: number[];
  /** Principal al abrir el modal (cancelar restaura esto, no el primer ID). */
  estadoPrincipalAlAbrirModal: number | null = null;
  /** Principal guardado al cargar la instalación (restaurar inicio / modal). */
  initialDispositivoPrincipal: number | null = null;
  restaurandoDispositivos = false;

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
        this.submitButton = 'Actualizar';
        this.obtenerInstalacion();
        const opts = { emitEvent: false };
        this.instalacionesForm.get('idCliente')?.disable(opts);
        this.instalacionesForm.get('idVehiculo')?.disable(opts);
      } else {
        this.initialDispositivoPrincipal = null;
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
      idsDispositivos: [{ value: [], disabled: true }, Validators.required],
      idDispositivoPrincipal: [{ value: null, disabled: true }],
      idsBlueVoxs: [{ value: [], disabled: true }, Validators.required],
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
    const idsDispositivos = this.instalacionesForm.get('idsDispositivos');
    const idDispositivoPrincipal = this.instalacionesForm.get('idDispositivoPrincipal');
    const idsBlueVoxs = this.instalacionesForm.get('idsBlueVoxs');
    const idVehiculo = this.instalacionesForm.get('idVehiculo');

    if (disabled) {
      idsDispositivos?.disable(opts);
      idDispositivoPrincipal?.disable(opts);
      idsBlueVoxs?.disable(opts);
      idVehiculo?.disable(opts);
      // Cerrar el dropdown si estaba abierto
      if (this.showBluevoxDropdown) {
        this.showBluevoxDropdown = false;
      }
    } else {
      idsDispositivos?.enable(opts);
      idDispositivoPrincipal?.enable(opts);
      idsBlueVoxs?.enable(opts);
      idVehiculo?.enable(opts);
      this.keepEditLocks();
    }
  }

  private limpiarDependientes(): void {
    const opts = { emitEvent: false };
    this.instalacionesForm.patchValue(
      { idsDispositivos: [], idDispositivoPrincipal: null, idsBlueVoxs: [], idVehiculo: null },
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

    // Suscribirse a cambios en el vehículo para validar cantidadAccesos
    this.instalacionesForm
      .get('idVehiculo')
      ?.valueChanges.pipe(debounceTime(150), distinctUntilChanged())
      .subscribe((idVehiculo: any) => {
        if (this.bootstrapping) return;
        this.validarCantidadAccesos(idVehiculo);
      });
  }

  private validarCantidadAccesos(idVehiculo: any): void {
    const idsBlueVoxsCtrl = this.instalacionesForm.get('idsBlueVoxs');
    const idsDispositivosCtrl = this.instalacionesForm.get('idsDispositivos');
    const idPrincipalCtrl = this.instalacionesForm.get('idDispositivoPrincipal');

    if (!idVehiculo) {
      idsBlueVoxsCtrl?.clearValidators();
      idsBlueVoxsCtrl?.setValidators([Validators.required]);
      idsBlueVoxsCtrl?.setValue([], { emitEvent: false });
      idsBlueVoxsCtrl?.updateValueAndValidity({ emitEvent: false });

      idsDispositivosCtrl?.clearValidators();
      idsDispositivosCtrl?.setValidators([Validators.required]);
      idsDispositivosCtrl?.setValue([], { emitEvent: false });
      idsDispositivosCtrl?.updateValueAndValidity({ emitEvent: false });
      idPrincipalCtrl?.setValue(null, { emitEvent: false });
      idPrincipalCtrl?.updateValueAndValidity({ emitEvent: false });
      this.showBluevoxDropdown = false;
      return;
    }

    // Regla actual: la selección de dispositivos/bluevox es libre y NO depende de cantidadAccesos.
    idsBlueVoxsCtrl?.clearValidators();
    idsBlueVoxsCtrl?.setValidators([Validators.required]);

    idsDispositivosCtrl?.clearValidators();
    idsDispositivosCtrl?.setValidators([Validators.required]);

    idsBlueVoxsCtrl?.updateValueAndValidity({ emitEvent: false });
    idsDispositivosCtrl?.updateValueAndValidity({ emitEvent: false });
    this.syncDispositivoPrincipal();
    idPrincipalCtrl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.detectChanges();
  }

  private maxDispositivosValidator(control: any) {
    if (!control.value || !Array.isArray(control.value)) {
      return { required: true };
    }
    const count = control.value.length;
    if (count === 0) {
      return { required: true };
    }
    const max = this.getCantidadAccesosMax();
    if (max != null && count > max) {
      return { maxDispositivos: true, actual: count, max };
    }
    return null;
  }

  private maxBluevoxValidator(control: any) {
    if (!control.value || !Array.isArray(control.value)) {
      return { required: true };
    }
    const count = control.value.length;
    if (count === 0) {
      return { required: true };
    }
    const max = this.getCantidadAccesosMax();
    if (max != null && count > max) {
      return { maxBluevox: true, actual: count, max };
    }
    return null;
  }

  /** Límite de Bluevox según cantidadAccesos del vehículo seleccionado. */
  getCantidadAccesosMax(): number | null {
    return null;
  }

  tieneLimiteBluevox(): boolean {
    return this.getCantidadAccesosMax() != null;
  }

  requiereExactamenteCuatro(): boolean {
    return this.tieneLimiteBluevox();
  }

  getBluevoxHelpText(): string {
    const selected = this.getSelectedBluevoxCount();
    const max = this.getCantidadAccesosMax();
    if (max != null) {
      return `Hasta ${max} Bluevox (${selected} seleccionado${selected !== 1 ? 's' : ''})`;
    }
    return `${selected} seleccionado${selected !== 1 ? 's' : ''}`;
  }

  getDispositivosHelpText(): string {
    const selected = this.getSelectedDispositivosCount();
    const max = this.getCantidadAccesosMax();
    if (max != null) {
      return `Hasta ${max} dispositivos (${selected} seleccionado${selected !== 1 ? 's' : ''})`;
    }
    return `${selected} seleccionado${selected !== 1 ? 's' : ''}`;
  }

  private syncDispositivoPrincipal(): void {
    const ids = this.instalacionesForm.get('idsDispositivos')?.value || [];
    const principalCtrl = this.instalacionesForm.get('idDispositivoPrincipal');
    if (!Array.isArray(ids) || ids.length === 0) {
      principalCtrl?.setValue(null, { emitEvent: false });
      return;
    }
    const nums = ids.map((x: any) => Number(x)).filter((n: number) => !isNaN(n));
    const current = principalCtrl?.value != null ? Number(principalCtrl.value) : null;
    if (nums.length === 1) {
      if (current != null && nums.includes(current)) {
        return;
      }
      principalCtrl?.setValue(null, { emitEvent: false });
      return;
    }
    if (current == null || !nums.includes(current)) {
      principalCtrl?.setValue(null, { emitEvent: false });
    }
  }

  private suscribirCambioEquipos(): void {
    this.instalacionesForm
      .get('idsDispositivos')
      ?.valueChanges.subscribe(async (nuevos: any) => {
        if (this.restaurandoDispositivos) {
          const nuevosIds = Array.isArray(nuevos)
            ? nuevos.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
            : [];
          this.ultimoValorDispositivos = [...nuevosIds];
          this.syncDispositivoPrincipal();
          return;
        }
        if (this.bootstrapping || !this.idInstalacion) {
          const nuevosIds = Array.isArray(nuevos)
            ? nuevos.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
            : [];
          this.ultimoValorDispositivos = [...nuevosIds];
          this.syncDispositivoPrincipal();
          return;
        }
        const prev = this.initialDispositivoIds || [];
        const nuevosIds = Array.isArray(nuevos)
          ? nuevos.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
          : [];
        const prevIds = Array.isArray(prev)
          ? prev.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
          : [];
        const ultimoValor = Array.isArray(this.ultimoValorDispositivos)
          ? [...this.ultimoValorDispositivos]
          : [];
        if (prevIds.length === 0) {
          this.ultimoValorDispositivos = [...nuevosIds];
          this.syncDispositivoPrincipal();
          return;
        }
        const removidosEnEsteCambio = ultimoValor.filter(
          (idAnterior: number) =>
            prevIds.includes(idAnterior) && !nuevosIds.includes(idAnterior)
        );
        if (removidosEnEsteCambio.length === 0) {
          this.ultimoValorDispositivos = [...nuevosIds];
          this.syncDispositivoPrincipal();
          return;
        }
        const idsSnapshot = [...ultimoValor];
        const principalSnapshot = this.toNumOrNull(
          this.instalacionesForm.get('idDispositivoPrincipal')?.value
        );
        const r = await this.solicitarEstadoYComentarios(
          '¿A qué estado deseas cambiar los dispositivos anteriores?',
          undefined,
          'dispositivo',
          {
            idsDispositivos: idsSnapshot,
            idDispositivoPrincipal: principalSnapshot,
          }
        );
        if (r) {
          this.estatusDispositivoAnterior = r.estado ?? null;
          this.comentariosDispositivo =
            r.comentarios ?? this.comentariosDispositivo ?? null;
          this.cdr.detectChanges();
        }
        this.syncDispositivoPrincipal();
        const curDev = this.instalacionesForm.get('idsDispositivos')?.value || [];
        this.ultimoValorDispositivos = Array.isArray(curDev)
          ? curDev.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
          : [];
      });

    this.instalacionesForm
      .get('idsBlueVoxs')
      ?.valueChanges.subscribe(async (nuevos: any) => {
        // Si estamos restaurando valores, no ejecutar la lógica de Swal.fire
        if (this.restaurandoBluevox) {
          // Actualizar el último valor después de restaurar
          const nuevosIds = Array.isArray(nuevos) ? nuevos.map((id: any) => Number(id)).filter((id: any) => !isNaN(id)) : [];
          this.ultimoValorBluevox = [...nuevosIds];
          return;
        }
        
        if (this.bootstrapping || !this.idInstalacion) {
          // Actualizar el último valor durante bootstrapping
          const nuevosIds = Array.isArray(nuevos) ? nuevos.map((id: any) => Number(id)).filter((id: any) => !isNaN(id)) : [];
          this.ultimoValorBluevox = [...nuevosIds];
          return;
        }
        
        // initialBlueVoxIds son los que estaban al cargar (del GET por ID)
        const prev = this.initialBlueVoxIds || [];
        const nuevosIds = Array.isArray(nuevos) ? nuevos.map((id: any) => Number(id)).filter((id: any) => !isNaN(id)) : [];
        const prevIds = Array.isArray(prev) ? prev.map((id: any) => Number(id)).filter((id: any) => !isNaN(id)) : [];
        const ultimoValor = Array.isArray(this.ultimoValorBluevox) ? [...this.ultimoValorBluevox] : [];
        
        // Si no había bluevox anteriores (nuevo registro), NO mostrar modal
        if (prevIds.length === 0) {
          this.ultimoValorBluevox = [...nuevosIds];
          return;
        }
        
        // CRÍTICO: Solo mostrar modal si se REMOVIÓ un bluevox que estaba en los iniciales
        // Comparar con el último valor para detectar si realmente se removió uno
        const bluevoxRemovidosEnEsteCambio = ultimoValor.filter((idAnterior: number) => {
          // Estaba en el último valor Y está en los iniciales PERO ya NO está en los nuevos
          return prevIds.includes(idAnterior) && !nuevosIds.includes(idAnterior);
        });
        
        // Si NO se removió ningún bluevox inicial en este cambio, NO mostrar modal
        // Esto significa que solo se agregaron nuevos o no hubo cambios relevantes
        if (bluevoxRemovidosEnEsteCambio.length === 0) {
          // Actualizar el último valor y salir sin mostrar modal
          this.ultimoValorBluevox = [...nuevosIds];
          return;
        }
        
        // Hay removidos - obtener datos para mostrar en el modal
        const bluevoxRemovidosData = bluevoxRemovidosEnEsteCambio.map((id: number) => {
          const bv = this.listaBlueVox.find((bv: any) => {
            const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
            return bvId === id;
          });
          return bv ? this.displayBluevox(bv) : `ID: ${id}`;
        });

        const r = await this.solicitarEstadoYComentarios(
          '¿A qué estado deseas cambiar los BlueVox anteriores?',
          bluevoxRemovidosData,
          'bluevox',
          { idsBlueVoxs: [...ultimoValor] }
        );
        if (r) {
          // Si acepta, guardar el estado y comentarios
          // NO actualizar initialBlueVoxIds porque debe mantener los IDs originales del GET por ID
          this.estatusBluevoxsAnterior = r.estado ?? null;
          this.comentariosBluevox =
            r.comentarios ?? this.comentariosBluevox ?? null;
          // Forzar actualización de la vista para que desaparezca el indicador
          this.cdr.detectChanges();
        }
        const curBv = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
        this.ultimoValorBluevox = Array.isArray(curBv)
          ? curBv.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
          : [];
      });
  }

  private estadoInputOptions(): Record<string, string> {
    return {
      [EstadoComponente.INACTIVO]: 'Inactivo',
      [EstadoComponente.DISPONIBLE]: 'Disponible',
      [EstadoComponente.ASIGNADO]: 'Asignado',
      [EstadoComponente.EN_MANTENIMIENTO]: 'En mantenimiento',
      [EstadoComponente.DANADO]: 'Dañado',
      [EstadoComponente.RETIRADO]: 'Retirado',
    };
  }

  private async solicitarEstadoYComentarios(
    titulo: string,
    bluevoxRemovidos?: string[],
    contexto: 'bluevox' | 'dispositivo' = 'bluevox',
    /** Si cierran/cancelan sin confirmar: volver a esta selección (no al GET inicial). */
    restoreIfDismiss?: {
      idsDispositivos?: number[];
      idDispositivoPrincipal?: number | null;
      idsBlueVoxs?: number[];
    }
  ): Promise<{ estado: number; comentarios: string | null } | null> {
    // Ya no mostramos la información de Bluevox removidos aquí, se muestra en el modal de selección

    const result = await Swal.fire({
      title: '',
      html: `
      <div class="estado-modal-container">
        <div class="estado-modal-header">
          <div class="header-icon">
            <i class="fas fa-exchange-alt"></i>
          </div>
          <h3 class="header-title">${titulo}</h3>
          <p class="header-subtitle">Selecciona el nuevo estado y opcionalmente agrega comentarios</p>
        </div>
        
        <div class="estado-modal-body">
          <div class="form-group">
            <label for="estado-select" class="form-label">
              <i class="fas fa-list-ul"></i>
              Estado <span class="required">*</span>
            </label>
            <div class="select-wrapper">
              <select id="estado-select" class="estado-select" required>
                <option value="">Selecciona un estado...</option>
                ${Object.entries(this.estadoInputOptions())
                  .map(([v, l]) => `<option value="${v}">${l}</option>`)
                  .join('')}
              </select>
              <i class="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div class="form-group">
            <label for="comentarios-input" class="form-label">
              <i class="fas fa-comment-alt"></i>
              Comentarios <span class="optional">(opcional)</span>
            </label>
            <textarea 
              id="comentarios-input" 
              class="comentarios-textarea" 
              placeholder="Escribe aquí tus comentarios..."
              rows="4"></textarea>
          </div>
        </div>
      </div>
    `,
      background: 'transparent',
      showCancelButton: true,
      showCloseButton: true,
      allowOutsideClick: true,
      allowEscapeKey: true,
      confirmButtonText: '<i class="fas fa-check me-2"></i>Confirmar',
      cancelButtonText: '<i class="fas fa-undo me-2"></i>Restaurar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6b7280',
      focusConfirm: false,
      customClass: {
        popup: 'estado-swal-popup',
        title: 'estado-swal-title',
        htmlContainer: 'estado-swal-html',
        confirmButton: 'estado-swal-confirm',
        cancelButton: 'estado-swal-cancel',
        actions: 'estado-swal-actions',
      },
      didOpen: () => {
        const popup = Swal.getPopup()!;
        popup.style.background = 'linear-gradient(135deg, #0a1e2e 0%, #0f2838 100%)';
        popup.style.border = '1px solid rgba(96, 165, 250, 0.2)';
        popup.style.borderRadius = '16px';
        popup.style.padding = '0';
        popup.style.width = 'min(600px, 90vw)';
        popup.style.maxWidth = '600px';
        popup.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(96, 165, 250, 0.1)';

        // Estilizar select
        const selectEl = document.getElementById('estado-select') as HTMLSelectElement | null;
        if (selectEl) {
          selectEl.addEventListener('change', function() {
            if (this.value) {
              this.style.borderColor = '#4ade80';
            } else {
              this.style.borderColor = '#414b5f';
            }
          });
        }

        // Estilizar textarea
        const textareaEl = document.getElementById('comentarios-input') as HTMLTextAreaElement | null;
        if (textareaEl) {
          textareaEl.addEventListener('focus', function() {
            this.style.borderColor = '#60a5fa';
            this.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.15)';
          });
          textareaEl.addEventListener('blur', function() {
            this.style.borderColor = '#414b5f';
            this.style.boxShadow = 'none';
          });
        }

        // Agregar estilos inline para los elementos
        const style = document.createElement('style');
        style.textContent = `
          .estado-modal-container {
            width: 100%;
          }
          .estado-modal-header {
            background: linear-gradient(135deg, #1e3a5f 0%, #2a4a6f 100%);
            padding: 28px 32px;
            border-radius: 16px 16px 0 0;
            border-bottom: 2px solid rgba(96, 165, 250, 0.2);
            text-align: center;
          }
          .header-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px;
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px rgba(96, 165, 250, 0.3);
          }
          .header-icon i {
            font-size: 28px;
            color: white;
          }
          .header-title {
            margin: 0 0 8px 0;
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0.3px;
          }
          .header-subtitle {
            margin: 0;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 400;
          }
          .estado-modal-body {
            padding: 32px;
            background: #0a1e2e;
          }
          .form-group {
            margin-bottom: 24px;
          }
          .form-group:last-child {
            margin-bottom: 0;
          }
          .form-label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
            font-size: 14px;
            font-weight: 600;
            color: #e9eef5;
          }
          .form-label i {
            color: #60a5fa;
            font-size: 14px;
          }
          .required {
            color: #ef4444;
          }
          .optional {
            color: rgba(255, 255, 255, 0.5);
            font-weight: 400;
            font-size: 13px;
          }
          .select-wrapper {
            position: relative;
          }
          .estado-select {
            width: 100%;
            background: #1e2832;
            border: 2px solid #414b5f;
            border-radius: 10px;
            padding: 14px 16px;
            padding-right: 45px;
            color: #ffffff;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
          }
          .estado-select:focus {
            outline: none;
            border-color: #60a5fa;
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
            background: #253041;
          }
          .estado-select:invalid {
            border-color: #ef4444;
          }
          .select-arrow {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.5);
            pointer-events: none;
            font-size: 14px;
          }
          .bluevox-removed-info {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
            margin-bottom: 20px;
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.25);
            border-left: 3px solid #fbbf24;
            border-radius: 10px;
          }
          .bluevox-removed-info .info-icon {
            color: #fbbf24;
            font-size: 18px;
            margin-top: 2px;
            flex-shrink: 0;
          }
          .bluevox-removed-info .info-content {
            flex: 1;
          }
          .bluevox-removed-info .info-title {
            margin: 0 0 8px 0;
            font-size: 13px;
            font-weight: 600;
            color: #fcd34d;
          }
          .bluevox-removed-info .bluevox-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 8px;
          }
          .bluevox-removed-info .bluevox-tag {
            display: inline-block;
            padding: 4px 10px;
            background: rgba(251, 191, 36, 0.2);
            border: 1px solid rgba(251, 191, 36, 0.4);
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            color: #fcd34d;
          }
          .bluevox-removed-info .info-note {
            margin: 0;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            font-style: italic;
          }
          .comentarios-textarea {
            width: 100%;
            background: #1e2832;
            border: 2px solid #414b5f;
            border-radius: 10px;
            padding: 14px 16px;
            color: #ffffff;
            font-size: 15px;
            font-family: inherit;
            resize: vertical;
            transition: all 0.2s ease;
            line-height: 1.5;
          }
          .comentarios-textarea::placeholder {
            color: rgba(255, 255, 255, 0.4);
          }
          .comentarios-textarea:focus {
            outline: none;
            border-color: #60a5fa;
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
            background: #253041;
          }
          .estado-swal-actions {
            padding: 20px 32px;
            background: transparent;
            border-top: none;
            border-radius: 0 0 16px 16px;
            gap: 12px;
          }
          .estado-swal-confirm {
            background: #3085d6 !important;
            border: none !important;
            border-radius: 10px !important;
            padding: 12px 24px !important;
            font-weight: 600 !important;
            font-size: 15px !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 4px 12px rgba(48, 133, 214, 0.3) !important;
          }
          .estado-swal-confirm:hover {
            background: #2563eb !important;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(48, 133, 214, 0.4) !important;
          }
          .estado-swal-cancel {
            background: #6b7280 !important;
            border: none !important;
            border-radius: 10px !important;
            padding: 12px 24px !important;
            font-weight: 600 !important;
            font-size: 15px !important;
            transition: all 0.2s ease !important;
          }
          .estado-swal-cancel:hover {
            background: #4b5563 !important;
            transform: translateY(-1px);
          }
        `;
        document.head.appendChild(style);
      },
      preConfirm: () => {
        const estadoEl = document.getElementById(
          'estado-select'
        ) as HTMLSelectElement | null;
        const comentariosEl = document.getElementById(
          'comentarios-input'
        ) as HTMLTextAreaElement | null;

        const estadoStr = estadoEl?.value ?? '';
        if (!estadoStr || estadoStr === '') {
          Swal.showValidationMessage('<i class="fas fa-exclamation-circle"></i> El estado es obligatorio. Por favor, selecciona un estado');
          // Marcar el select como inválido visualmente
          if (estadoEl) {
            estadoEl.style.borderColor = '#ef4444';
            estadoEl.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
            estadoEl.focus();
          }
          return false as any;
        }

        // Validación pasada, restablecer estilos si estaban en error
        if (estadoEl) {
          estadoEl.style.borderColor = '#4ade80';
        }

        return {
          estado: Number(estadoStr),
          comentarios: (comentariosEl?.value ?? '').trim() || null,
        };
      },
    });
    
    // Cerrar sin confirmar (X, Esc, fuera, Restaurar): volver a la selección previa al cambio
    if (result && !result.isConfirmed) {
      if (
        contexto === 'dispositivo' &&
        restoreIfDismiss?.idsDispositivos &&
        restoreIfDismiss.idsDispositivos.length > 0
      ) {
        this.restaurandoDispositivos = true;
        this.instalacionesForm.patchValue(
          {
            idsDispositivos: [...restoreIfDismiss.idsDispositivos],
            idDispositivoPrincipal:
              restoreIfDismiss.idDispositivoPrincipal ?? null,
          },
          { emitEvent: false }
        );
        this.syncDispositivoPrincipal();
        this.instalacionesForm
          .get('idsDispositivos')
          ?.updateValueAndValidity({ emitEvent: false });
        this.instalacionesForm
          .get('idDispositivoPrincipal')
          ?.updateValueAndValidity({ emitEvent: false });
        this.ultimoValorDispositivos = restoreIfDismiss.idsDispositivos.map(
          (id: any) => Number(id)
        );
        this.cdr.detectChanges();
        setTimeout(() => {
          this.restaurandoDispositivos = false;
        }, 100);
      } else if (
        contexto === 'bluevox' &&
        Array.isArray(restoreIfDismiss?.idsBlueVoxs)
      ) {
        this.restaurandoBluevox = true;
        this.instalacionesForm.patchValue(
          { idsBlueVoxs: [...restoreIfDismiss.idsBlueVoxs] },
          { emitEvent: false }
        );
        this.instalacionesForm
          .get('idsBlueVoxs')
          ?.updateValueAndValidity({ emitEvent: false });
        this.ultimoValorBluevox = restoreIfDismiss.idsBlueVoxs.map((id: any) =>
          Number(id)
        );
        this.cdr.detectChanges();
        setTimeout(() => {
          this.restaurandoBluevox = false;
        }, 100);
      } else if (contexto === 'dispositivo') {
        this.restaurarDispositivosAInicial();
      } else {
        this.restaurarBluevox();
      }
      return null;
    }
    
    return result.value || null;
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
      dispositivos: this.dispoService.obtenerDispositivosByClienteInstalacion(idCliente).pipe(
        catchError((err) => {
          console.error('Error al obtener dispositivos:', err);
          return of({ data: [] }); // Retornar estructura vacía si falla
        })
      ),
      bluevox: this.blueVoService.obtenerDispositivosBlueByCliente(idCliente).pipe(
        catchError((err) => {
          console.error('Error al obtener bluevox:', err);
          return of({ data: [] }); // Retornar estructura vacía si falla
        })
      ),
      vehiculos: this.vehiService.obtenerVehiculosByClienteInstalacion(idCliente).pipe(
        catchError((err) => {
          console.error('Error al obtener vehículos:', err);
          return of({ data: [] }); // Retornar estructura vacía si falla
        })
      ),
    })
      .pipe(finalize(() => (this.loadingDependientes = false)))
      .subscribe({
        next: (resp: any) => {
          // Cada servicio devuelve { data: [...] }, con forkJoin accedemos a resp.vehiculos.data
          const devsRaw = Array.isArray(resp?.dispositivos?.data) 
            ? resp.dispositivos.data 
            : Array.isArray(resp?.dispositivos) 
              ? resp.dispositivos 
              : [];
          const bvxRaw = Array.isArray(resp?.bluevox?.data) 
            ? resp.bluevox.data 
            : Array.isArray(resp?.bluevox) 
              ? resp.bluevox 
              : [];
          const vehRaw = Array.isArray(resp?.vehiculos?.data) 
            ? resp.vehiculos.data 
            : Array.isArray(resp?.vehiculos) 
              ? resp.vehiculos 
              : [];

          // Normalizar dispositivos
          this.listaDipositivos = Array.isArray(devsRaw) ? devsRaw.map((d: any) => ({
            ...d,
            id: Number(d?.id ?? d?.idDispositivo ?? d?.IdDispositivo ?? d?.IDDispositivo ?? 0)
          })) : [];

          // Normalizar bluevox - priorizar idBlueVox para que coincida con los IDs de la instalación
          this.listaBlueVox = Array.isArray(bvxRaw) ? bvxRaw.map((b: any) => {
            // Priorizar idBlueVox para que coincida con los IDs extraídos de blueVoxs en obtenerInstalacion
            const normalizedId = Number(b?.idBlueVox ?? b?.id ?? b?.IdBlueVox ?? b?.IDBlueVox ?? 0);
            return {
              ...b,
              id: normalizedId,
              idBlueVox: normalizedId // Asegurar que idBlueVox esté presente
            };
          }) : [];

          // Normalizar vehículos
          this.listaVehiculos = Array.isArray(vehRaw) ? vehRaw.map((v: any) => ({
            ...v,
            id: Number(v?.id ?? v?.idVehiculo ?? v?.IdVehiculo ?? v?.IDVehiculo ?? 0)
          })) : [];

          if (!this.listaDipositivos?.length) this.listaDipositivos = [];
          if (
            applyPending &&
            this.pendingSelecciones.idsDispositivos &&
            Array.isArray(this.pendingSelecciones.idsDispositivos)
          ) {
            this.pendingSelecciones.idsDispositivos.forEach((pendingId: any) => {
              const numPendingId = Number(pendingId);
              const exists = this.listaDipositivos.some((d: any) => {
                const did = Number(d?.id ?? d?.idDispositivo ?? 0);
                return did === numPendingId;
              });
              if (!exists && numPendingId > 0) {
                const dd = this.dispositivosDataFromService[numPendingId];
                if (dd) {
                  this.listaDipositivos.push(dd);
                } else {
                  this.listaDipositivos.push({
                    id: numPendingId,
                    idDispositivo: numPendingId,
                    numeroSerie:
                      this.pendingLabels.dispositivo ||
                      this.pendingLabels.dispositivos ||
                      '',
                  });
                }
              }
            });
          }

          if (!this.listaBlueVox?.length) this.listaBlueVox = [];
          
          // Asegurar que los bluevox seleccionados estén en la lista
          if (applyPending && this.pendingSelecciones.idsBlueVoxs && Array.isArray(this.pendingSelecciones.idsBlueVoxs)) {
            this.pendingSelecciones.idsBlueVoxs.forEach((pendingId: any) => {
              const numPendingId = Number(pendingId);
              const exists = this.listaBlueVox.some((bv: any) => {
                const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
                return bvId === numPendingId;
              });
              if (!exists && numPendingId > 0) {
                // Usar los datos guardados del servicio si están disponibles
                const bvData = this.blueVoxsDataFromService[numPendingId];
                if (bvData) {
                  // Agregar el bluevox con los datos completos del servicio
                  this.listaBlueVox.push(bvData);
                } else {
                  // Si no hay datos del servicio, agregar con estructura mínima (no mostrar ID)
                  this.listaBlueVox.push({
                    id: numPendingId,
                    idBlueVox: numPendingId,
                    numeroSerieBlueVox: '' // No mostrar ID si no hay número de serie
                  });
                }
              }
            });
          }

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
            f.get('idVehiculo')?.setValue(
              n(this.pendingSelecciones.idVehiculo),
              { emitEvent: false }
            );
            if (
              this.pendingSelecciones.idsDispositivos &&
              Array.isArray(this.pendingSelecciones.idsDispositivos) &&
              this.pendingSelecciones.idsDispositivos.length > 0
            ) {
              const normalizedDevIds = this.pendingSelecciones.idsDispositivos
                .map((id: any) => {
                  const numId = n(id);
                  if (numId == null) return null;
                  const found = this.listaDipositivos.find((d: any) => {
                    const did = Number(d?.id ?? d?.idDispositivo ?? 0);
                    return did === numId;
                  });
                  return found ? Number(found.id) : numId;
                })
                .filter((id: any) => id != null) as number[];
              const principal = n(this.pendingSelecciones.idDispositivoPrincipal);
              f.get('idsDispositivos')?.setValue(normalizedDevIds, { emitEvent: false });
              f.get('idDispositivoPrincipal')?.setValue(
                principal != null && normalizedDevIds.includes(principal)
                  ? principal
                  : null,
                { emitEvent: false }
              );
              this.syncDispositivoPrincipal();
              this.ultimoValorDispositivos = [...normalizedDevIds];
            }
            if (this.pendingSelecciones.idsBlueVoxs && Array.isArray(this.pendingSelecciones.idsBlueVoxs) && this.pendingSelecciones.idsBlueVoxs.length > 0) {
              // Normalizar IDs para que coincidan con los IDs de listaBlueVox
              const normalizedIds = this.pendingSelecciones.idsBlueVoxs
                .map((id: any) => {
                  const numId = n(id);
                  if (numId == null) return null;
                  // Buscar en listaBlueVox para obtener el ID normalizado
                  const found = this.listaBlueVox.find((bv: any) => {
                    const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
                    return bvId === numId;
                  });
                  return found ? Number(found.id) : numId;
                })
                .filter((id: any) => id != null);
              
              f.get('idsBlueVoxs')?.setValue(normalizedIds, { emitEvent: false });
              this.ultimoValorBluevox = [...normalizedIds];
              this.cdr.detectChanges();
            }
            this.validarCantidadAccesos(f.get('idVehiculo')?.value);
            this.pendingSelecciones = {};
          }

          this.lastLoadedCliente = idCliente;
          this.instalacionesForm.updateValueAndValidity({ emitEvent: false });
          this.bootstrapping = false;
          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error('[cargarListasPorCliente] error:', err);

          this.listaDipositivos = [];
          if (
            this.pendingSelecciones.idsDispositivos &&
            Array.isArray(this.pendingSelecciones.idsDispositivos)
          ) {
            this.pendingSelecciones.idsDispositivos.forEach((pid: any) => {
              const numId = Number(pid);
              if (!numId) return;
              const dd = this.dispositivosDataFromService[numId];
              this.listaDipositivos.push(
                dd || {
                  id: numId,
                  idDispositivo: numId,
                  numeroSerie: this.pendingLabels.dispositivo || '',
                }
              );
            });
          }

          this.listaVehiculos = this.ensureSelectedOptionVisible(
            [],
            this.pendingSelecciones?.idVehiculo,
            this.pendingLabels.vehiculo,
            'placa'
          );

          const f = this.instalacionesForm;
          const n = (v: any) => (v == null ? null : Number(v));
          if (
            this.pendingSelecciones.idsDispositivos &&
            Array.isArray(this.pendingSelecciones.idsDispositivos) &&
            this.pendingSelecciones.idsDispositivos.length > 0
          ) {
            const pendingDev = this.pendingSelecciones.idsDispositivos
              .map((id: any) => n(id))
              .filter((id: any) => id != null) as number[];
            f.get('idsDispositivos')?.setValue(pendingDev, { emitEvent: false });
            const pr = n(this.pendingSelecciones.idDispositivoPrincipal);
            f.get('idDispositivoPrincipal')?.setValue(
              pr != null && pendingDev.includes(pr) ? pr : null,
              { emitEvent: false }
            );
            this.ultimoValorDispositivos = [...pendingDev];
          }
          if (this.pendingSelecciones.idsBlueVoxs && Array.isArray(this.pendingSelecciones.idsBlueVoxs) && this.pendingSelecciones.idsBlueVoxs.length > 0) {
            const pendingIds = this.pendingSelecciones.idsBlueVoxs.map((id: any) => n(id)).filter((id: any) => id != null);
            f.get('idsBlueVoxs')?.setValue(pendingIds, { emitEvent: false });
            this.ultimoValorBluevox = [...pendingIds];
          }
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

        this.dispositivosDataFromService = {};
        let idsDispositivos: number[] = [];
        let idDispositivoPrincipal: number | null = null;
        if (Array.isArray(raw.dispositivos) && raw.dispositivos.length > 0) {
          idsDispositivos = raw.dispositivos
            .map((d: any) => {
              const devId = this.toNumOrNull(
                d?.idDispositivo ?? d?.id ?? d?.IdDispositivo ?? null
              );
              if (devId != null) {
                this.dispositivosDataFromService[devId] = {
                  ...d,
                  id: devId,
                  idDispositivo: devId,
                };
              }
              return devId;
            })
            .filter((id: any) => id != null) as number[];
          const principalObj = raw.dispositivos.find(
            (d: any) => d?.principal === 1 || d?.principal === true
          );
          idDispositivoPrincipal = this.toNumOrNull(
            raw.idDispositivoPrincipal ??
              principalObj?.idDispositivo ??
              principalObj?.id
          );
          if (
            idDispositivoPrincipal != null &&
            !idsDispositivos.includes(idDispositivoPrincipal)
          ) {
            idDispositivoPrincipal = null;
          }
        } else if (Array.isArray(raw.idsDispositivos) && raw.idsDispositivos.length > 0) {
          idsDispositivos = raw.idsDispositivos
            .map((id: any) => this.toNumOrNull(id))
            .filter((id: any) => id != null) as number[];
          idDispositivoPrincipal = this.toNumOrNull(raw.idDispositivoPrincipal);
          if (
            idDispositivoPrincipal != null &&
            !idsDispositivos.includes(idDispositivoPrincipal)
          ) {
            idDispositivoPrincipal = null;
          }
        } else {
          const idUnico = this.toNumOrNull(
            raw.idDispositivo ?? raw?.dispositivos?.id
          );
          if (idUnico != null) {
            idsDispositivos = [idUnico];
            idDispositivoPrincipal = this.toNumOrNull(raw.idDispositivoPrincipal);
            this.dispositivosDataFromService[idUnico] = {
              id: idUnico,
              idDispositivo: idUnico,
              numeroSerie:
                raw?.numeroSerieDispositivo ?? raw?.numeroSerie ?? '',
            };
          }
        }

        if (
          idDispositivoPrincipal != null &&
          !idsDispositivos.includes(idDispositivoPrincipal)
        ) {
          idDispositivoPrincipal = null;
        }

        // Manejar blueVoxs si viene como array de objetos
        let idsBlueVoxs: number[] = [];
        this.blueVoxsDataFromService = {}; // Limpiar datos previos
        this.blueVoxsEstatusAnterior = {}; // Limpiar estatus anteriores previos
        
        if (Array.isArray(raw.blueVoxs) && raw.blueVoxs.length > 0) {
          // Extraer idBlueVox de cada objeto en el array y guardar los datos completos
          idsBlueVoxs = raw.blueVoxs
            .map((bv: any) => {
              // Priorizar idBlueVox, luego id
              const bvId = this.toNumOrNull(bv?.idBlueVox ?? bv?.id ?? null);
              if (bvId != null) {
                // Guardar los datos completos del bluevox por ID
                this.blueVoxsDataFromService[bvId] = {
                  ...bv,
                  id: bvId,
                  idBlueVox: bvId
                };
                // Guardar el estatus anterior del bluevox (si está disponible)
                // Puede venir como estatus, estatusBluevox, estado, estadoBluevox, etc.
                const estatusAnterior = this.toNumOrNull(
                  bv?.estatus ?? 
                  bv?.estatusBluevox ?? 
                  bv?.estado ?? 
                  bv?.estadoBluevox ?? 
                  bv?.estatusAnterior ??
                  null
                );
                if (estatusAnterior != null) {
                  this.blueVoxsEstatusAnterior[bvId] = estatusAnterior;
                }
              }
              return bvId;
            })
            .filter((id: any) => id != null) as number[];
        } else if (Array.isArray(raw.idsBlueVoxs)) {
          // Fallback: si viene como array de IDs directamente
          idsBlueVoxs = raw.idsBlueVoxs
            .map((id: any) => this.toNumOrNull(id))
            .filter((id: any) => id != null) as number[];
        }
        const idVehiculo = this.toNumOrNull(
          raw.idVehiculo ?? raw?.vehiculos?.id
        );
        this.initialDispositivoIds =
          idsDispositivos.length > 0 ? [...idsDispositivos] : null;
        this.initialDispositivoPrincipal = idDispositivoPrincipal;
        this.initialBlueVoxIds = idsBlueVoxs.length > 0 ? idsBlueVoxs : null;
        this.maxDispositivosEnEdicion =
          idsDispositivos.length > 0 ? idsDispositivos.length : null;
        this.maxBluevoxEnEdicion = idsBlueVoxs.length > 0 ? idsBlueVoxs.length : null;
        this.ultimoValorBluevox = idsBlueVoxs.length > 0 ? [...idsBlueVoxs] : [];
        this.ultimoValorDispositivos =
          idsDispositivos.length > 0 ? [...idsDispositivos] : [];
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
        this.pendingSelecciones = {
          idsDispositivos: idsDispositivos.length > 0 ? idsDispositivos : undefined,
          idDispositivoPrincipal,
          idsBlueVoxs: idsBlueVoxs.length > 0 ? idsBlueVoxs : undefined,
          idVehiculo,
        };
        if (idCliente) {
          this.cargarListasPorCliente(idCliente, true);
        } else {
          this.listaDipositivos = [];
          idsDispositivos.forEach((did) => {
            const dd = this.dispositivosDataFromService[did];
            this.listaDipositivos.push(
              dd || {
                id: did,
                idDispositivo: did,
                numeroSerie: this.pendingLabels.dispositivo || '',
              }
            );
          });
          this.listaVehiculos = this.ensureSelectedOptionVisible(
            [],
            idVehiculo,
            this.pendingLabels.vehiculo,
            'placa'
          );
          const f = this.instalacionesForm;
          const opts = { emitEvent: false };
          if (idsDispositivos.length > 0) {
            f.get('idsDispositivos')?.patchValue([...idsDispositivos], opts);
            f.get('idDispositivoPrincipal')?.patchValue(
              idDispositivoPrincipal,
              opts
            );
            this.syncDispositivoPrincipal();
          }
          if (idsBlueVoxs.length > 0) {
            f.get('idsBlueVoxs')?.patchValue(idsBlueVoxs, opts);
            this.ultimoValorBluevox = [...idsBlueVoxs];
          }
          if (idVehiculo != null)
            f.get('idVehiculo')?.patchValue(idVehiculo, opts);

          this.desactivarCamposDependientes(false);
          this.validarCantidadAccesos(idVehiculo);
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
    const idsDispositivos = Array.isArray(raw.idsDispositivos)
      ? raw.idsDispositivos
          .map((id: any) => this.toNumOrNull(id))
          .filter((id: any) => id != null)
      : [];
    const idDispositivoPrincipal = this.toNumOrNull(raw.idDispositivoPrincipal);
    return {
      estatus: this.toNumOrNull(raw.estatus) ?? 1,
      idCliente: this.toNumOrNull(raw.idCliente) ?? this.idClienteUser,
      idsDispositivos,
      idDispositivoPrincipal:
        idsDispositivos.length === 1
          ? idsDispositivos[0]
          : idDispositivoPrincipal != null &&
              idsDispositivos.includes(idDispositivoPrincipal)
            ? idDispositivoPrincipal
            : null,
      idsBlueVoxs: Array.isArray(raw.idsBlueVoxs)
        ? raw.idsBlueVoxs
            .map((id: any) => this.toNumOrNull(id))
            .filter((id: any) => id != null)
        : [],
      idVehiculo: this.toNumOrNull(raw.idVehiculo),
    };
  }

  /** Con más de un dispositivo debe existir principal explícito. */
  private validarPrincipalDispositivosSiAplica(): boolean {
    const ids = (this.instalacionesForm.get('idsDispositivos')?.value || []) as any[];
    const nums = ids
      .map((x: any) => Number(x))
      .filter((n: number) => !isNaN(n));
    if (nums.length <= 1) return true;
    const pr = this.toNumOrNull(
      this.instalacionesForm.get('idDispositivoPrincipal')?.value
    );
    if (pr == null || !nums.includes(pr)) {
      Swal.fire({
        title: 'Dispositivo principal',
        html: '<p style="color:#e9eef5;text-align:center">Con más de un dispositivo debes elegir <strong>uno</strong> como principal (control dorado en la tarjeta).</p>',
        icon: 'info',
        background: '#002136',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return false;
    }
    return true;
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
        idsDispositivos: 'Dispositivos',
        idsBlueVoxs: 'Bluevox',
        idVehiculo: 'Vehículo',
        idCliente: 'Cliente',
      };
      
      const maxBv = this.getCantidadAccesosMax();
      const camposFaltantes: string[] = [];
      Object.keys(this.instalacionesForm.controls).forEach((key) => {
        const control = this.instalacionesForm.get(key);
        if (control?.invalid) {
          if (control.errors?.['required']) {
            camposFaltantes.push(etiquetas[key] || key);
          } else if (control.errors?.['maxBluevox']) {
            const actual = control.errors['maxBluevox'].actual ?? 0;
            const max = control.errors['maxBluevox'].max ?? maxBv ?? '?';
            camposFaltantes.push(`Bluevox: Solo puedes seleccionar hasta ${max} (tienes ${actual})`);
          } else if (control.errors?.['maxDispositivos']) {
            const actual = control.errors['maxDispositivos'].actual ?? 0;
            const max = control.errors['maxDispositivos'].max ?? maxBv ?? '?';
            camposFaltantes.push(`Dispositivos: Solo puedes seleccionar hasta ${max} (tienes ${actual})`);
          }
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
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    if (!this.validarPrincipalDispositivosSiAplica()) {
      this.submitButton = 'Guardar';
      this.loading = false;
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
      (error: any) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          html: error.error,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  /**
   * Dispositivos que estaban en el GET inicial y ya no están en el formulario.
   * Misma forma que espera el API: { idDispositivo, estatusAnterior }.
   */
  private construirDispositivosAnteriores(): Array<{
    idDispositivo: number;
    estatusAnterior: number;
  }> {
    const initialIds = this.initialDispositivoIds || [];
    const currentIds = this.instalacionesForm.get('idsDispositivos')?.value || [];

    if (!Array.isArray(initialIds) || initialIds.length === 0) {
      return [];
    }

    const currentIdsNum = Array.isArray(currentIds)
      ? currentIds.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
      : [];
    const initialIdsNum = initialIds
      .map((id: any) => Number(id))
      .filter((id: any) => !isNaN(id));

    const removidos = initialIdsNum.filter(
      (id: number) => !currentIdsNum.includes(id)
    );

    if (removidos.length === 0) {
      return [];
    }

    const estatusSeleccionado = this.estatusDispositivoAnterior;
    if (estatusSeleccionado == null || estatusSeleccionado === undefined) {
      console.warn(
        'construirDispositivosAnteriores: estatusDispositivoAnterior es null/undefined.'
      );
      return [];
    }

    return removidos
      .map((idDispositivo: number) => ({
        idDispositivo: Number(idDispositivo),
        estatusAnterior: Number(estatusSeleccionado),
      }))
      .filter(
        (item: any) =>
          item.idDispositivo != null &&
          !isNaN(item.idDispositivo) &&
          item.estatusAnterior != null &&
          !isNaN(item.estatusAnterior)
      );
  }

  /**
   * Construye el array de blueVoxsAnteriores con los bluevox que fueron removidos
   * estatusAnterior es el estado AL QUE SE ESTÁ YENDO (el que seleccionó el usuario)
   * @returns Array de objetos con idBlueVox y estatusAnterior
   */
  private construirBlueVoxsAnteriores(): Array<{ idBlueVox: number; estatusAnterior: number }> {
    // Los IDs iniciales son los que vienen del GET por ID (obtenerInstalacionPorId)
    const initialIds = this.initialBlueVoxIds || [];
    const currentIds = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    
    if (!Array.isArray(initialIds) || initialIds.length === 0) {
      return [];
    }
    
    const currentIdsNum = Array.isArray(currentIds) 
      ? currentIds.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
      : [];
    const initialIdsNum = initialIds.map((id: any) => Number(id)).filter((id: any) => !isNaN(id));
    
    // Encontrar los bluevox que estaban antes (del GET por ID) pero ya no están ahora (removidos)
    const bluevoxRemovidos = initialIdsNum.filter((id: number) => !currentIdsNum.includes(id));
    
    if (bluevoxRemovidos.length === 0) {
      return [];
    }
    
    // El estatusAnterior es el estado AL QUE SE ESTÁ YENDO (el que el usuario seleccionó en el modal Swal)
    const estatusSeleccionado = this.estatusBluevoxsAnterior;
    
    // Si no hay estado seleccionado, no podemos construir el array correctamente
    if (estatusSeleccionado == null || estatusSeleccionado === undefined) {
      console.warn('construirBlueVoxsAnteriores: estatusBluevoxsAnterior es null/undefined. No se puede construir blueVoxsAnteriores.');
      return [];
    }
    
    // Construir el array con idBlueVox (los removidos del GET por ID) y estatusAnterior (el estado seleccionado por el usuario)
    return bluevoxRemovidos
      .map((idBlueVox: number) => {
        return {
          idBlueVox: Number(idBlueVox),
          estatusAnterior: Number(estatusSeleccionado) // El estado AL QUE SE ESTÁ YENDO (seleccionado por el usuario en el modal)
        };
      })
      .filter((item: any) => item.idBlueVox != null && !isNaN(item.idBlueVox) && item.estatusAnterior != null && !isNaN(item.estatusAnterior));
  }

  actualizar(): void {
    this.submitButton = 'Cargando...';
    this.loading = true;

    // Validación: En modo edición, no permitir menos dispositivos que los iniciales
    if (this.idInstalacion && this.maxDispositivosEnEdicion != null) {
      const currentDev = this.instalacionesForm.get('idsDispositivos')?.value || [];
      const selectedDev = Array.isArray(currentDev)
        ? currentDev.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
        : [];
      if (selectedDev.length < this.maxDispositivosEnEdicion) {
        this.submitButton = 'Actualizar';
        this.loading = false;
        const faltantes = this.maxDispositivosEnEdicion - selectedDev.length;
        Swal.fire({
          title: '¡Dispositivos insuficientes!',
          html: `
            <p style="color: #e9eef5; margin-bottom: 12px;">
              Esta instalación tiene <strong style="color: #60a5fa;">${this.maxDispositivosEnEdicion}</strong> dispositivo${this.maxDispositivosEnEdicion !== 1 ? 's' : ''} asignado${this.maxDispositivosEnEdicion !== 1 ? 's' : ''} inicialmente.
            </p>
            <p style="color: #fcd34d; font-weight: 600;">
              Debes seleccionar <strong>${faltantes} dispositivo${faltantes !== 1 ? 's' : ''} más</strong> para completar los ${this.maxDispositivosEnEdicion} requeridos antes de continuar.
            </p>
          `,
          icon: 'warning',
          background: '#002136',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'swal2-padding swal2-border',
            htmlContainer: 'swal2-html-container-custom',
          },
        });
        return;
      }
    }

    // Validación: En modo edición, no permitir menos Bluevox que los iniciales
    if (this.idInstalacion && this.maxBluevoxEnEdicion != null) {
      const currentValue = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
      const selectedIds = Array.isArray(currentValue) ? currentValue.map((id: any) => Number(id)).filter((id: any) => !isNaN(id)) : [];
      
      if (selectedIds.length < this.maxBluevoxEnEdicion) {
        this.submitButton = 'Actualizar';
        this.loading = false;
        const faltantes = this.maxBluevoxEnEdicion - selectedIds.length;
        Swal.fire({
          title: '¡Bluevox Insuficientes!',
          html: `
            <p style="color: #e9eef5; margin-bottom: 12px;">
              Esta instalación tiene <strong style="color: #60a5fa;">${this.maxBluevoxEnEdicion} Bluevox</strong> asignado${this.maxBluevoxEnEdicion !== 1 ? 's' : ''} inicialmente.
            </p>
            <p style="color: #fcd34d; font-weight: 600;">
              Debes seleccionar <strong>${faltantes} Bluevox más</strong> para completar los ${this.maxBluevoxEnEdicion} requeridos antes de continuar.
            </p>
          `,
          icon: 'warning',
          background: '#002136',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'swal2-padding swal2-border',
            htmlContainer: 'swal2-html-container-custom'
          }
        });
        return; // No continuar con la actualización
      }
    }

    if (!this.validarPrincipalDispositivosSiAplica()) {
      this.submitButton = 'Actualizar';
      this.loading = false;
      return;
    }

    const base = this.getNumericFormPayload();

    const dispositivosAnteriores = this.construirDispositivosAnteriores();
    const blueVoxsAnteriores = this.construirBlueVoxsAnteriores();

    const payload: any = {
      idVehiculo: base.idVehiculo,
      idCliente: base.idCliente,
      idsDispositivos: base.idsDispositivos,
      idDispositivoPrincipal: base.idDispositivoPrincipal,
      dispositivosAnteriores,
      comentariosDispositivo: this.comentariosDispositivo ?? null,
      idsBlueVoxs: base.idsBlueVoxs,
      blueVoxsAnteriores,
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
        (error: any) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Ops!',
            background: '#002136',
            html: error.error,
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

  getSelectedDispositivosCount(): number {
    const selected = this.instalacionesForm.get('idsDispositivos')?.value || [];
    return Array.isArray(selected) ? selected.length : 0;
  }

  getDispositivosDisplayText(): string {
    const selected = this.instalacionesForm.get('idsDispositivos')?.value || [];
    if (!Array.isArray(selected) || selected.length === 0) {
      return 'Seleccione dispositivos';
    }
    const labels = selected
      .map((id: number) => {
        const devId = Number(id);
        const d =
          this.listaDipositivos.find(
            (x: any) => Number(x?.id ?? x?.idDispositivo ?? 0) === devId
          ) ?? this.dispositivosDataFromService[devId];
        return d ? this.displayDispositivo(d) : String(devId);
      })
      .filter((s: string) => s && String(s).trim() !== '');
    if (!labels.length) {
      return 'Seleccione dispositivos';
    }
    let base = labels.join(', ');
    const pr = this.toNumOrNull(
      this.instalacionesForm.get('idDispositivoPrincipal')?.value
    );
    if (selected.length > 1 && (pr == null || !selected.map(Number).includes(pr))) {
      base += ' · sin principal';
    }
    return base;
  }

  isDispositivoSelected(id: number): boolean {
    const selected = this.instalacionesForm.get('idsDispositivos')?.value || [];
    if (!Array.isArray(selected) || !selected.length) return false;
    return selected.map((x: any) => Number(x)).includes(Number(id));
  }

  wasDispositivoOriginallyAssigned(id: number): boolean {
    if (!this.idInstalacion || !this.initialDispositivoIds) return false;
    const initial = this.initialDispositivoIds.map((x: any) => Number(x));
    return initial.includes(Number(id));
  }

  /** Principal: todos los chips visibles; inicia apagado; al elegir uno el resto queda bloqueado; clic otra vez en el mismo apaga. */
  clickPrincipalDispositivo(id: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.instalacionesForm.get('idsDispositivos')?.disabled) return;
    if (!this.isDispositivoSelected(id)) return;
    if (this.isPrincipalPillLockedOut(id)) return;
    const cur = this.instalacionesForm.get('idDispositivoPrincipal')?.value;
    const idn = Number(id);
    if (cur != null && Number(cur) === idn) {
      this.instalacionesForm.patchValue(
        { idDispositivoPrincipal: null },
        { emitEvent: false }
      );
    } else {
      this.instalacionesForm.patchValue(
        { idDispositivoPrincipal: idn },
        { emitEvent: false }
      );
    }
    this.instalacionesForm.get('idDispositivoPrincipal')?.updateValueAndValidity({ emitEvent: false });
    this.cdr.detectChanges();
  }

  /** Hay otro dispositivo marcado como principal (esta tarjeta no puede activarse hasta que se apague el otro). */
  isPrincipalPillLockedOut(id: number): boolean {
    if (!this.isDispositivoSelected(id)) return false;
    const p = this.instalacionesForm.get('idDispositivoPrincipal')?.value;
    if (p == null) return false;
    return Number(p) !== Number(id);
  }

  isDispositivoPrincipal(id: number): boolean {
    const p = this.instalacionesForm.get('idDispositivoPrincipal')?.value;
    return p != null && Number(p) === Number(id);
  }

  getFilteredDispositivos(lista: any[]): any[] {
    if (!this.searchDispositivosText || this.searchDispositivosText.trim() === '') {
      return lista;
    }
    const search = this.searchDispositivosText.toLowerCase().trim();
    return lista.filter((d: any) => {
      const did = Number(d?.id ?? d?.idDispositivo ?? 0);
      if (this.isDispositivoSelected(did)) return true;
      const serie = this.displayDispositivo(d).toLowerCase();
      return serie.includes(search);
    });
  }

  toggleDispositivo(id: number, event: any): void {
    const currentValue = this.instalacionesForm.get('idsDispositivos')?.value || [];
    const selectedIds = Array.isArray(currentValue) ? [...currentValue] : [];

    if (event.target.checked) {
      if (
        this.idInstalacion &&
        this.maxDispositivosEnEdicion != null
      ) {
        const esNuevo = !this.wasDispositivoOriginallyAssigned(id);
        if (esNuevo && selectedIds.length >= this.maxDispositivosEnEdicion) {
          event.target.checked = false;
          Swal.fire({
            title: '¡Límite de dispositivos!',
            html: `<p style="color:#e9eef5">No puedes agregar más dispositivos. Solo reemplaza los existentes.</p>`,
            icon: 'warning',
            background: '#002136',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Entendido',
          });
          return;
        }
      }
      if (!selectedIds.map(Number).includes(Number(id))) {
        selectedIds.push(id);
      }
    } else {
      const idx = selectedIds.findIndex((x: any) => Number(x) === Number(id));
      if (idx > -1) selectedIds.splice(idx, 1);
    }

    this.instalacionesForm.patchValue({ idsDispositivos: selectedIds });
    this.syncDispositivoPrincipal();
    this.instalacionesForm.get('idsDispositivos')?.updateValueAndValidity({ emitEvent: false });
    this.instalacionesForm.get('idDispositivoPrincipal')?.updateValueAndValidity({ emitEvent: false });
    this.cdr.detectChanges();
    if (this.dispositivosModalRef) this.cdr.detectChanges();
  }

  abrirModalDispositivos(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.dispositivosModalRef) return;
    const idsCtrl = this.instalacionesForm.get('idsDispositivos');
    if (idsCtrl?.disabled || !this.dispositivosModal) return;
    const currentValue = idsCtrl.value || [];
    this.estadoDispositivosAlAbrirModal = Array.isArray(currentValue)
      ? [...currentValue]
      : [];
    this.estadoPrincipalAlAbrirModal = this.toNumOrNull(
      this.instalacionesForm.get('idDispositivoPrincipal')?.value
    );
    this.ultimoValorDispositivos = Array.isArray(currentValue)
      ? [...currentValue]
      : [];
    this.searchDispositivosText = '';
    this.dispositivosModalRef = this.modalService.open(this.dispositivosModal, {
      size: 'xl',
      windowClass: 'bluevox-modal-custom',
      centered: true,
      backdrop: 'static',
      keyboard: true,
      scrollable: true,
    });
  }

  cerrarModalDispositivos(): void {
    if (this.dispositivosModalRef) {
      this.dispositivosModalRef.close();
      this.dispositivosModalRef = undefined;
    }
    this.searchDispositivosText = '';
  }

  confirmarModalDispositivos(): void {
    if (this.idInstalacion && this.maxDispositivosEnEdicion != null) {
      const currentValue = this.instalacionesForm.get('idsDispositivos')?.value || [];
      const selectedIds = Array.isArray(currentValue)
        ? currentValue.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
        : [];
      if (selectedIds.length < this.maxDispositivosEnEdicion) {
        const faltantes = this.maxDispositivosEnEdicion - selectedIds.length;
        Swal.fire({
          title: '¡Dispositivos insuficientes!',
          html: `<p style="color:#e9eef5">Debes seleccionar <strong>${faltantes}</strong> dispositivo${faltantes !== 1 ? 's' : ''} más.</p>`,
          icon: 'warning',
          background: '#002136',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
        });
        return;
      }
    }
    if (!this.validarPrincipalDispositivosSiAplica()) {
      return;
    }
    const currentValue = this.instalacionesForm.get('idsDispositivos')?.value || [];
    this.ultimoValorDispositivos = Array.isArray(currentValue) ? [...currentValue] : [];
    this.cerrarModalDispositivos();
  }

  cancelarModalDispositivos(): void {
    this.restaurandoDispositivos = true;
    const estadoAlAbrir = this.estadoDispositivosAlAbrirModal || [];
    const ids = estadoAlAbrir.map((x: any) => Number(x)).filter((x: any) => !isNaN(x));
    const pr = this.toNumOrNull(this.estadoPrincipalAlAbrirModal);
    const principalRest =
      pr != null && ids.map(Number).includes(Number(pr)) ? pr : null;
    this.instalacionesForm.patchValue(
      { idsDispositivos: [...ids], idDispositivoPrincipal: principalRest },
      { emitEvent: false }
    );
    this.syncDispositivoPrincipal();
    this.instalacionesForm.get('idsDispositivos')?.updateValueAndValidity({ emitEvent: false });
    this.ultimoValorDispositivos = [...ids];
    this.cdr.detectChanges();
    this.cerrarModalDispositivos();
    setTimeout(() => {
      this.restaurandoDispositivos = false;
    }, 100);
  }

  restaurarDispositivosModal(): void {
    this.restaurandoDispositivos = true;
    const initialIds = this.initialDispositivoIds || [];
    const pr = this.toNumOrNull(this.initialDispositivoPrincipal);
    const principalOk =
      pr != null &&
      initialIds.map((x: any) => Number(x)).includes(Number(pr))
        ? pr
        : null;
    this.instalacionesForm.patchValue(
      {
        idsDispositivos: [...initialIds],
        idDispositivoPrincipal: principalOk,
      },
      { emitEvent: false }
    );
    this.syncDispositivoPrincipal();
    this.instalacionesForm.get('idsDispositivos')?.updateValueAndValidity({ emitEvent: false });
    this.ultimoValorDispositivos = [...initialIds];
    this.cdr.detectChanges();
    setTimeout(() => {
      this.restaurandoDispositivos = false;
    }, 100);
  }

  onCardClickDispositivo(d: any, event: MouseEvent): void {
    if (
      (event.target as HTMLElement).tagName === 'INPUT' ||
      (event.target as HTMLElement).closest('.card-checkbox')
    ) {
      return;
    }
    const idsCtrl = this.instalacionesForm.get('idsDispositivos');
    if (idsCtrl?.disabled) return;
    const did = Number(d?.id ?? d?.idDispositivo ?? 0);
    const checkbox = (event.target as HTMLElement)
      .closest('.bluevox-card')
      ?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (checkbox && !checkbox.disabled) {
      checkbox.checked = !checkbox.checked;
      this.toggleDispositivo(did, { target: checkbox });
    }
  }

  toggleBluevoxDropdown(): void {
    const idsBlueVoxsCtrl = this.instalacionesForm.get('idsBlueVoxs');
    if (idsBlueVoxsCtrl?.disabled) {
      return; // No abrir si está deshabilitado
    }
    // Abrir modal en lugar del dropdown
    this.abrirModalBluevox();
  }

  abrirModalBluevox(event?: MouseEvent): void {
    // Si hay un evento, evitar que se propague
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Si el modal ya está abierto, no abrirlo de nuevo
    if (this.bluevoxModalRef) {
      return;
    }
    
    const idsBlueVoxsCtrl = this.instalacionesForm.get('idsBlueVoxs');
    if (idsBlueVoxsCtrl?.disabled || !this.bluevoxModal) {
      return;
    }
    // Guardar el estado actual antes de abrir el modal
    const currentValue = idsBlueVoxsCtrl.value || [];
    this.estadoBluevoxAlAbrirModal = Array.isArray(currentValue) ? [...currentValue] : [];
    // Actualizar el último valor también al abrir el modal
    this.ultimoValorBluevox = Array.isArray(currentValue) ? [...currentValue] : [];
    
    this.searchBluevoxText = '';
    this.bluevoxModalRef = this.modalService.open(this.bluevoxModal, {
      size: 'xl',
      windowClass: 'bluevox-modal-custom',
      centered: true,
      backdrop: 'static',
      keyboard: true,
      scrollable: true
    });
  }

  cerrarModalBluevox(): void {
    if (this.bluevoxModalRef) {
      this.bluevoxModalRef.close();
      this.bluevoxModalRef = undefined;
    }
    this.searchBluevoxText = '';
  }

  /**
   * Confirma y cierra el modal (mantiene los cambios)
   */
  confirmarModalBluevox(): void {
    // Validación: En modo edición, no permitir menos Bluevox que los iniciales
    if (this.idInstalacion && this.maxBluevoxEnEdicion != null) {
      const currentValue = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
      const selectedIds = Array.isArray(currentValue) ? currentValue.map((id: any) => Number(id)).filter((id: any) => !isNaN(id)) : [];
      
      if (selectedIds.length < this.maxBluevoxEnEdicion) {
        const faltantes = this.maxBluevoxEnEdicion - selectedIds.length;
        Swal.fire({
          title: '¡Bluevox Insuficientes!',
          html: `
            <p style="color: #e9eef5; margin-bottom: 12px;">
              Esta instalación tiene <strong style="color: #60a5fa;">${this.maxBluevoxEnEdicion} Bluevox</strong> asignado${this.maxBluevoxEnEdicion !== 1 ? 's' : ''} inicialmente.
            </p>
            <p style="color: #fcd34d; font-weight: 600;">
              Debes seleccionar <strong>${faltantes} Bluevox más</strong> para completar los ${this.maxBluevoxEnEdicion} requeridos.
            </p>
          `,
          icon: 'warning',
          background: '#002136',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
          customClass: {
            popup: 'swal2-padding swal2-border',
            htmlContainer: 'swal2-html-container-custom'
          }
        });
        return; // No cerrar el modal, mantener los cambios actuales
      }
    }
    
    // Actualizar el último valor con el valor actual al confirmar
    const currentValue = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    this.ultimoValorBluevox = Array.isArray(currentValue) ? [...currentValue] : [];
    this.cerrarModalBluevox();
  }

  /**
   * Cancela el modal y restaura los cambios al estado anterior
   */
  cancelarModalBluevox(): void {
    // Marcar que estamos restaurando para evitar que se dispare el Swal.fire
    this.restaurandoBluevox = true;
    
    // Restaurar al estado antes de abrir el modal
    // Para esto, necesitamos guardar el estado al abrir el modal
    const estadoAlAbrir = this.estadoBluevoxAlAbrirModal || this.initialBlueVoxIds || [];
    const estadoAlAbrirIds = Array.isArray(estadoAlAbrir) 
      ? estadoAlAbrir.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
      : [];
    
    // Restaurar los valores al estado anterior
    this.instalacionesForm.patchValue({ idsBlueVoxs: [...estadoAlAbrirIds] }, { emitEvent: false });
    this.instalacionesForm.get('idsBlueVoxs')?.updateValueAndValidity({ emitEvent: false });
    this.ultimoValorBluevox = [...estadoAlAbrirIds];
    
    // Si cancelamos, limpiar el estado y comentarios de Bluevox si se habían seleccionado
    // porque al cancelar, no queremos que se guarden esos cambios
    this.estatusBluevoxsAnterior = null;
    this.comentariosBluevox = null;
    
    // Actualizar initialBlueVoxIds al estado restaurado para que getBluevoxChangeMessage() no muestre nada
    // Solo si el estado restaurado es diferente del estado inicial
    if (this.idInstalacion && this.estadoBluevoxAlAbrirModal) {
      // Si restauramos al estado del modal, actualizar initialBlueVoxIds para que no haya cambios detectados
      this.initialBlueVoxIds = [...estadoAlAbrirIds];
    }
    
    this.cdr.detectChanges();
    
    // Cerrar el modal
    this.cerrarModalBluevox();
    
    // Restablecer la bandera después de un pequeño delay para asegurar que el valueChanges no se dispare
    setTimeout(() => {
      this.restaurandoBluevox = false;
    }, 100);
  }

  /**
   * Filtra los bluevox según el texto de búsqueda.
   * Los ya seleccionados siempre se muestran, aunque no coincidan con la búsqueda.
   */
  getFilteredBluevox(lista: any[]): any[] {
    if (!this.searchBluevoxText || this.searchBluevoxText.trim() === '') {
      return lista;
    }
    const search = this.searchBluevoxText.toLowerCase().trim();
    return lista.filter((bv: any) => {
      const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
      if (this.isBluevoxSelected(bvId)) return true;
      const serie = this.displayBluevox(bv).toLowerCase();
      return serie.includes(search);
    });
  }

  /**
   * Todos los bluevox que se muestran en el modal (para empty state).
   * Disponibles ya incluye seleccionados; evita duplicar.
   */
  getAllBluevoxForModal(): any[] {
    const existing = this.idInstalacion ? this.getExistingBluevox() : [];
    const available = this.getAvailableBluevox();
    if (this.idInstalacion && existing.length > 0) {
      return [...existing, ...available];
    }
    return available;
  }

  /**
   * Maneja el click en una tarjeta de bluevox en el modal
   */
  onCardClick(bv: any, event: MouseEvent): void {
    // Evitar que se active si se hace click en el checkbox directamente
    if ((event.target as HTMLElement).tagName === 'INPUT' || 
        (event.target as HTMLElement).closest('.card-checkbox')) {
      return;
    }

    const idsBlueVoxsCtrl = this.instalacionesForm.get('idsBlueVoxs');
    if (idsBlueVoxsCtrl?.disabled || this.isBluevoxDisabled(bv.id)) {
      return;
    }

    const checkbox = (event.target as HTMLElement).closest('.bluevox-card')?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (checkbox && !checkbox.disabled) {
      // Invertir el estado del checkbox
      checkbox.checked = !checkbox.checked;
      const syntheticEvent = { target: checkbox } as any;
      this.toggleBluevox(bv.id, syntheticEvent);
    }
  }

  /**
   * Restaura los Bluevox seleccionados al estado inicial cuando se cargó la instalación
   */
  restaurarBluevox(): void {
    const idsBlueVoxsCtrl = this.instalacionesForm.get('idsBlueVoxs');
    if (idsBlueVoxsCtrl?.disabled) {
      return;
    }

    // Marcar que estamos restaurando para evitar que se dispare el Swal.fire
    this.restaurandoBluevox = true;

    // Restaurar al estado inicial
    const initialIds = this.initialBlueVoxIds || [];
    this.instalacionesForm.patchValue({ idsBlueVoxs: [...initialIds] }, { emitEvent: false });
    this.instalacionesForm.get('idsBlueVoxs')?.updateValueAndValidity({ emitEvent: false });
    this.ultimoValorBluevox = [...initialIds];
    
    // Actualizar la vista del modal
    this.cdr.detectChanges();
    
    // Restablecer la bandera después de un pequeño delay
    setTimeout(() => {
      this.restaurandoBluevox = false;
    }, 100);
  }

  /** Restaura dispositivos al estado inicial del GET (cancelar modal de estatus al retirar). */
  private restaurarDispositivosAInicial(): void {
    const idsCtrl = this.instalacionesForm.get('idsDispositivos');
    if (idsCtrl?.disabled) {
      return;
    }
    this.restaurandoDispositivos = true;
    const initialIds = this.initialDispositivoIds || [];
    const ids = initialIds.map((id: any) => Number(id)).filter((id: any) => !isNaN(id));
    const pr = this.toNumOrNull(this.initialDispositivoPrincipal);
    const principalOk =
      pr != null && ids.includes(Number(pr)) ? pr : null;
    this.instalacionesForm.patchValue(
      { idsDispositivos: [...ids], idDispositivoPrincipal: principalOk },
      { emitEvent: false }
    );
    this.syncDispositivoPrincipal();
    this.instalacionesForm.get('idsDispositivos')?.updateValueAndValidity({ emitEvent: false });
    this.instalacionesForm.get('idDispositivoPrincipal')?.updateValueAndValidity({ emitEvent: false });
    this.ultimoValorDispositivos = [...ids];
    this.cdr.detectChanges();
    setTimeout(() => {
      this.restaurandoDispositivos = false;
    }, 100);
  }

  /**
   * Verifica si hay cambios respecto al estado inicial
   */
  tieneCambiosBluevox(): boolean {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      // En modo agregar, siempre hay "cambios" si hay algo seleccionado
      const currentIds = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
      return Array.isArray(currentIds) && currentIds.length > 0;
    }

    const currentIds = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const initialIds = this.initialBlueVoxIds || [];
    
    const currentIdsNum = Array.isArray(currentIds) 
      ? currentIds.map((id: any) => Number(id)).filter((id: any) => !isNaN(id)).sort((a, b) => a - b)
      : [];
    const initialIdsNum = Array.isArray(initialIds)
      ? initialIds.map((id: any) => Number(id)).filter((id: any) => !isNaN(id)).sort((a, b) => a - b)
      : [];

    // Comparar arrays
    if (currentIdsNum.length !== initialIdsNum.length) {
      return true;
    }

    return currentIdsNum.some((id, index) => id !== initialIdsNum[index]);
  }

  isBluevoxSelected(id: number): boolean {
    const selected = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    if (!Array.isArray(selected) || selected.length === 0) {
      return false;
    }
    const selectedIds = selected.map((sid: any) => Number(sid));
    const bvId = Number(id);
    return selectedIds.includes(bvId);
  }

  toggleBluevox(id: number, event: any): void {
    const currentValue = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const selectedIds = Array.isArray(currentValue) ? [...currentValue] : [];
    
    if (event.target.checked) {
      // En modo edición, no se pueden agregar más Bluevox de los iniciales
      if (this.idInstalacion && this.maxBluevoxEnEdicion != null) {
        // Verificar si el Bluevox que se está intentando agregar es nuevo (no estaba en los iniciales)
        const esBluevoxNuevo = !this.wasBluevoxOriginallyAssigned(id);
        
        if (esBluevoxNuevo && selectedIds.length >= this.maxBluevoxEnEdicion) {
          event.target.checked = false;
          Swal.fire({
            title: '¡Límite de Bluevox Alcanzado!',
            html: `
              <p style="color: #e9eef5; margin-bottom: 12px;">
                Esta instalación tiene <strong style="color: #60a5fa;">${this.maxBluevoxEnEdicion} Bluevox</strong> asignado${this.maxBluevoxEnEdicion !== 1 ? 's' : ''} inicialmente.
              </p>
              <p style="color: #e9eef5;">
                No puedes agregar más Bluevox. Solo puedes mantener los mismos o quitar algunos.
              </p>
            `,
            icon: 'warning',
            background: '#002136',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Entendido',
            customClass: {
              popup: 'swal2-padding swal2-border',
              htmlContainer: 'swal2-html-container-custom'
            }
          });
          return;
        }
      }
      
      if (!selectedIds.includes(id)) {
        selectedIds.push(id);
      }
    } else {
      const index = selectedIds.indexOf(id);
      if (index > -1) {
        selectedIds.splice(index, 1);
      }
    }
    
    this.instalacionesForm.patchValue({ idsBlueVoxs: selectedIds });
    this.instalacionesForm.get('idsBlueVoxs')?.updateValueAndValidity({ emitEvent: false });
    this.cdr.detectChanges();
    
    if (this.bluevoxModalRef) {
      this.cdr.detectChanges();
    }
  }

  isBluevoxDisabled(id: number): boolean {
    if (this.instalacionesForm.get('idsBlueVoxs')?.disabled) {
      return true;
    }
    // No deshabilitar por límite: los disponibles siguen visibles; solo se bloquea agregar más en toggleBluevox y se muestra alerta.
    return false;
  }

  getBluevoxDisplayText(): string {
    const selected = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    if (!Array.isArray(selected) || selected.length === 0) {
      return 'Seleccione Bluevox';
    }
    
    // Obtener los bluevox seleccionados y mostrar sus números de serie
    const selectedBluevox = selected
      .map((id: number) => {
        const bvId = Number(id);
        return (
          this.listaBlueVox.find((b: any) => {
            const bId = Number(b?.id ?? b?.idBlueVox ?? 0);
            return bId === bvId;
          }) ?? this.blueVoxsDataFromService[bvId]
        );
      })
      .filter((bv: any) => bv != null)
      .map((bv: any) => this.displayBluevox(bv))
      .filter((serie: string) => serie && serie.trim() !== '');
    
    if (selectedBluevox.length === 0) {
      return 'Seleccione Bluevox';
    }
    
    // SIEMPRE mostrar los números de serie separados por comas
    return selectedBluevox.join(', ');
  }

  /**
   * Obtiene el número de Bluevox originalmente asignados a la instalación
   */
  getInitialBluevoxCount(): number {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return 0;
    }
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
      : [];
    return initialIds.length;
  }

  /**
   * Obtiene la lista de Bluevox originalmente asignados
   */
  getInitialBluevox(): any[] {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return [];
    }
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
      : [];
    
    return this.listaBlueVox.filter((bv: any) => {
      const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
      return initialIds.includes(bvId);
    });
  }

  /**
   * Obtiene el texto de los Bluevox iniciales para mostrar
   */
  getInitialBluevoxDisplayText(): string {
    const initialBluevox = this.getInitialBluevox();
    if (initialBluevox.length === 0) {
      return 'Ninguno asignado';
    }
    if (initialBluevox.length <= 2) {
      return initialBluevox.map((bv: any) => this.displayBluevox(bv)).join(', ');
    }
    return `${initialBluevox.slice(0, 2).map((bv: any) => this.displayBluevox(bv)).join(', ')} y ${initialBluevox.length - 2} más`;
  }

  /**
   * Obtiene los números de serie de los Bluevox que están siendo removidos
   */
  getRemovedBluevoxSerialNumbers(): string[] {
    const removedBluevox = this.getRemovedBluevox();
    return removedBluevox.map((bv: any) => this.displayBluevox(bv)).filter((serie: string) => serie && serie.trim() !== '');
  }

  /**
   * Verifica si hay Bluevox removidos (desmarcados)
   */
  hasRemovedBluevox(): boolean {
    return this.getRemovedBluevox().length > 0;
  }

  /**
   * Verifica si debe mostrar el indicador de Bluevox removidos
   * Solo se muestra si hay removidos Y YA se ha seleccionado un estado para ellos
   */
  shouldShowRemovedBluevoxIndicator(): boolean {
    const hasRemoved = this.hasRemovedBluevox();
    // Solo mostrar si hay removidos Y YA se ha definido el estado (estatusBluevoxsAnterior NO es null/undefined)
    const estadoYaSeleccionado = this.estatusBluevoxsAnterior != null;
    return hasRemoved && estadoYaSeleccionado;
  }

  getSelectedBluevoxCount(): number {
    const selected = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    return Array.isArray(selected) ? selected.length : 0;
  }

  getSelectedBluevox(): any[] {
    const selected = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    if (!Array.isArray(selected) || selected.length === 0 || !this.listaBlueVox || this.listaBlueVox.length === 0) {
      return [];
    }
    const selectedIds = selected.map((id: any) => Number(id));
    return this.listaBlueVox.filter((bv: any) => {
      const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
      return selectedIds.includes(bvId);
    });
  }

  /**
   * Bluevox que se muestran en la lista del modal (Disponibles).
   * Incluye todos los de la lista, también los seleccionados; no se quitan de la vista al marcar.
   * Los seleccionados se muestran con check y badge "Se instalará" / "Se agregará".
   */
  getAvailableBluevox(): any[] {
    const selected = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const selectedIds = Array.isArray(selected) ? selected.map((id: any) => Number(id)) : [];
    const initialIds = Array.isArray(this.initialBlueVoxIds)
      ? this.initialBlueVoxIds.map((id: any) => Number(id))
      : [];
    
    let disponibles: any[] = [];
    if (this.listaBlueVox && this.listaBlueVox.length > 0) {
      if (this.idInstalacion && initialIds.length > 0) {
        // Edición: no iniciales (disponibles + nuevos seleccionados); luego agregamos iniciales deseleccionados
        disponibles = this.listaBlueVox.filter((bv: any) => {
          const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
          return !initialIds.includes(bvId);
        }).map((bv: any) => ({ ...bv }));
      } else {
        // Alta: todos
        disponibles = this.listaBlueVox.map((bv: any) => ({ ...bv }));
      }
    }
    
    if (this.idInstalacion && initialIds.length > 0) {
      const removidos = initialIds.filter((id: number) => !selectedIds.includes(id));
      removidos.forEach((id: number) => {
        if (disponibles.some((bv: any) => Number(bv?.id ?? bv?.idBlueVox ?? 0) === id)) return;
        const bvData = this.blueVoxsDataFromService[id];
        if (bvData) {
          disponibles.push({ ...bvData, id, idBlueVox: id });
        } else {
          const encontrado = this.listaBlueVox?.find((b: any) => Number(b?.id ?? b?.idBlueVox ?? 0) === id);
          disponibles.push(encontrado ? { ...encontrado } : { id, idBlueVox: id, numeroSerieBlueVox: '' });
        }
      });
    }
    
    return disponibles;
  }

  /**
   * Detecta si un bluevox es nuevo (no estaba en los iniciales) o existente
   */
  isBluevoxNew(id: number): boolean {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return false; // En modo agregar, todos son "nuevos"
    }
    const bvId = Number(id);
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id))
      : [];
    return !initialIds.includes(bvId);
  }

  /**
   * Obtiene los bluevox que son nuevos (agregados en esta edición)
   */
  getNewBluevox(): any[] {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return [];
    }
    const current = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const currentIds = Array.isArray(current) ? current.map((id: any) => Number(id)) : [];
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id))
      : [];
    
    // Bluevox nuevos son los que están en current pero no en initial
    const newIds = currentIds.filter((id: number) => !initialIds.includes(id));
    
    return this.listaBlueVox.filter((bv: any) => {
      const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
      return newIds.includes(bvId);
    });
  }

  /**
   * Obtiene los bluevox que fueron removidos (estaban en initial pero no en current)
   */
  getRemovedBluevox(): any[] {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return [];
    }
    const current = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const currentIds = Array.isArray(current) ? current.map((id: any) => Number(id)) : [];
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id))
      : [];
    
    // Bluevox removidos son los que están en initial pero no en current
    const removedIds = initialIds.filter((id: number) => !currentIds.includes(id));
    
    return this.listaBlueVox.filter((bv: any) => {
      const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
      return removedIds.includes(bvId);
    });
  }

  /**
   * Determina el tipo de cambio: 'adding', 'modifying', o 'none'
   */
  getBluevoxChangeType(): 'adding' | 'modifying' | 'none' {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return 'none';
    }
    
    const current = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const currentIds = Array.isArray(current) 
      ? current.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
      : [];
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id)).filter((id: any) => !isNaN(id))
      : [];
    
    if (currentIds.length === 0 && initialIds.length === 0) {
      return 'none';
    }
    
    // Verificar si todos los iniciales están presentes
    const todosInicialesEstan = initialIds.every((id: number) => currentIds.includes(id));
    const hayRemovidos = !todosInicialesEstan;
    const hayNuevos = currentIds.some((id: number) => !initialIds.includes(id));
    
    if (hayRemovidos) {
      return 'modifying'; // Se removió al menos uno = modificación/reemplazo
    } else if (hayNuevos && todosInicialesEstan) {
      return 'adding'; // Se agregaron nuevos pero no se removieron = adición
    }
    
    return 'none';
  }

  /**
   * Obtiene el mensaje descriptivo del tipo de cambio
   */
  getBluevoxChangeMessage(): string {
    if (!this.idInstalacion) {
      return '';
    }
    
    const changeType = this.getBluevoxChangeType();
    const newBluevox = this.getNewBluevox();
    const removedBluevox = this.getRemovedBluevox();
    const maxAllowed = this.getCantidadAccesosMax();
    
    if (changeType === 'none') {
      return '';
    }
    
    const current = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const currentCount = Array.isArray(current) ? current.length : 0;
    
    if (changeType === 'adding') {
      const newCount = newBluevox.length;
      if (maxAllowed != null) {
        if (currentCount >= maxAllowed) {
          return `⚠️ Has alcanzado el límite de ${maxAllowed} Bluevox permitidos para este vehículo.`;
        }
        const remaining = maxAllowed - currentCount;
        return `✅ Agregando ${newCount} Bluevox nuevo(s). Puedes agregar ${remaining} más.`;
      } else {
        return `✅ Agregando ${newCount} Bluevox nuevo(s) a la instalación.`;
      }
    } else if (changeType === 'modifying') {
      const removedCount = removedBluevox.length;
      if (newBluevox.length > 0) {
        return `🔄 Modificando instalación: ${removedCount} Bluevox removido(s) y ${newBluevox.length} nuevo(s) agregado(s).`;
      } else {
        return `🔄 Modificando instalación: ${removedCount} Bluevox removido(s).`;
      }
    }
    
    return '';
  }

  /**
   * Obtiene la clase CSS para el badge de cambio
   */
  getBluevoxChangeBadgeClass(): string {
    const changeType = this.getBluevoxChangeType();
    switch (changeType) {
      case 'adding':
        return 'badge-adding';
      case 'modifying':
        return 'badge-modifying';
      default:
        return '';
    }
  }

  /**
   * Verifica si hay bluevox nuevos en la selección actual
   */
  hasNewBluevox(): boolean {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return false;
    }
    const current = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const currentIds = Array.isArray(current) ? current.map((id: any) => Number(id)) : [];
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id))
      : [];
    
    return currentIds.some((id: number) => !initialIds.includes(id));
  }

  /**
   * Verifica si hay bluevox existentes en la selección actual
   */
  hasExistingBluevox(): boolean {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return false;
    }
    const current = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const currentIds = Array.isArray(current) ? current.map((id: any) => Number(id)) : [];
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id))
      : [];
    
    return currentIds.some((id: number) => initialIds.includes(id));
  }

  /**
   * Obtiene solo los bluevox existentes de la selección actual
   */
  getExistingBluevox(): any[] {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return [];
    }
    const selected = this.getSelectedBluevox();
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id))
      : [];
    
    return selected.filter((bv: any) => {
      const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
      return initialIds.includes(bvId);
    });
  }

  /**
   * Obtiene solo los bluevox nuevos de la selección actual
   */
  getNewSelectedBluevox(): any[] {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return this.getSelectedBluevox();
    }
    const selected = this.getSelectedBluevox();
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id))
      : [];
    
    return selected.filter((bv: any) => {
      const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
      return !initialIds.includes(bvId);
    });
  }

  /**
   * Verifica si un bluevox está marcado actualmente (en la selección)
   */
  isBluevoxCurrentlySelected(id: number): boolean {
    return this.isBluevoxSelected(id);
  }

  /**
   * Verifica si un bluevox era originalmente parte de la instalación (en modo edición)
   */
  wasBluevoxOriginallyAssigned(id: number): boolean {
    if (!this.idInstalacion || !this.initialBlueVoxIds) {
      return false;
    }
    const bvId = Number(id);
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id))
      : [];
    return initialIds.includes(bvId);
  }

  /**
   * Determina la acción que se realizará al interactuar con un bluevox
   * Retorna: 'add' (se agregará), 'remove' (se removerá), 'keep' (se mantiene), 'none' (no hay acción)
   */
  getBluevoxAction(id: number): 'add' | 'remove' | 'keep' | 'none' {
    if (!this.idInstalacion) {
      // En modo agregar, cualquier selección es "add"
      return this.isBluevoxSelected(id) ? 'keep' : 'add';
    }

    const bvId = Number(id);
    const isCurrentlySelected = this.isBluevoxSelected(bvId);
    const wasOriginallyAssigned = this.wasBluevoxOriginallyAssigned(bvId);

    if (isCurrentlySelected && !wasOriginallyAssigned) {
      return 'add'; // Está seleccionado pero no estaba originalmente = se agregará
    } else if (!isCurrentlySelected && wasOriginallyAssigned) {
      return 'remove'; // No está seleccionado pero estaba originalmente = se removerá
    } else if (isCurrentlySelected && wasOriginallyAssigned) {
      return 'keep'; // Está seleccionado y estaba originalmente = se mantiene
    }

    return 'none'; // No está seleccionado y no estaba originalmente = no hay acción
  }

  /**
   * Obtiene el texto descriptivo de la acción para un bluevox
   */
  getBluevoxActionText(id: number): string {
    const action = this.getBluevoxAction(id);
    switch (action) {
      case 'add':
        return 'Se agregará';
      case 'remove':
        return 'Se removerá';
      case 'keep':
        return 'Se mantiene';
      default:
        return '';
    }
  }

  /**
   * Obtiene el icono para la acción de un bluevox
   */
  getBluevoxActionIcon(id: number): string {
    const action = this.getBluevoxAction(id);
    switch (action) {
      case 'add':
        return 'fa-plus-circle';
      case 'remove':
        return 'fa-minus-circle';
      case 'keep':
        return 'fa-check-circle';
      default:
        return '';
    }
  }

  /**
   * Obtiene la clase CSS para el badge de acción de un bluevox
   */
  getBluevoxActionBadgeClass(id: number): string {
    const action = this.getBluevoxAction(id);
    switch (action) {
      case 'add':
        return 'badge-action-add';
      case 'remove':
        return 'badge-action-remove';
      case 'keep':
        return 'badge-action-keep';
      default:
        return '';
    }
  }

  /**
   * Muestra un Swal.fire con información sobre las acciones que se pueden realizar con Bluevox
   */
  mostrarInformacionBluevox(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    const current = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const currentIds = Array.isArray(current) ? current.map((id: any) => Number(id)) : [];
    const initialIds = Array.isArray(this.initialBlueVoxIds) 
      ? this.initialBlueVoxIds.map((id: any) => Number(id))
      : [];
    
    const nuevos = currentIds.filter((id: number) => !initialIds.includes(id));
    const removidos = initialIds.filter((id: number) => !currentIds.includes(id));
    const mantenidos = currentIds.filter((id: number) => initialIds.includes(id));

    let contenidoHtml = `
      <div style="text-align: left; color: #e9eef5; font-size: 14px; line-height: 1.7;">
        <p style="margin-bottom: 18px; font-size: 14px; color: #e9eef5;">
          <strong>Estás editando esta instalación.</strong> Aquí te explicamos cómo funciona:
        </p>
        
        <div style="background: rgba(96, 165, 250, 0.1); border-left: 4px solid #60a5fa; padding: 10px 12px; margin-bottom: 12px; border-radius: 6px;">
          <strong style="color: #93c5fd; display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 6px;">
            <i class="fas fa-plus-circle" style="color: #60a5fa; font-size: 16px;"></i> Agregar Bluevox
          </strong>
          <div style="margin-left: 24px; color: #c8c8c8; font-size: 13px;">
            <p style="margin: 3px 0;">1. Abre el menú de Bluevox</p>
            <p style="margin: 3px 0;">2. Ve a <strong>"Disponibles"</strong></p>
            <p style="margin: 3px 0;">3. Marca el ✓ del Bluevox que quieres</p>
            <p style="margin: 6px 0 3px 0; color: #93c5fd;">
              <i class="fas fa-check" style="margin-right: 4px; font-size: 11px;"></i>
              Verás <span style="background: rgba(96, 165, 250, 0.3); color: #93c5fd; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;">Se agregará</span>
            </p>
          </div>
        </div>
        
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 10px 12px; margin-bottom: 12px; border-radius: 6px;">
          <strong style="color: #fca5a5; display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 6px;">
            <i class="fas fa-minus-circle" style="color: #ef4444; font-size: 16px;"></i> Quitar Bluevox
          </strong>
          <div style="margin-left: 24px; color: #c8c8c8; font-size: 13px;">
            <p style="margin: 3px 0;">1. Abre el menú de Bluevox</p>
            <p style="margin: 3px 0;">2. Ve a <strong>"Asignados a esta instalación"</strong></p>
            <p style="margin: 3px 0;">3. Quita el ✓ del Bluevox que quieres quitar</p>
            <p style="margin: 6px 0 3px 0; color: #fca5a5;">
              <i class="fas fa-check" style="margin-right: 4px; font-size: 11px;"></i>
              Verás <span style="background: rgba(239, 68, 68, 0.3); color: #fca5a5; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;">Se removerá</span>
            </p>
          </div>
        </div>
        
        <div style="background: rgba(74, 222, 128, 0.1); border-left: 4px solid #4ade80; padding: 10px 12px; margin-bottom: 12px; border-radius: 6px;">
          <strong style="color: #86efac; display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 6px;">
            <i class="fas fa-check-circle" style="color: #4ade80; font-size: 16px;"></i> Mantener Bluevox
          </strong>
          <div style="margin-left: 24px; color: #c8c8c8; font-size: 13px;">
            <p style="margin: 3px 0;">Si un Bluevox ya estaba asignado y lo dejas marcado con ✓, se mantiene igual.</p>
            <p style="margin: 6px 0 3px 0; color: #86efac;">
              <i class="fas fa-check" style="margin-right: 4px; font-size: 11px;"></i>
              Verás <span style="background: rgba(74, 222, 128, 0.3); color: #86efac; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600;">Se mantiene</span>
            </p>
          </div>
        </div>
    `;

    const maxBv = this.getCantidadAccesosMax();
    if (maxBv != null) {
      contenidoHtml += `
        <div style="background: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; padding: 10px 12px; margin-bottom: 12px; border-radius: 6px;">
          <strong style="color: #fcd34d; display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 6px;">
            <i class="fas fa-exclamation-triangle" style="color: #fbbf24; font-size: 16px;"></i> ⚠️ Límite
          </strong>
          <div style="margin-left: 24px; color: #c8c8c8; font-size: 13px;">
            <p style="margin: 3px 0;">Este vehículo tiene <strong style="color: #fcd34d;">${maxBv} acceso${maxBv !== 1 ? 's' : ''}</strong>.</p>
            <p style="margin: 3px 0;">Solo puedes seleccionar <strong>hasta ${maxBv} Bluevox</strong>.</p>
            <p style="margin: 6px 0 3px 0; color: #fcd34d;">
              <i class="fas fa-ban" style="margin-right: 4px; font-size: 11px;"></i>
              Si intentas poner más, aparecerá una alerta y no podrás agregar
            </p>
          </div>
        </div>
      `;
    }

    if (nuevos.length > 0 || removidos.length > 0 || mantenidos.length > 0) {
      contenidoHtml += `
        <div style="margin-top: 16px; padding-top: 14px; border-top: 2px solid #213041; background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px;">
          <strong style="color: #e9eef5; display: block; margin-bottom: 10px; font-size: 14px; display: flex; align-items: center; gap: 6px;">
            <i class="fas fa-clipboard-check" style="color: #60a5fa; font-size: 14px;"></i> Resumen:
          </strong>
          <div style="margin-left: 4px;">
      `;
      
      if (mantenidos.length > 0) {
        contenidoHtml += `
          <p style="margin: 5px 0; display: flex; align-items: center; gap: 8px; color: #86efac; font-size: 13px;">
            <span style="background: rgba(74, 222, 128, 0.2); color: #86efac; padding: 3px 8px; border-radius: 10px; font-weight: 700; min-width: 24px; text-align: center; font-size: 12px;">${mantenidos.length}</span>
            <span>Se mantienen</span>
          </p>
        `;
      }
      
      if (nuevos.length > 0) {
        contenidoHtml += `
          <p style="margin: 5px 0; display: flex; align-items: center; gap: 8px; color: #93c5fd; font-size: 13px;">
            <span style="background: rgba(96, 165, 250, 0.2); color: #93c5fd; padding: 3px 8px; border-radius: 10px; font-weight: 700; min-width: 24px; text-align: center; font-size: 12px;">${nuevos.length}</span>
            <span>Se agregarán</span>
          </p>
        `;
      }
      
      if (removidos.length > 0) {
        contenidoHtml += `
          <p style="margin: 5px 0; display: flex; align-items: center; gap: 8px; color: #fca5a5; font-size: 13px;">
            <span style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 3px 8px; border-radius: 10px; font-weight: 700; min-width: 24px; text-align: center; font-size: 12px;">${removidos.length}</span>
            <span>Se quitarán</span>
          </p>
        `;
      }
      
      contenidoHtml += `
          </div>
        </div>
      `;
    }

    contenidoHtml += `
      <div style="margin-top: 14px; padding: 10px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px;">
        <p style="margin: 0; color: #93c5fd; font-size: 12px; display: flex; align-items: flex-start; gap: 6px;">
          <i class="fas fa-lightbulb" style="color: #60a5fa; margin-top: 2px; font-size: 12px;"></i>
          <span><strong>Tip:</strong> Los badges de colores te dicen qué va a pasar con cada Bluevox cuando guardes.</span>
        </p>
      </div>
    `;

    contenidoHtml += `</div>`;

    Swal.fire({
      title: '📖 Guía Fácil: ¿Cómo editar Bluevox?',
      html: contenidoHtml,
      background: '#002136',
      color: '#e9eef5',
      width: '680px',
      padding: '26px',
      customClass: {
        popup: 'swal2-padding swal2-border',
        title: 'swal2-title-custom',
        htmlContainer: 'swal2-html-container-custom'
      },
      confirmButtonText: '¡Entendido!',
      confirmButtonColor: '#3085d6',
      icon: 'question',
      iconColor: '#60a5fa',
      showCloseButton: true,
      allowOutsideClick: true
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Ya no necesitamos el dropdown, pero mantenemos para compatibilidad
    if (!target.closest('.bluevox-dropdown-container')) {
      this.showBluevoxDropdown = false;
    }
  }
}
