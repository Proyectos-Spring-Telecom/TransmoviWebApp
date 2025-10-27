import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
        fotoPerfil: [null],
        idRol: [null],
        emailConfirmado: [null],
        estatus: [1],
        idCliente: [null],
        permisosIds: this.fb.control<number[]>([]),
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
          estatus: p?.Estatus ?? p?.estatus,
        })),
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
        id: Number(c.id),
      }));
    });
  }

  private getPermisoId(p: any): number | null {
    const val = p?.idPermiso ?? p?.IdPermiso ?? p?.id ?? p?.Id ?? null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }

  trackModulo = (_: number, m: any) => m.id ?? m.Id;
  trackPermiso = (_: number, p: any) => p.id ?? p.Id;

  onToggle(permiso: any, checked: boolean) {
    const idNum = this.getPermisoId(permiso);
    if (idNum === null) return;
    permiso.estatus = checked ? 1 : 0;
    if (checked) {
      if (!this.permisosIds.includes(idNum)) this.permisosIds.push(idNum);
    } else {
      this.permisosIds = this.permisosIds.filter((id) => id !== idNum);
    }
    this.usuarioForm.patchValue({ permisosIds: this.permisosIds });
  }

  obtenerUsuarioID() {
    this.usuaService.obtenerUsuario(this.idUsuario).subscribe((response: any) => {
      console.log('[USUARIO][RAW]', response);

      const data = response?.data ?? {};

      const usuarios = Array.isArray(data?.usuario)
        ? data.usuario
        : Array.isArray(data?.usuarios)
          ? data.usuarios
          : data?.usuario
            ? [data.usuario]
            : [];

      const u = usuarios[0] ?? {};

      const perms = Array.isArray(data?.permiso)
        ? data.permiso
        : Array.isArray(data?.permisos)
          ? data.permisos
          : [];

      this.permisosIds = Array.from(
        new Set(
          (perms || [])
            .filter((p: any) => Number(p?.estatus) === 1)
            .map((p: any) => this.getPermisoId(p))
            .filter((n: any): n is number => Number.isFinite(n))
        )
      );

      this.usuarioForm.patchValue({ permisosIds: this.permisosIds });
      this.applyAssignedPermsToModules?.();

      this.usuarioForm.patchValue({
        userName: u?.userName ?? '',
        telefono: u?.telefono ?? '',
        nombre: u?.nombre ?? '',
        apellidoPaterno: u?.apellidoPaterno ?? '',
        apellidoMaterno: u?.apellidoMaterno ?? '',
        fotoPerfil: u?.fotoPerfil ?? this.usuarioForm.get('fotoPerfil')?.value,
        estatus: Number(u?.estatus ?? 1),
        idRol: u?.idRol != null ? Number(u.idRol) : null,
        idCliente: u?.idCliente != null ? Number(u.idCliente) : null,
        permisosIds: this.permisosIds,
      });

    });
  }


  isPermisoAsignado(id: any): boolean {
    const nid = this.getPermisoId({ idPermiso: id, id });
    return (
      nid !== null &&
      Array.isArray(this.permisosIds) &&
      this.permisosIds.includes(nid)
    );
  }

  private applyAssignedPermsToModules(): void {
    if (!Array.isArray(this.listaModulos)) return;
    const asignados = new Set((this.permisosIds || []).map(Number));
    this.listaModulos = this.listaModulos.map((m) => ({
      ...m,
      permisos: (m.permisos || []).map((p) => {
        const idNum = Number(p?.id ?? p?.Id);
        return {
          ...p,
          id: idNum,
          estatus: asignados.has(idNum) ? 1 : 0,
        };
      }),
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

  @ViewChild('logoFileInput') logoFileInput!: ElementRef<HTMLInputElement>;
  logoPreviewUrl: string | ArrayBuffer | null = null;
  logoDragging = false;
  private logoFile: File | null = null;

  private readonly DEFAULT_AVATAR_URL = 'https://wallpapercat.com/w/full/9/5/a/945731-3840x2160-desktop-4k-matte-black-wallpaper-image.jpg';
  private readonly MAX_MB = 3;
  private readonly S3_FOLDER = 'usuarios';
  private readonly S3_ID_MODULE = 2;

  private isImage(file: File) {
    return /^image\/(png|jpe?g|webp)$/i.test(file.type);
  }
  private isAllowed(file: File) {
    const okImg = this.isImage(file);
    const okDoc = /(pdf|msword|officedocument|excel)/i.test(file.type);
    return (okImg || okDoc) && file.size <= this.MAX_MB * 1024 * 1024;
  }
  private loadPreview(
    file: File,
    setter: (url: string | ArrayBuffer | null) => void
  ) {
    if (!this.isImage(file)) {
      setter(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.readAsDataURL(file);
  }

  private buildS3Payload(file: File | null): FormData {
    const fd = new FormData();
    if (file) {
      fd.append('file', file, file.name);
    } else {
      fd.append('file', this.DEFAULT_AVATAR_URL);
    }
    fd.append('folder', this.S3_FOLDER);
    fd.append('idModule', String(this.S3_ID_MODULE));
    return fd;
  }

  private uploadLogoAuto(): void {
    const fd = new FormData();

    if (this.logoFile) {
      fd.append('file', this.logoFile, this.logoFile.name);
    } else {
      fd.append('file', this.DEFAULT_AVATAR_URL);
    }
    fd.append('folder', 'usuarios');
    fd.append('idModule', '2');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        console.log('Respuesta del backend:', res);
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';

        if (url) {
          this.usuarioForm.patchValue({ fotoPerfil: url });
          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url)) {
            this.logoPreviewUrl = url;
          }
        }
      },
      error: (err) => {
        console.error('Error al subir archivo', err);
      },
    });
  }

  openLogoFilePicker() {
    this.logoFileInput.nativeElement.click();
  }

  onLogoDragOver(e: DragEvent) {
    e.preventDefault();
    this.logoDragging = true;
  }

  onLogoDragLeave(_e: DragEvent) {
    this.logoDragging = false;
  }

  onLogoDrop(e: DragEvent) {
    e.preventDefault();
    this.logoDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleLogoFile(f);
  }

  onLogoFileSelected(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.handleLogoFile(f);
  }

  clearLogoImage(e: Event) {
    e.stopPropagation();
    this.logoPreviewUrl = null;
    this.logoFileInput.nativeElement.value = '';
    this.logoFile = null;
    this.usuarioForm.patchValue({ logotipo: this.DEFAULT_AVATAR_URL });
    this.usuarioForm.get('logotipo')?.setErrors(null);
    this.uploadLogoAuto();
  }

  private handleLogoFile(file: File) {
    if (!this.isAllowed(file)) {
      this.usuarioForm.get('logotipo')?.setErrors({ invalid: true });
      return;
    }
    this.loadPreview(file, (url) => (this.logoPreviewUrl = url));
    this.logoFile = file;
    this.usuarioForm.patchValue({ logotipo: file });
    this.usuarioForm.get('logotipo')?.setErrors(null);
    this.uploadLogoAuto();
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
        background: '#002136',
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

    const { confirmPassword, idCliente, idRol, permisosIds, ...rest } = this.usuarioForm.value;

    const toNumOrNull = (v: any) =>
      v === null || v === undefined || v === '' ? null : Number(v);

    const payload = {
      ...rest,
      idCliente: toNumOrNull(idCliente),
      idRol: toNumOrNull(idRol),
      permisosIds: (permisosIds || []).map((x: any) => Number(x)),
    };

    if (!payload.permisosIds || payload.permisosIds.length === 0) {
      this.submitButton = 'Guardar';
      this.loading = false;
      this.mostrarAlertaPermisos();
      return;
    }

    this.usuaService.agregarUsuario(payload).subscribe({
      next: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
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
          background: '#002136',
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
      permisosIds: 'Permisos',
    };
    const camposFaltantes: string[] = [];
    Object.keys(this.usuarioForm.controls).forEach((key) => {
      if (
        !this.inputContrasena &&
        (key === 'passwordHash' || key === 'confirmPassword')
      )
        return;
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
        background: '#002136',
        html: `
        <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
          Los siguientes <strong>campos</strong> requieren atención:
        </p>
        <div style="max-height: 350px; overflow-y: auto;">
          ${listaMensajes
            .map(
              (msg, idx) => `
            <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
              <strong style="color:#b02a37;">${idx + 1}. ${msg}</strong>
            </div>`
            )
            .join('')}
        </div>`,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }
    const {
      userName,
      confirmPassword,
      passwordHash,
      idRol,
      idCliente,
      permisosIds,
      ...rest
    } = this.usuarioForm.value;
    const payload: any = {
      ...rest,
      idRol: Number(idRol),
      idCliente: Number(idCliente),
      permisosIds: (permisosIds || []).map((x: any) => Number(x)),
    };
    if (!payload.permisosIds || payload.permisosIds.length === 0) {
      this.submitButton = 'Actualizar';
      this.loading = false;
      this.mostrarAlertaPermisos();
      return;
    }
    if (this.inputContrasena && passwordHash) {
      payload.passwordHash = passwordHash;
    }
    this.usuaService.actualizarUsuario(this.idUsuario, payload).subscribe({
      next: () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
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
          background: '#002136',
          text: `Ocurrió un error al actualizar el usuario.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  private mostrarAlertaPermisos(): void {
    const html = `
      <div style="max-height:350px;overflow-y:auto;">
        <div style="padding:8px 12px;border-left:4px solid #d9534f;
                    background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
          <strong style="color:#b02a37;">Debes asignar los permisos correspondientes al usuario.</strong>
        </div>
      </div>
    `;
    Swal.fire({
      title: '¡Faltan permisos!',
      background: '#002136',
      html,
      icon: 'warning',
      confirmButtonText: 'De acuerdo',
      showCancelButton: false,
      customClass: { popup: 'swal2-padding swal2-border' },
    });
  }

  regresar() {
    this.route.navigateByUrl('/usuarios');
  }
}
