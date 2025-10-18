import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthenticationService } from '../../../core/services/auth.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';
import { scaleInAnimation } from 'src/app/core/animations/scale-in.animation';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { fadeInRightAnimation } from 'src/app/core/animations/fade-in-right.animation';

@Component({
  selector: 'app-passwordreset',
  templateUrl: './passwordreset.component.html',
  styleUrls: ['./passwordreset.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [fadeInRightAnimation, fadeInUpAnimation, scaleInAnimation]
})

export class PasswordresetComponent implements OnInit, AfterViewInit {
  resetForm: UntypedFormGroup;
  submitted = false;
  error = '';
  success = '';
  loading = false;
  year: number = new Date().getFullYear();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private user: UsuariosService,
    private authenticationService: AuthenticationService
  ) { }

  ngOnInit() {
    document.body.setAttribute('class', 'authentication-bg');
    this.resetForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.email]],
    });
  }

  ngAfterViewInit() {
  }

  type = 'password'
  myFunctionPasswordCurrent() {
    if (this.type === "password") {
      this.type = "text";
    } else {
      this.type = "password";
    }
  }

  ngOnDestroy() {
    document.body.classList.remove('authentication-bg')
  }

  get f() { return this.resetForm.controls; }

  agregar() {
    this.submitted = true;

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      const etiquetas: any = {
        userName: 'Correo Electrónico',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.resetForm.controls).forEach(key => {
        const control = this.resetForm.get(key);
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

    this.loading = true;
    this.user.solicitarCambioContrasena(this.resetForm.value).subscribe({
      next: async (token: string) => {
        sessionStorage.setItem('reset_token', token);
        await Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: 'Hemos enviado instrucciones para restablecer tu contraseña a tu correo electrónico.',
          icon: 'success',
          confirmButtonText: 'Ir a Iniciar Sesión',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });
        this.resetForm.reset();
        this.submitted = false;
        this.router.navigate(['/account', 'login']);
      },

      error: async () => {
        await Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: 'Ocurrió un error al hacer la solicitud del cambio de contraseña.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      },

      complete: () => {
        this.loading = false;
      }
    });
  }
}