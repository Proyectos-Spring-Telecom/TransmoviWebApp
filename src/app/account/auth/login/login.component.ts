import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators,FormBuilder, FormGroup } from '@angular/forms';

import { catchError, finalize, Observable, Subject, throwError } from 'rxjs';
import { AuthenticationService } from '../../../core/services/auth.service';
import { Credentials } from '../../../entities/Credentials';
import { User } from '../../../entities/User';
import { ActivatedRoute, Router } from '@angular/router';
// import { ToastrService } from 'ngx-toastr';

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

/**
 * Login component
 */
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


  // set the currenr year
  year: number = new Date().getFullYear();

  // tslint:disable-next-line: max-line-length
  constructor(private router: Router,
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.initForm();
    document.body.setAttribute('class', 'authentication-bg');

    

    // reset login status
    // this.authenticationService.logout();
    // get return url from route parameters or default to '/'
    // tslint:disable-next-line: no-string-literal
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  cambiarContraseñas(){
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
      UserName: ['', [Validators.required, Validators.email]],
      Password: ['', [Validators.required]],
      // email: ['admin@themesbrand.com', [Validators.required, Validators.email]],
      // password: ['123456', [Validators.required]],
    });
  }

  ngOnDestroy() { 
    document.body.classList.remove('authentication-bg')
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  /**
   * Form submit
   */
  // onSubmit() {
  //   this.submitted = true;

  //   // stop here if form is invalid
  //   if (this.loginForm.invalid) {
  //     return;
  //   } else {
  //     if (environment.defaultauth === 'firebase') {
  //       this.auth.login(this.f.email.value, this.f.password.value).then((res: any) => {
  //         document.body.removeAttribute('class');
  //         this.router.navigate(['/']);
  //       })
  //         .catch(error => {
  //           this.error = error ? error : '';
  //         });
  //     } else {
  //       // this.authFackservice.login(this.f.email.value, this.f.password.value)
  //       //   .pipe(first())
  //       //   .subscribe(
  //       //     data => {
  //       //       this.router.navigate(['/']);
  //       //     },
  //       //     error => {
  //       //       this.error = error ? error : '';
  //       //     });
  //     }
  //   }
  // }
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
      // 🔹 Convierte [{idPermiso:"6"}, ...] → ["6", ...]
      const permisosIds = (result.permisos ?? []).map((p: any) => String(p.idPermiso));
      result.permisos = permisosIds;

      this.auth.setData(result);             // guarda ["6","7",...]
      console.log('Permisos normalizados:', this.auth.getPermissions());

      this.router.navigate(['/']);
      this.toastr.success(`Bienvenido al Sistema`, '¡Operación Exitosa!');
      this.loading = false;
      this.textLogin = 'Iniciar Sesión';
    }, 700);
  });
}


// onSubmit(){
//   const data = {
//     "id": '7',
//     "nombre": "luis enrique",
//     "email": "luisnm1@gmail.com",
//     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MTAxOTY5MjEsImV4cCI6MTcxMDIwMDUyMX0.73QOGXDkxbXS7oSjWxSMyt-LKg0xalqC_o3jVGGQD2U",
//     "permisos": [
//         {
//             "IdPermiso": 3
//         },
//         {
//             "IdPermiso": 4
//         },
//         {
//             "IdPermiso": 5
//         },
//         {
//             "IdPermiso": 8
//         },
//         {
//             "IdPermiso": 6
//         },
//         {
//             "IdPermiso": 7
//         }
//     ]
// };
//   this.auth.setData(data);
//   this.router.navigate(['']);
// }
}
