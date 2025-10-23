import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { fadeInRightAnimation } from 'src/app/core/animations/fade-in-right.animation';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { scaleInAnimation } from 'src/app/core/animations/scale-in.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { Credentials } from 'src/app/entities/Credentials';
import { PasajerosService } from 'src/app/shared/services/pasajeros.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-affiliation',
  templateUrl: './affiliation.component.html',
  styleUrls: ['./affiliation.component.scss'],
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
export class AffiliationComponent implements OnInit, OnDestroy {
  afiliacionPasajero: UntypedFormGroup;
  public credentials: Credentials;
  public textLogin: string = 'Iniciar Sesión';
  public idUsuario;
  submitted = false;
  error = '';
  returnUrl: string;
  public passwordType: string = 'password'
  public submitButton: string = 'Guardar';
  public loading: boolean = false;

  hide = true;
  type = 'password'
  pwFocused = false;
  hasMayus = false;
  hasMinus = false;
  hasNumber = false;
  espCaracter = false;
  minCaracteres = false;
  maxCaracteres = false;
  pwAllOk = false;
  pwGuideText = 'La contraseña debe tener al menos una mayúscula.';
  pwGuideKey = 'needUpper';

  private subs: Subscription[] = [];

  togglePassword(): void {
    this.hide = !this.hide;
  }

  myFunctionPasswordCurrent() {
    this.type = this.type === 'password' ? 'text' : 'password';
  }

  get showPwHint(): boolean {
    const c = this.afiliacionPasajero?.get('passwordHash');
    const v = (c?.value || '').toString();
    return this.pwFocused && v.length > 0;
  }

  initForm() {
    this.afiliacionPasajero = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: ['', [Validators.required]],
      apellidoMaterno: [null],
      fechaNacimiento: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      passwordHash: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{7,15}$/)
        ]
      ],
      numeroSerieMonedero: ['', [Validators.required, Validators.maxLength(50)]],
    });
  }

  constructor(
    private router: Router,
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private pasajService: PasajerosService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.subs.push(
      this.afiliacionPasajero.get('passwordHash')!.valueChanges.subscribe((raw: string) => {
        const v = (raw || '').trim();
        if (raw !== v) this.afiliacionPasajero.get('passwordHash')!.setValue(v, { emitEvent: false });

        this.hasMayus = /[A-Z]/.test(v);
        this.hasMinus = /[a-z]/.test(v);
        this.hasNumber = /\d/.test(v);
        this.espCaracter = /[^A-Za-z0-9]/.test(v) && !/\s/.test(v);
        this.minCaracteres = v.length >= 7;
        this.maxCaracteres = v.length <= 15;

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
          this.pwGuideText = 'La contraseña debe incluir al menos un símbolo y no contener espacios.';
          this.pwGuideKey = 'needSpecial';
        } else if (!(this.minCaracteres && this.maxCaracteres)) {
          this.pwGuideText = 'La contraseña debe tener entre 7 y 15 caracteres.';
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
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    this.afiliacionPasajero.markAllAsTouched();
    this.afiliacionPasajero.updateValueAndValidity();

    if (this.afiliacionPasajero.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        nombre: 'Nombre',
        apellidoPaterno: 'Apellido Paterno',
        apellidoMaterno: 'Apellido Materno',
        fechaNacimiento: 'Fecha de Nacimiento',
        telefono: 'Teléfono',
        correo: 'Correo Electrónico',
        passwordHash: 'Contraseña',
        numeroSerieMonedero: 'Número de Serie',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.afiliacionPasajero.controls).forEach(key => {
        const control = this.afiliacionPasajero.get(key);
        if (control?.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
      <div style="padding: 8px 12px; border-left: 4px solid #d9534f; background: #caa8a8; text-align: center; margin-bottom: 8px; border-radius: 4px;">
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
        customClass: { popup: 'swal2-padding swal2-border' }
      });
      return;
    }

    this.afiliacionPasajero.removeControl('id');

    this.pasajService.agregarPasajeroAfiliacion(this.afiliacionPasajero.value).subscribe(
  (response) => {
    this.submitButton = 'Guardar';
    this.loading = false;

    Swal.fire({
      title: '¡Listo! Tu afiliación quedó registrada.',
      background: '#002136',
      text: 'Tu cuenta de pasajero fue creada. Revisa tu correo y abre el enlace de verificación para activarla y poder iniciar sesión.',
      icon: 'success',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Ir a iniciar sesión',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(({ isConfirmed }) => {
      if (isConfirmed) {
        this.router.navigate(['/account', 'login']);
      }
    });
  },
  (error) => {
    this.submitButton = 'Guardar';
    this.loading = false;

    Swal.fire({
      title: '¡Ups! No pudimos completar tu afiliación',
      background: '#002136',
      text: 'Revisa que tus datos estén correctos y vuelve a intentarlo. Si el problema continúa, contáctanos para ayudarte.',
      icon: 'error',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Entendido'
    });
  }
);

  }
}