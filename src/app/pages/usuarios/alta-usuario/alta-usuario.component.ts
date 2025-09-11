import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { ModulosService } from 'src/app/shared/services/modulos.service';
import { PermisosService } from 'src/app/shared/services/permisos.service';
import { RolesService } from 'src/app/shared/services/roles.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-usuario',
  templateUrl: './alta-usuario.component.html',
  styleUrls: ['./alta-usuario.component.scss'],
  animations: [fadeInUpAnimation],
})
export class AltaUsuarioComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public usuarioForm: FormGroup;
  public idUsuario: number;
  public inputContrasena: boolean = true;
  public title = 'Agregar Usuario';
  public listaModulos: any[] = [];
  public listaRoles: any;
  public listaClientes: any;

  type = 'password';
  minCaracteres = false;
  maxCaracteres = false;
  hasNumber = false;
  hasMinus = false;
  hasMayus = false;
  espCaracter = false;
  typeConfirm: string = 'password';
  public permisosIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private usuaService: UsuariosService,
    private route: Router,
    private activatedRouted: ActivatedRoute,
    private moduService: ModulosService,
    private permService: PermisosService,
    private rolService: RolesService,
    private clienService: ClientesService
  ) { }

  ngOnInit(): void {
    this.obtenerClientes();
    this.obtenerRoles();
    this.obtenerModulos();
    this.initForm();

    this.activatedRouted.params.subscribe((params) => {
      this.idUsuario = params['idUsuario'];
      if (this.idUsuario) {
        this.title = 'Actualizar Usuario';
        this.obtenerUsuarioID();
        this.inputContrasena = false;
      }
    });
  }

  passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('passwordHash')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleConfirmPassword() {
    this.typeConfirm = this.typeConfirm === 'password' ? 'text' : 'password';
  }

  initForm() {
    this.usuarioForm = this.fb.group(
      {
        userName: ['', [Validators.required, Validators.email]],
        passwordHash: ['', [Validators.required]],
        confirmPassword: [''],
        telefono: ['', [Validators.required]],
        nombre: ['', [Validators.required]],
        apellidoPaterno: ['', [Validators.required]],
        apellidoMaterno: ['', [Validators.required]],
        fotoPerfil: ['https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/1200px-User_icon_2.svg.png'],
        idRol: [null],
        emailConfirmado: [0],
        estatus: [1],
        idCliente: [null, [Validators.required]],
        permisosIds: this.fb.control<number[]>([])
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  obtenerModulos() {
    this.permService.obtenerPermisosAgrupados().subscribe((response: any) => {
      let raw: any = response;
      if (Array.isArray(response) && Array.isArray(response[0])) {
        raw = response[0];
      }
      if (!Array.isArray(raw)) raw = [];
      this.applyAssignedPermsToModules();
      this.listaModulos = raw.map((m: any) => ({
        id: Number(m?.Id ?? m?.id),
        nombre: m?.NombreModulo ?? m?.nombre ?? m?.Nombre ?? '',
        descripcion: m?.Descripcion ?? m?.descripcion ?? '',
        estatus: m?.Estatus ?? m?.estatus,
        permisos: (m?.Permisos ?? m?.permisos ?? []).map((p: any) => ({
          id: p?.Id ?? p?.id,
          nombre: p?.Nombre ?? p?.nombre ?? '',
          descripcion: p?.Descripcion ?? p?.descripcion ?? '',
          estatus: p?.Estatus ?? p?.estatus
        }))
      }));
    });
  }

  obtenerRoles() {
    this.rolService.obtenerRoles().subscribe((response) => {
      this.listaRoles = (response as any)?.data ?? response;
    });
  }

  obtenerClientes() {
    this.clienService.obtenerClientes().subscribe((response) => {
      this.listaClientes = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c.id)
      }));
    });
  }


  trackModulo = (_: number, m: any) => m.id ?? m.Id;
  trackPermiso = (_: number, p: any) => p.id ?? p.Id;

  onToggle(permiso: any, checked: boolean) {
    const idNum = Number(permiso?.id ?? permiso?.Id);
    permiso.estatus = checked ? 1 : 0;

    if (checked) {
      if (!this.permisosIds.includes(idNum)) this.permisosIds.push(idNum);
    } else {
      this.permisosIds = this.permisosIds.filter(id => id !== idNum);
    }
    this.usuarioForm.patchValue({ permisosIds: this.permisosIds });
  }



  obtenerUsuarioID() {
    this.usuaService.obtenerUsuario(this.idUsuario).subscribe((response: any) => {
      console.log('[USUARIO][RAW]', response);

      const u = response?.usuario ?? response?.user ?? {};
      const permisosApi: any[] = response?.permiso ?? response?.permisos ?? [];

      const perms = response?.permiso ?? response?.permisos ?? [];
      this.permisosIds = (perms || [])
        .filter(p => Number(p?.estatus) === 1)
        .map(p => Number(p?.idPermiso ?? p?.IdPermiso ?? p?.id));
      this.usuarioForm.patchValue({ permisosIds: this.permisosIds });

      this.applyAssignedPermsToModules();

      this.usuarioForm.patchValue({
        userName: u?.userName ?? u?.UserName ?? '',
        telefono: u?.telefono ?? u?.Telefono ?? '',
        nombre: u?.nombre ?? u?.Nombre ?? '',
        apellidoPaterno: u?.apellidoPaterno ?? u?.ApellidoPaterno ?? '',
        apellidoMaterno: u?.apellidoMaterno ?? u?.ApellidoMaterno ?? '',
        fotoPerfil: u?.fotoPerfil ?? u?.FotoPerfil ?? this.usuarioForm.get('fotoPerfil')?.value,
        emailConfirmado: Number(u?.emailConfirmado ?? u?.EmailConfirmado ?? 0),
        estatus: Number(u?.estatus ?? u?.Estatus ?? 1),
        idRol: Number(u?.idRol ?? u?.IdRol ?? null),
        idCliente: Number(u?.idCliente ?? u?.IdCliente ?? null),
        permisosIds: this.permisosIds,
      });
      console.log('[USUARIO][FORM PATCHED]', this.usuarioForm.value);
    });
  }

  isPermisoAsignado(id: any): boolean {
    const nid = Number(id);
    return Array.isArray(this.permisosIds) && this.permisosIds.includes(nid);
  }

  private applyAssignedPermsToModules(): void {
    if (!Array.isArray(this.listaModulos)) return;
    const asignados = new Set((this.permisosIds || []).map(Number));

    this.listaModulos = this.listaModulos.map(m => ({
      ...m,
      permisos: (m.permisos || []).map(p => {
        const idNum = Number(p?.id ?? p?.Id);
        return {
          ...p,
          id: idNum,
          estatus: asignados.has(idNum) ? 1 : 0,
        };
      })
    }));
  }


  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  myFunctionPasswordCurrent() {
    this.type = this.type === 'password' ? 'text' : 'password';
  }

  onPasswordInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.minCaracteres = value.length >= 6;
    this.maxCaracteres = value.length <= 16;
    this.hasNumber = /\d/.test(value);
    this.hasMinus = /[a-z]/.test(value);
    this.hasMayus = /[A-Z]/.test(value);
    this.espCaracter = /[^\w\d]/.test(value);
  }

  submit() {
    if (this.idUsuario) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    if (this.loading) return;

    this.submitButton = 'Cargando...';
    this.loading = true;

    this.usuarioForm.markAllAsTouched();

    const etiquetas: Record<string, string> = {
      userName: 'Correo electrónico',
      passwordHash: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      telefono: 'Teléfono',
      nombre: 'Nombre',
      apellidoPaterno: 'Apellido Paterno',
      apellidoMaterno: 'Apellido Materno',
      fotoPerfil: 'Foto de perfil',
      idRol: 'Rol',
      estatus: 'Estatus',
      idCliente: 'Cliente',
      permisosIds: 'Permisos',
    };

    if (this.usuarioForm.invalid) {
      const camposFaltantes: string[] = [];
      Object.keys(this.usuarioForm.controls).forEach((key) => {
        const control = this.usuarioForm.get(key);
        if (control?.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const mensajes: string[] = [...camposFaltantes];
      if (this.usuarioForm.hasError('passwordMismatch')) {
        mensajes.push('Las contraseñas no coinciden');
      }

      const lista = mensajes
        .map(
          (campo, index) => `
        <div style="padding:8px 12px;border-left:4px solid #d9534f;
                    background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
          <strong style="color:#b02a37;">${index + 1}. ${campo}</strong>
        </div>`
        )
        .join('');

      this.submitButton = 'Guardar';
      this.loading = false;

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#22252f',
        html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Los siguientes <strong>campos</strong> requieren atención:
        </p>
        <div style="max-height:350px;overflow-y:auto;">${lista}</div>
      `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const {
      confirmPassword,
      idCliente,
      idRol,
      permisosIds,
      ...rest
    } = this.usuarioForm.value;

    const payload = {
      ...rest,
      idCliente: Number(idCliente),
      idRol: Number(idRol),
      permisosIds: (permisosIds || []).map((x: any) => Number(x)),
    };

    console.log('[AGREGAR] Payload listo para enviar:', payload);

    this.usuaService.agregarUsuario(payload).subscribe({
      next: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: `Se agregó un nuevo usuario de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      error: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#22252f',
          text: `Ocurrió un error al agregar el usuario.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }


  actualizar() {
  if (this.loading) return;

  this.submitButton = 'Cargando...';
  this.loading = true;

  if (!this.inputContrasena) {
    const passCtrl = this.usuarioForm.get('passwordHash');
    const confirmCtrl = this.usuarioForm.get('confirmPassword');
    passCtrl?.clearValidators();
    passCtrl?.updateValueAndValidity({ emitEvent: false });
    confirmCtrl?.clearValidators();
    confirmCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  const etiquetas: Record<string, string> = {
    userName: 'Correo electrónico',
    passwordHash: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    telefono: 'Teléfono',
    nombre: 'Nombre',
    apellidoPaterno: 'Apellido Paterno',
    apellidoMaterno: 'Apellido Materno',
    idRol: 'Rol',
    estatus: 'Estatus',
    idCliente: 'Cliente',
    permisosIds: 'Permisos'
  };

  const camposFaltantes: string[] = [];
  Object.keys(this.usuarioForm.controls).forEach((key) => {
    if (!this.inputContrasena && (key === 'passwordHash' || key === 'confirmPassword')) return;
    const control = this.usuarioForm.get(key);
    if (control?.errors?.['required']) {
      camposFaltantes.push(etiquetas[key] || key);
    }
  });

  const listaMensajes: string[] = [...camposFaltantes];
  if (this.inputContrasena && this.usuarioForm.hasError('passwordMismatch')) {
    listaMensajes.push('Las contraseñas no coinciden');
  }

  if (this.usuarioForm.invalid || listaMensajes.length > 0) {
    this.submitButton = 'Actualizar';
    this.loading = false;
    Swal.fire({
      title: '¡Faltan campos obligatorios!',
      background: '#22252f',
      html: `
        <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
          Los siguientes <strong>campos</strong> requieren atención:
        </p>
        <div style="max-height: 350px; overflow-y: auto;">
          ${listaMensajes.map((msg, idx) => `
            <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
              <strong style="color:#b02a37;">${idx + 1}. ${msg}</strong>
            </div>`).join('')}
        </div>`,
      icon: 'error',
      confirmButtonText: 'Entendido',
      customClass: { popup: 'swal2-padding swal2-border' },
    });
    return;
  }

  // ⬇️ IMPORTANTE: EXCLUIR userName
  const {
    userName,          // <- excluido del payload
    confirmPassword,
    passwordHash,
    idRol,
    idCliente,
    permisosIds,
    ...rest
  } = this.usuarioForm.value;

  const payload: any = {
    ...rest, // ya no contiene userName
    idRol: Number(idRol),
    idCliente: Number(idCliente),
    permisosIds: (permisosIds || []).map((x: any) => Number(x)),
  };

  if (this.inputContrasena && passwordHash) {
    payload.passwordHash = passwordHash;
  }

  this.usuaService.actualizarUsuario(this.idUsuario, payload).subscribe({
    next: () => {
      this.submitButton = 'Actualizar';
      this.loading = false;
      Swal.fire({
        title: '¡Operación Exitosa!',
        background: '#22252f',
        text: `Los datos del usuario se actualizaron correctamente.`,
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      this.regresar();
    },
    error: () => {
      this.submitButton = 'Actualizar';
      this.loading = false;
      Swal.fire({
        title: '¡Ops!',
        background: '#22252f',
        text: `Ocurrió un error al actualizar el usuario.`,
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
    },
  });
}



  regresar() {
    this.route.navigateByUrl('/usuarios');
  }
}
