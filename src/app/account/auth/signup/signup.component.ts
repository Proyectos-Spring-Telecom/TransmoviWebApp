import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { scaleInAnimation } from 'src/app/core/animations/scale-in.animation';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { fadeInRightAnimation } from 'src/app/core/animations/fade-in-right.animation';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  animations: [fadeInRightAnimation, fadeInUpAnimation, scaleInAnimation,
    trigger('fadeOnChange', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(4px)' }),
        animate('160ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(4px)' }),
        animate('160ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('120ms ease-in', style({ opacity: 0, transform: 'translateY(-4px)' }))
      ])
    ])
  ]
})

export class SignupComponent implements OnInit, OnDestroy {
  signupForm!: UntypedFormGroup;
  submitted = false;
  loading = false;
  type: 'text' | 'password' = 'password';
  resetToken: string | null = null;
  hasMayus = false;
  hasMinus = false;
  hasNumber = false;
  espCaracter = false;
  minCaracteres = false;
  maxCaracteres = false;
  pwAllOk = false;
  pwGuideText = 'La contraseña debe tener al menos una mayúscula.';
  pwGuideKey = 'needUpper';
  matchText = 'Las contraseñas no coinciden';
  matchKey = 'noMatch';

  private subs: Subscription[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private user: UsuariosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.resetToken =
      sessionStorage.getItem('reset_token') || this.route.snapshot.queryParamMap.get('token');

    this.signupForm = this.fb.group({
      userName: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    });
    
    this.subs.push(
      this.signupForm.get('password')!.valueChanges.subscribe((val: string) => {
        const v = val || '';
        this.hasMayus = /[A-Z]/.test(v);
        this.hasMinus = /[a-z]/.test(v);
        this.hasNumber = /\d/.test(v);
        this.espCaracter = /[^A-Za-z0-9]/.test(v);
        this.minCaracteres = v.length > 6;
        this.maxCaracteres = v.length < 16;

        if (!this.hasMayus) {
          this.pwGuideText = 'La contraseña debe tener al menos una mayúscula.';
          this.pwGuideKey = 'needUpper';
        } else if (!this.hasMinus) {
          this.pwGuideText = 'La contraseña debe tener al menos una minúscula.';
          this.pwGuideKey = 'needLower';
        } else if (!this.hasNumber) {
          this.pwGuideText = 'La contraseña debe tener al menos un número.';
          this.pwGuideKey = 'needNumber';
        } else if (!this.espCaracter) {
          this.pwGuideText = 'La contraseña debe tener al menos un carácter no alfanumérico (ej. #?!&).';
          this.pwGuideKey = 'needSpecial';
        } else if (!(this.minCaracteres && this.maxCaracteres)) {
          this.pwGuideText = 'La contraseña debe tener al menos más de 6 y menos de 16 caracteres.';
          this.pwGuideKey = 'needLength';
        } else {
          this.pwGuideText = 'Contraseña válida.';
          this.pwGuideKey = 'ok';
        }

        this.pwAllOk =
          this.hasMayus &&
          this.hasMinus &&
          this.hasNumber &&
          this.espCaracter &&
          this.minCaracteres &&
          this.maxCaracteres;
        this.updateMatchHint();
      })
    );

    this.subs.push(
      this.signupForm.get('confirmPassword')!.valueChanges.subscribe(() => {
        this.updateMatchHint();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  myFunctionPasswordCurrent(): void {
    this.type = this.type === 'password' ? 'text' : 'password';
  }

  get showPwHint(): boolean {
    const c = this.signupForm.get('password')!;
    return !!c.value || c.dirty || c.touched;
  }

  get showMatchHint(): boolean {
    const pass = this.signupForm.get('password')!.value;
    const confirm = this.signupForm.get('confirmPassword')!;
    return !!pass && (confirm.dirty || confirm.touched);
  }

  get passwordsMatch(): boolean {
    const pass = this.signupForm.get('password')!.value || '';
    const conf = this.signupForm.get('confirmPassword')!.value || '';
    return pass.length > 0 && conf.length > 0 && pass === conf;
  }

  private updateMatchHint(): void {
    const ok = this.passwordsMatch;
    this.matchText = ok ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden';
    this.matchKey = ok ? 'match' : 'noMatch';
  }
  
  agregar(): void {
    this.submitted = true;

    if (this.signupForm.invalid || !this.pwAllOk || !this.passwordsMatch) {
      this.signupForm.markAllAsTouched();
      return;
    }

    if (!this.resetToken) {
      Swal.fire({
        title: '¡Ops!',
        background: '#002136',
        text: 'No se encontró el token de recuperación. Vuelve a solicitarlo.',
        icon: 'error',
        confirmButtonText: 'Confirmar'
      });
      return;
    }

    this.loading = true;
    const { userName, password } = this.signupForm.value;

    this.user.cambioContrasena({ userName, password }, this.resetToken!).subscribe({
      next: async () => {
        await Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: '¡Listo! Hemos actualizado tu contraseña.',
          icon: 'success',
          confirmButtonText: 'Ir a Iniciar Sesión',
          allowOutsideClick: false,
          allowEscapeKey: false
        });

        sessionStorage.removeItem('reset_token');
        this.signupForm.reset();
        this.submitted = false;

        this.router.navigate(['/account', 'login']);
      }
      ,
      error: () => {
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: 'Ocurrió un error al hacer el cambio de contraseña.',
          icon: 'error',
          confirmButtonText: 'Confirmar'
        });
      },
      complete: () => this.loading = false
    });
  }
}