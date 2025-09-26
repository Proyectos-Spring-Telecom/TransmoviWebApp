import { Component, Input, OnInit } from '@angular/core';

import { revenueBarChart, statData } from './data';

import { ChartType } from './profile.model';
import { fadeInRightAnimation } from 'src/app/core/animations/fade-in-right.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';

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
  stats?: { posts?: number; seguidores?: number; siguiendo?: number; reputacion?: number };
  skills?: string[];
  tags?: string[];
}
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  animations: [fadeInRightAnimation],
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
    tags: ['Activo',]
  };
  public showNombre: any;
  public showApellidoPaterno: any;
  public showApellidoMaterno: any;
  public showTelefono: any;
  public showCorreo: any;
  public showRol: any;
  public showRolDescripcion: any;
  public showImage: any;
  public showRolExtraDescripcion: any

  constructor(private fb: FormBuilder, private users: AuthenticationService) {
    const user = this.users.getUser();

    const sanitize = (value: any): string => {
  return (value && value !== 'null') ? value : '';
};

this.showNombre = sanitize(user.nombre);
this.showApellidoPaterno = sanitize(user.apellidoPaterno);
this.showApellidoMaterno = sanitize(user.apellidoMaterno);

    
    this.showTelefono = user.telefono;
    this.showCorreo = user.userName;
    this.showRol = user.rol.nombre;
    this.showRolDescripcion = user.rol.descripcion; // 🔴 se queda como está
    this.showRolExtraDescripcion = this.getDescripcionRol(user.rol.nombre); // 🔵 nueva propiedad
    this.showImage = user.fotoPerfil;
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
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordsMatchValidator }
  );

  show = { curr: false, neu: false, conf: false };
  loading = false;

  t = (c: string): AbstractControl => this.passwordForm.get(c)!;

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
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
