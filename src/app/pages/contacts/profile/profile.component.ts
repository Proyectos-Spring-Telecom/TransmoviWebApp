import { Component, Input, OnInit } from '@angular/core';

import { revenueBarChart, statData } from './data';

import { ChartType } from './profile.model';
import { fadeInRightAnimation } from 'src/app/core/animations/fade-in-right.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';
import { animate, style, transition, trigger } from '@angular/animations';

export interface UserMini {
  nombre: string;
  usuario?: string;
  rol: string;
  email: string;
  telefono?: string;
  ubicacion?: string;
  bio?: string;
  avatarUrl?: string;
  joinedAt?: string | Date;
  stats?: {
    posts?: number;
    seguidores?: number;
    siguiendo?: number;
    reputacion?: number;
  };
  skills?: string[];
  tags?: string[];
}
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  animations: [
    fadeInRightAnimation,
    trigger('hintSwap', [
      // Re-animar en cualquier cambio de estado/mensaje
      transition('* => *', [
        animate(
          '90ms ease-in',
          style({ opacity: 0, transform: 'translateY(-4px)' })
        ),
        animate(
          '180ms 40ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})

/**
 * Contacts-profile component
 */
export class ProfileComponent {
  @Input() user: UserMini = {
    nombre: 'Jane Cooper',
    usuario: '@janecooper',
    rol: 'Product Manager',
    email: 'jane.cooper@example.com',
    telefono: '+52 55 1234 5678',
    ubicacion: 'CDMX, México',
    bio: 'Creando productos útiles con foco en datos y experiencia.',
    avatarUrl: 'assets/images/user_default.png',
    joinedAt: new Date('2023-07-18'),
    stats: { posts: 124, seguidores: 3482, siguiendo: 198, reputacion: 97 },
    skills: ['Angular', 'DevExtreme', 'RxJS', 'UX Writing'],
    tags: ['Activo'],
  };
  public showId: any;
  public showNombre: any;
  public showApellidoPaterno: any;
  public showApellidoMaterno: any;
  public showTelefono: any;
  public showCorreo: any;
  public showRol: any;
  public showRolDescripcion: any;
  public showImage: any;
  public showRolExtraDescripcion: any;
  public showCreacion: any;
  ultimoLogin: string | null = null;

  constructor(
    private fb: FormBuilder,
    private users: AuthenticationService,
    private usuarioService: UsuariosService
  ) {
    const user = this.users.getUser();

    const sanitize = (value: any): string => {
      return value && value !== 'null' ? value : '';
    };

    this.showNombre = sanitize(user.nombre);
    this.showApellidoPaterno = sanitize(user.apellidoPaterno);
    this.showApellidoMaterno = sanitize(user.apellidoMaterno);
    this.showCreacion = this.formatFechaCreacion(user?.fechaCreacion);
    this.ultimoLogin = this.formatFechaCreacion(user?.ultimoLogin);
    if (user.telefono == null || user.telefono == 'null') {
      this.showTelefono = 'Sin registro';
    } else {
      this.showTelefono = user.telefono;
    }
    this.showCorreo = user.userName;
    this.showRol = user.rol.nombre;
    this.showRolDescripcion = user.rol.descripcion;
    this.showRolExtraDescripcion = this.getDescripcionRol(user.rol.nombre);
    this.showImage = user.fotoPerfil || 'assets/images/user_default.png';
    this.showId = user.id;
  }

  // propiedad usada por la vista
  showUltimoLogin: string | null = null;

  // tu formateador (el que ya tienes)
  private formatFechaCreacion(raw: any): string {
    if (!raw || raw === 'null') return ''; // por si viene la cadena "null"
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw); // fallback si no parsea
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
  }

  defaultAvatar = 'assets/images/user_default.png';

  get resolvedAvatar(): string {
    const v = (this.showImage ?? '').toString().trim();
    if (!v || v === 'null' || v === 'undefined' || v === '[object Object]') {
      return this.defaultAvatar;
    }
    return v;
  }

  onAvatarError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (img && img.src !== this.defaultAvatar) {
      img.src = this.defaultAvatar;
    }
  }

  /**
   * Descripción personalizada según el rol.
   */
  private getDescripcionRol(rol: string): string {
    switch (rol?.toUpperCase()) {
      case 'SA':
        return 'Acceso total al sistema, puede gestionar usuarios, configuraciones, operaciones y seguridad sin restricciones.';
      case 'Administrador':
        return 'Responsable de la gestión general, incluyendo altas y bajas de recursos, configuración básica y soporte a operadores.';
      case 'Operador':
        return 'Enfocado únicamente en sus propias rutas y actividades asignadas. No tiene acceso a información de otros usuarios ni a configuraciones críticas.';
      case 'Reportes':
        return 'Encargado de la generación, análisis y consulta de reportes operativos y administrativos, con acceso especializado a datos históricos y métricas.';
      case 'Pasajeros':
        return 'Acceso limitado a la información relacionada con sus viajes, historial de rutas y notificaciones relevantes.';
      default:
        return 'Rol sin descripción extra definida.';
    }
  }

  passwordForm: FormGroup = this.fb.group(
    {
      contrasenaActual: ['', Validators.required],
      contrasenaNueva: ['', [Validators.required, Validators.minLength(8)]],
      contrasenaNuevaConfirmacion: ['', Validators.required],
    },
    { validators: this.passwordsMatchValidator }
  );

  passwordStrengthMsg = '';
  passwordStrengthColor = '';
  hintVersion = 0;
  isAllValid = false;

  onPasswordInput(): void {
    const value = this.passwordForm.get('contrasenaNueva')?.value || '';

    // Usa tu propia lógica ya corregida; dejo un ejemplo neutro:
    const checks = {
      upper: /\p{Lu}/u.test(value), // mayúscula (Unicode)
      lower: /\p{Ll}/u.test(value), // minúscula (Unicode)
      number: /[0-9]/.test(value), // número
      special: /[^\p{L}\p{N}]/u.test(value), // no letra y no número (Unicode)
      length: value.length >= 8 && value.length <= 16,
    };

    // Primero otros requisitos; la longitud solo se muestra al final si TODO lo demás está ok
    const missing: string[] = [];
    if (!checks.upper) missing.push('una mayúscula');
    if (!checks.lower) missing.push('una minúscula');
    if (!checks.number) missing.push('un número');
    if (!checks.special) missing.push('un carácter especial');

    const allOtherValid =
      checks.upper && checks.lower && checks.number && checks.special;
    if (allOtherValid && !checks.length)
      missing.push('entre 8 y 16 caracteres');

    this.isAllValid = missing.length === 0;

    const prevMsg = this.passwordStrengthMsg;
    if (this.isAllValid) {
      this.passwordStrengthMsg = 'Contraseña válida';
      this.passwordStrengthColor = 'valid';
    } else {
      this.passwordStrengthMsg = 'Debe incluir: ' + missing.join(', ') + '.';
      this.passwordStrengthColor = 'invalid';
    }

    // Si el mensaje cambió, incrementa versión para re-animar
    if (this.passwordStrengthMsg !== prevMsg) {
      this.hintVersion++;
    }
  }

  confirmMsg = '';
  confirmState: 'neutral' | 'valid' | 'invalid' = 'neutral';

  updateConfirmState(): void {
    const newPwd = this.passwordForm.get('contrasenaNueva')?.value || '';
    const conf =
      this.passwordForm.get('contrasenaNuevaConfirmacion')?.value || '';

    if (!newPwd || !conf) {
      this.confirmMsg = '';
      this.confirmState = 'neutral';
      return;
    }

    if (newPwd === conf) {
      this.confirmMsg = 'Las contraseñas coinciden';
      this.confirmState = 'valid';
    } else {
      this.confirmMsg = 'Las contraseñas no coinciden';
      this.confirmState = 'invalid';
    }
  }

  get canSave(): boolean {
    const f = this.passwordForm;
    const a = f.get('contrasenaActual')?.value?.trim();
    const n = f.get('contrasenaNueva')?.value;
    const c = f.get('contrasenaNuevaConfirmacion')?.value;

    const allFilled = !!a && !!n && !!c;
    const match = n === c;

    return allFilled && match && !this.loading;
  }
  dryRun = true; // ponlo en false cuando quieras ejecutar de verdad

  actualizarContrasena(): void {
    const body = {
      contrasenaActual: this.passwordForm.get('contrasenaActual')?.value,
      contrasenaNueva: this.passwordForm.get('contrasenaNueva')?.value,
      contrasenaNuevaConfirmacion: this.passwordForm.get(
        'contrasenaNuevaConfirmacion'
      )?.value,
    };

    console.log('[DRY RUN] Body a enviar:', body, 'idUsuario:', this.showId);

    if (this.dryRun) {
      Swal.fire({
        background: '#002136',
        title: 'Vista previa',
        icon: 'info',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK',
      });
      return;
    }

    this.usuarioService.actualizarContrasena(this.showId, body).subscribe({
      next: (response: any) => {
        Swal.fire({
          background: '#002136',
          title: '¡Contraseña actualizada!',
          text: 'Tu contraseña ha sido cambiada correctamente.',
          icon: 'success',
          confirmButtonColor: '#28a745',
          confirmButtonText: 'Aceptar',
        });
        this.passwordForm.reset();
      },
      error: (error) => {
        let mensaje = 'Ocurrió un error al actualizar la contraseña.';
        if (error.error?.message) {
          mensaje = error.error.message;
        }

        Swal.fire({
          title: 'Error',
          text: mensaje,
          icon: 'error',
          background: '#002136',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Reintentar',
        });
      },
    });
  }

  show = { curr: false, neu: false, conf: false };
  loading = false;

  t = (c: string): AbstractControl => this.passwordForm.get(c)!;

  private passwordsMatchValidator(
    group: AbstractControl
  ): ValidationErrors | null {
    const a = group.get('newPassword')?.value;
    const b = group.get('confirmPassword')?.value;
    return a && b && a !== b ? { passwordMismatch: true } : null;
  }

  onResetPassword(): void {
    this.passwordForm.reset();
    this.show = { curr: false, neu: false, conf: false };
  }

  async onSubmitPassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    try {
      const { currentPassword, newPassword } = this.passwordForm.value;
      // TODO: llamar servicio real
      // await this.authService.updatePassword({ currentPassword, newPassword }).toPromise();
      this.onResetPassword();
    } catch (e) {
      // manejar error UI
    } finally {
      this.loading = false;
    }
  }

  trackByIndex = (i: number) => i;
}
