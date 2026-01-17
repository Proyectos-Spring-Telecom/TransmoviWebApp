import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
    idDispositivo?: number;
    idsBlueVoxs?: number[];
    idVehiculo?: number;
  } = {};
  private pendingLabels: {
    dispositivo?: string | null;
    bluevox?: string | null;
    vehiculo?: string | null;
  } = {};
  private blueVoxsDataFromService: { [key: number]: any } = {}; // Almacenar datos completos de bluevox por ID

  initialDispositivoId?: number | null;
  initialBlueVoxIds?: number[] | null;

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
    const idDispositivo = this.instalacionesForm.get('idDispositivo');
    const idsBlueVoxs = this.instalacionesForm.get('idsBlueVoxs');
    const idVehiculo = this.instalacionesForm.get('idVehiculo');

    if (disabled) {
      idDispositivo?.disable(opts);
      idsBlueVoxs?.disable(opts);
      idVehiculo?.disable(opts);
      // Cerrar el dropdown si estaba abierto
      if (this.showBluevoxDropdown) {
        this.showBluevoxDropdown = false;
      }
    } else {
      idDispositivo?.enable(opts);
      idsBlueVoxs?.enable(opts);
      idVehiculo?.enable(opts);
      this.keepEditLocks();
    }
  }

  private limpiarDependientes(): void {
    const opts = { emitEvent: false };
    this.instalacionesForm.patchValue(
      { idDispositivo: null, idsBlueVoxs: [], idVehiculo: null },
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
    
    if (!idVehiculo) {
      // Si no hay vehículo, limpiar validación y valores
      idsBlueVoxsCtrl?.clearValidators();
      idsBlueVoxsCtrl?.setValidators([Validators.required]);
      idsBlueVoxsCtrl?.setValue([], { emitEvent: false });
      idsBlueVoxsCtrl?.updateValueAndValidity({ emitEvent: false });
      this.showBluevoxDropdown = false;
      return;
    }

    const vehiculo = this.listaVehiculos.find((v: any) => Number(v.id) === Number(idVehiculo));
    const cantidadAccesos = vehiculo?.cantidadAccesos != null ? Number(vehiculo.cantidadAccesos) : null;
    
    if (cantidadAccesos === 4) {
      // Requerir máximo 4 bluevox (permitir menos, bloquear más)
      idsBlueVoxsCtrl?.setValidators([
        Validators.required,
        this.exactlyFourBluevoxValidator.bind(this)
      ]);
      // Solo limpiar si REBASAN el límite (más de 4), no si tienen menos
      const currentValue = idsBlueVoxsCtrl?.value || [];
      if (Array.isArray(currentValue) && currentValue.length > 4) {
        // Si tienen más de 4, dejar solo los primeros 4
        idsBlueVoxsCtrl?.setValue(currentValue.slice(0, 4), { emitEvent: false });
      }
    } else {
      // Validación normal: al menos 1
      idsBlueVoxsCtrl?.clearValidators();
      idsBlueVoxsCtrl?.setValidators([Validators.required]);
      // Limpiar si había más de 1 seleccionado (viene de un vehículo con cantidadAccesos === 4)
      const currentValue = idsBlueVoxsCtrl?.value || [];
      if (Array.isArray(currentValue) && currentValue.length > 1) {
        // Mantener solo el primero o limpiar todos
        idsBlueVoxsCtrl?.setValue([], { emitEvent: false });
      }
    }
    
    idsBlueVoxsCtrl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.detectChanges();
  }

  private exactlyFourBluevoxValidator(control: any) {
    if (!control.value || !Array.isArray(control.value)) {
      return { required: true };
    }
    const count = control.value.length;
    if (count === 0) {
      return { required: true };
    }
    // Solo validar si REBASAN el límite (más de 4), no si tienen menos
    if (count > 4) {
      return { exactlyFour: true, actual: count };
    }
    return null;
  }

  requiereExactamenteCuatro(): boolean {
    const idVehiculo = this.instalacionesForm.get('idVehiculo')?.value;
    if (!idVehiculo) return false;
    const vehiculo = this.listaVehiculos.find((v: any) => Number(v.id) === Number(idVehiculo));
    const cantidadAccesos = vehiculo?.cantidadAccesos != null ? Number(vehiculo.cantidadAccesos) : null;
    return cantidadAccesos === 4;
  }

  getBluevoxHelpText(): string {
    const selected = this.getSelectedBluevoxCount();
    if (this.requiereExactamenteCuatro()) {
      return `Selecciona exactamente 4 Bluevox (${selected} seleccionado${selected !== 1 ? 's' : ''})`;
    }
    return `${selected} seleccionado${selected !== 1 ? 's' : ''}`;
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
      .get('idsBlueVoxs')
      ?.valueChanges.subscribe(async (nuevos: any) => {
        if (this.bootstrapping || !this.idInstalacion) return;
        const prev = this.initialBlueVoxIds || [];
        const nuevosIds = Array.isArray(nuevos) ? nuevos.map((id: any) => Number(id)).filter((id: any) => !isNaN(id)) : [];
        const prevIds = Array.isArray(prev) ? prev.map((id: any) => Number(id)).filter((id: any) => !isNaN(id)) : [];
        
        if (prevIds.length === 0) {
          // Si no había bluevox anteriores, solo actualizar sin mostrar alerta
          this.initialBlueVoxIds = nuevosIds;
          return;
        }
        
        // Verificar si todos los anteriores están en los nuevos (no se removieron)
        const todosAnterioresEstan = prevIds.every((id: number) => nuevosIds.includes(id));
        
        // Verificar si está AGREGANDO (todos los anteriores + más) o REEMPLAZANDO (alguno faltante o agregando sobre 4)
        const estaAgregando = todosAnterioresEstan && nuevosIds.length > prevIds.length;
        const estabaCompleto = prevIds.length === 4;
        const estaSobrepasando = estabaCompleto && nuevosIds.length > 4;
        const estaReemplazando = !todosAnterioresEstan; // Alguno de los anteriores no está en los nuevos
        
        // Solo mostrar alerta si está REEMPLAZANDO (removiendo alguno anterior) 
        // o si ya tenía 4 completos y está agregando uno más (sobrepasando)
        const debeMostrarAlerta = estaReemplazando || estaSobrepasando;
        
        if (debeMostrarAlerta) {
          const r = await this.solicitarEstadoYComentarios(
            '¿A qué estado deseas cambiar los BlueVox anteriores?'
          );
          if (r) {
            // Si acepta, guardar el estado y comentarios, y actualizar los IDs de referencia
            this.estatusBluevoxsAnterior = r.estado ?? null;
            this.comentariosBluevox =
              r.comentarios ?? this.comentariosBluevox ?? null;
            this.initialBlueVoxIds = [...nuevosIds]; // Copia del array para mantener referencia
          }
          // Si cancela, mantener los cambios en el formulario pero no actualizar estatus anteriores
          // Los IDs actuales del formulario se enviarán al actualizar (se toman del getNumericFormPayload)
        } else if (estaAgregando) {
          // Si solo está agregando (sin reemplazar), actualizar los IDs sin mostrar alerta
          this.initialBlueVoxIds = [...nuevosIds]; // Copia del array para mantener referencia
        }
        // Si no hay cambios o son iguales, mantener initialBlueVoxIds como está
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
        popup.style.background = '#002136';
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
      dispositivos: this.dispoService.obtenerDispositivosByCliente(idCliente).pipe(
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
      vehiculos: this.vehiService.obtenerVehiculosByCliente(idCliente).pipe(
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
          this.listaDipositivos = this.ensureSelectedOptionVisible(
            this.listaDipositivos,
            this.pendingSelecciones?.idDispositivo,
            this.pendingLabels.dispositivo,
            'numeroSerie'
          );

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
            f.get('idDispositivo')?.setValue(
              n(this.pendingSelecciones.idDispositivo),
              { emitEvent: false }
            );
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
              this.cdr.detectChanges();
            }
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
          // No necesitamos ensureSelectedOptionVisible para múltiples selecciones
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
          if (this.pendingSelecciones.idsBlueVoxs && Array.isArray(this.pendingSelecciones.idsBlueVoxs) && this.pendingSelecciones.idsBlueVoxs.length > 0) {
            f.get('idsBlueVoxs')?.setValue(
              this.pendingSelecciones.idsBlueVoxs.map((id: any) => n(id)).filter((id: any) => id != null),
              { emitEvent: false }
            );
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
        const idDispositivo = this.toNumOrNull(
          raw.idDispositivo ?? raw?.dispositivos?.id
        );
        // Manejar blueVoxs si viene como array de objetos
        let idsBlueVoxs: number[] = [];
        this.blueVoxsDataFromService = {}; // Limpiar datos previos
        
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
        this.initialDispositivoId = idDispositivo ?? null;
        this.initialBlueVoxIds = idsBlueVoxs.length > 0 ? idsBlueVoxs : null;
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
        this.pendingSelecciones = { idDispositivo, idsBlueVoxs: idsBlueVoxs.length > 0 ? idsBlueVoxs : undefined, idVehiculo };
        if (idCliente) {
          this.cargarListasPorCliente(idCliente, true);
        } else {
          this.listaDipositivos = this.ensureSelectedOptionVisible(
            [],
            idDispositivo,
            this.pendingLabels.dispositivo,
            'numeroSerie'
          );
          // No necesitamos ensureSelectedOptionVisible para múltiples selecciones
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
          if (idsBlueVoxs.length > 0) {
            f.get('idsBlueVoxs')?.patchValue(idsBlueVoxs, opts);
          }
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
      idsBlueVoxs: Array.isArray(raw.idsBlueVoxs) 
        ? raw.idsBlueVoxs.map((id: any) => this.toNumOrNull(id)).filter((id: any) => id != null)
        : [],
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
        idsBlueVoxs: 'Bluevox',
        idVehiculo: 'Vehículo',
        idCliente: 'Cliente',
      };
      
      // Mensajes personalizados para validación de bluevox
      const mensajesPersonalizados: any = {
        exactlyFour: (control: any) => {
          const actual = control.errors?.['exactlyFour']?.actual || 0;
          return `Bluevox: Se requieren exactamente 4 selecciones (tienes ${actual})`;
        },
      };
      const camposFaltantes: string[] = [];
      Object.keys(this.instalacionesForm.controls).forEach((key) => {
        const control = this.instalacionesForm.get(key);
        if (control?.invalid) {
          if (control.errors?.['required']) {
            camposFaltantes.push(etiquetas[key] || key);
          } else if (control.errors?.['exactlyFour']) {
            const actual = control.errors['exactlyFour'].actual || 0;
            camposFaltantes.push(`Bluevox: Se requieren exactamente 4 selecciones (tienes ${actual})`);
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

  actualizar(): void {
    this.submitButton = 'Cargando...';
    this.loading = true;

    const base = this.getNumericFormPayload();

    // Obtener el primer ID del array anterior de bluevox para idBlueVox
    const idBlueVox = this.initialBlueVoxIds && Array.isArray(this.initialBlueVoxIds) && this.initialBlueVoxIds.length > 0
      ? this.initialBlueVoxIds[0]
      : null;

    const payload = {
      ...base,
      estatusDispositivoAnterior: this.estatusDispositivoAnterior ?? null,
      idBlueVox: idBlueVox ?? null,
      estatusBluevoxsAnterior: this.estatusBluevoxsAnterior ?? null,
      comentariosDispositivo: this.comentariosDispositivo ?? null,
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

  toggleBluevoxDropdown(): void {
    const idsBlueVoxsCtrl = this.instalacionesForm.get('idsBlueVoxs');
    if (idsBlueVoxsCtrl?.disabled) {
      return; // No abrir si está deshabilitado
    }
    this.showBluevoxDropdown = !this.showBluevoxDropdown;
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
    
    // Verificar si requiere exactamente 4
    const requiereCuatro = this.requiereExactamenteCuatro();
    
    if (event.target.checked) {
      // Solo validar si requiere 4 y ya hay 4 o más seleccionados
      if (requiereCuatro && selectedIds.length >= 4) {
        // Ya hay 4 o más seleccionados, intentando agregar uno más - REBASAR el límite
        event.target.checked = false;
        Swal.fire({
          title: 'Límite alcanzado',
          text: 'Este vehículo tiene 4 accesos, solo puedes seleccionar exactamente 4 Bluevox.',
          icon: 'warning',
          background: '#002136',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
        });
        return;
      }
      // Si tiene menos de 4, permitir seleccionar
      if (!selectedIds.includes(id)) {
        selectedIds.push(id);
      }
    } else {
      // Al deseleccionar, siempre permitir (no hay límite mínimo)
      const index = selectedIds.indexOf(id);
      if (index > -1) {
        selectedIds.splice(index, 1);
      }
    }
    
    this.instalacionesForm.patchValue({ idsBlueVoxs: selectedIds });
    this.instalacionesForm.get('idsBlueVoxs')?.updateValueAndValidity({ emitEvent: false });
    this.cdr.detectChanges();
  }

  isBluevoxDisabled(id: number): boolean {
    // Primero verificar si el campo está deshabilitado
    if (this.instalacionesForm.get('idsBlueVoxs')?.disabled) {
      return true;
    }
    
    // Luego verificar si requiere exactamente 4
    if (!this.requiereExactamenteCuatro()) {
      return false;
    }
    const currentValue = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    const selectedIds = Array.isArray(currentValue) ? currentValue : [];
    // Deshabilitar si ya hay 4 seleccionados y este no está seleccionado
    return selectedIds.length >= 4 && !selectedIds.includes(id);
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
        return this.listaBlueVox.find((b: any) => {
          const bId = Number(b?.id ?? b?.idBlueVox ?? 0);
          return bId === bvId;
        });
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

  getAvailableBluevox(): any[] {
    const selected = this.instalacionesForm.get('idsBlueVoxs')?.value || [];
    if (!this.listaBlueVox || this.listaBlueVox.length === 0) {
      return [];
    }
    if (!Array.isArray(selected) || selected.length === 0) {
      return [...this.listaBlueVox];
    }
    const selectedIds = selected.map((id: any) => Number(id));
    return this.listaBlueVox.filter((bv: any) => {
      const bvId = Number(bv?.id ?? bv?.idBlueVox ?? 0);
      return !selectedIds.includes(bvId);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.bluevox-dropdown-container')) {
      this.showBluevoxDropdown = false;
    }
  }
}
