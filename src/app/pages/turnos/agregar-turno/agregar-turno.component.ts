import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { InstalacionesService } from 'src/app/shared/services/instalaciones.service';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import { TurnoService } from 'src/app/shared/services/turnos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-turno',
  templateUrl: './agregar-turno.component.html',
  styleUrl: './agregar-turno.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarTurnoComponent {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public turnosForm: FormGroup;
  public idTurno: number;
  public title = 'Agregar Turno';

  loadingDependientes = false;
  listaClientes: any[] = [];
  listaOperadores: any[] = [];
  listaBlueVox: any[] = [];
  listaInstalaciones: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  // ---- Rol/usuario
  public idClienteUser!: number;
  public idRolUser!: number;
  get isAdmin(): boolean { return this.idRolUser === 1; }

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private turnoService: TurnoService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private clieService: ClientesService,
    private operaService: OperadoresService,
    private instService: InstalacionesService,
    private users: AuthenticationService
  ) {
    const user = this.users.getUser();
    this.idClienteUser = Number(user?.idCliente);
    this.idRolUser = Number(user?.rol?.id);
  }

  ngOnInit(): void {
    this.initForm();
    this.obtenerClientes();
    this.obtenerOperador();
    this.obtenerInstalaciones();

    this.activatedRouted.params.subscribe((params) => {
      this.idTurno = params['idTurno'];
      if (this.idTurno) {
        this.title = 'Actualizar Turno';
        this.obtenerTurno();
      }
    });
  }

  obtenerInstalaciones() {
    this.instService.obtenerInstalaciones().subscribe((response) => {
      this.listaInstalaciones = this.normalizeId(response?.data ?? []);
    });
  }

  obtenerClientes() {
    this.clieService.obtenerClientes().subscribe((response: any) => {
      this.listaClientes = this.normalizeId(response?.data ?? []);

      if (!this.isAdmin) {
        this.turnosForm.get('idCliente')?.setValue(this.idClienteUser, { emitEvent: false });
        this.turnosForm.get('idCliente')?.disable({ onlySelf: true });
      }
    });
  }

  obtenerOperador() {
    this.operaService.obtenerOperadores().subscribe((response: any) => {
      const operadores = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      this.listaOperadores = operadores.map((op: any) => ({
        id: Number(op.id),
        nombreUsuario: op.nombreUsuario ?? '',
        apellidoPaternoUsuario: op.apellidoPaternoUsuario ?? '',
        apellidoMaternoUsuario: op.apellidoMaternoUsuario ?? '',
      }));
    });
  }

  compareNums = (a: any, b: any) => Number(a) === Number(b);

  obtenerTurno() {
    this.turnoService.obtenerTurno(this.idTurno).subscribe((response: any) => {
      const turno = Array.isArray(response?.data) ? response.data[0] : response?.data;
      if (!turno) return;

      const idClienteSrv   = turno.idCliente     != null ? Number(turno.idCliente)     : null;
      const idOperador     = turno.idOperador    != null ? Number(turno.idOperador)    : null;
      const idInstalacion  = turno.idInstalacion != null ? Number(turno.idInstalacion) : null;

      const idCliente = this.isAdmin ? idClienteSrv : this.idClienteUser;

      this.turnosForm.patchValue({
        inicio: this.toInputDatetime(turno.inicio),
        fin: this.toInputDatetime(turno.fin),
        idCliente,
        idOperador,
        idInstalacion,
        estatus: turno.estatus ?? 1,
      }, { emitEvent: false });

      if (!this.isAdmin) {
        this.turnosForm.get('idCliente')?.disable({ onlySelf: true });
      }
    });
  }

  private toInputDatetime(z: string | null | undefined): string | null {
    if (!z) return null;
    return String(z).replace('Z', '').slice(0, 16);
  }

  private normalizeId<T extends { id: any }>(arr: T[] = []): (T & { id: number })[] {
    return (arr || []).map((x: any) => ({ ...x, id: Number(x.id) }));
  }

  private toZulu(input: string | null | undefined): string | null {
    if (!input) return null;
    const s = String(input).trim();
    const base = s.length >= 16 ? s.slice(0, 16) : s;
    return `${base}:00Z`;
  }

  initForm() {
    this.turnosForm = this.fb.group({
      inicio: ['', Validators.required],
      fin: ['', Validators.required],
      estatus: [1, Validators.required],
      idCliente: [this.isAdmin ? null : this.idClienteUser, Validators.required],
      idOperador: [null, Validators.required],
      idInstalacion: [null, Validators.required],
    });

    if (!this.isAdmin) {
      this.turnosForm.get('idCliente')?.disable({ onlySelf: true });
    }
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idTurno) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.turnosForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        inicio: 'Inicio del Turno',
        fin: 'Fin del Turno',
        idCliente: 'Cliente',
        idOperador: 'Operador',
        idInstalacion: 'Instalación',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.turnosForm.controls).forEach((key) => {
        const control = this.turnosForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, i) => `
        <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                    background: #caa8a8; text-align: center; margin-bottom: 8px;
                    border-radius: 4px;">
          <strong style="color: #b02a37;">${i + 1}. ${campo}</strong>
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
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const raw = this.turnosForm.getRawValue();
    const payload = { ...raw, inicio: this.toZulu(raw.inicio), fin: this.toZulu(raw.fin) };

    this.turnoService.agregarTurno(payload).subscribe(
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo turno de manera exitosa.`,
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

    if (this.turnosForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        inicio: 'Inicio del Turno',
        fin: 'Fin del Turno',
        idCliente: 'Cliente',
        idOperador: 'Operador',
        idInstalacion: 'Instalación',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.turnosForm.controls).forEach((key) => {
        const control = this.turnosForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, i) => `
        <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                    background: #caa8a8; text-align: center; margin-bottom: 8px;
                    border-radius: 4px;">
          <strong style="color: #b02a37;">${i + 1}. ${campo}</strong>
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
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const raw = this.turnosForm.getRawValue();
    const payload = { ...raw, inicio: this.toZulu(raw.inicio), fin: this.toZulu(raw.fin) };

    this.turnoService.actualizarTurno(this.idTurno, payload).subscribe(
      () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos del turno se actualizaron correctamente.`,
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
          text: `Ocurrió un error al actualizar el turno.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/turnos');
  }
}
