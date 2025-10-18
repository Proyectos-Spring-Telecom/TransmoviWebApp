import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormBuilder, FormGroup } from '@angular/forms';

import { catchError, finalize, Observable, Subject, throwError } from 'rxjs';
import { AuthenticationService } from '../../../core/services/auth.service';
import { Credentials } from '../../../entities/Credentials';
import { User } from '../../../entities/User';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { fadeInRightAnimation } from 'src/app/core/animations/fade-in-right.animation';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { scaleInAnimation } from 'src/app/core/animations/scale-in.animation';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [fadeInRightAnimation, fadeInUpAnimation, scaleInAnimation]
})

export class LoginComponent implements OnInit {

  loginForm: UntypedFormGroup;
  public credentials: Credentials;
  public textLogin: string = 'Iniciar Sesión';
  public idUsuario;
  submitted = false;
  error = '';
  returnUrl: string;
  public loading: boolean = false
  public passwordType: string = "password"

  hide = true;

  togglePassword(): void {
    this.hide = !this.hide;
  }
  form!: FormGroup;
  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      console.log('LOGIN OK', this.form.value);
    }, 1200);
  }

  year: number = new Date().getFullYear()
  constructor(private router: Router,
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.initForm();
    document.body.setAttribute('class', 'authentication-bg');
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  cambiarContraseñas() {
    this.router.navigateByUrl('/account/reset-password')
  }

  type = 'password'
  myFunctionPasswordCurrent() {
    if (this.type === "password") {
      this.type = "text";
    } else {
      this.type = "password";
    }
  }

  initForm() {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnDestroy() {
    document.body.classList.remove('authentication-bg')
  }

  get f() { return this.loginForm.controls; }


  onSubmit() {
    this.loading = true;
    this.textLogin = 'Cargando...';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.credentials = this.loginForm.value;

    this.auth.authenticate(this.credentials).pipe(
      catchError((error) => {
        this.loading = false;
        this.textLogin = 'Iniciar Sesión';
        this.toastr.error("Usuario y/o contraseña incorrectos");
        return throwError(() => "");
      })
    ).subscribe((result: any) => {
      setTimeout(() => {
        const permisosIds = (result.permisos ?? []).map((p: any) => String(p.idPermiso));
        result.permisos = permisosIds;

        this.auth.setData(result);
        console.log('Permisos normalizados:', this.auth.getPermissions());

        this.router.navigate(['/']);
        this.toastr.success(`Bienvenido al Sistema`, '¡Operación Exitosa!');
        this.loading = false;
        this.textLogin = 'Iniciar Sesión';
      }, 700);
    });
  }
}
