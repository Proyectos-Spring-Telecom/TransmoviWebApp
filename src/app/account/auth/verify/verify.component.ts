import { Component, OnInit } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PasajerosService } from 'src/app/shared/services/pasajeros.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss']
})
export class VerifyComponent implements OnInit {
  verifyForm: UntypedFormGroup;
  public submitButton = 'Guardar';
  public loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private pasajService: PasajerosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.verifyForm = this.fb.group({
      codigo: ['', [Validators.required]],
    });
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.pasajService.setVerificationToken(token);
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    this.verifyForm.markAllAsTouched();
    this.verifyForm.updateValueAndValidity();
    if (this.verifyForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
          <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
            Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
            Por favor complétalos antes de continuar:
          </p>
          <div style="max-height:350px;overflow-y:auto;">
            <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
              <strong style="color:#b02a37;">1. Código de Verificación</strong>
            </div>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    const codigo = (this.verifyForm.get('codigo')!.value || '').toString().trim();
    this.pasajService.verificarPasajero(codigo).subscribe({
      next: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        this.pasajService.clearVerificationToken();
        Swal.fire({
          title: '¡Código verificado!',
          background: '#002136',
          text: 'Tu cuenta de pasajero quedó activada. Ahora puedes iniciar sesión y empezar a usar tu monedero.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Ir a iniciar sesión',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(({ isConfirmed }) => {
          if (isConfirmed) this.router.navigate(['/account', 'login']);
        });
      },
      error: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: 'Código inválido o expirado',
          background: '#002136',
          text: 'Verifica el código de activación y vuelve a intentarlo. Si el problema continúa, solicita uno nuevo o contáctanos.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}
