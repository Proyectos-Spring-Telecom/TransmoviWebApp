import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, EMPTY } from 'rxjs';
import { AuthenticationService } from '../../../core/services/auth.service';
import { Credentials } from '../../../entities/Credentials';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: []
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  emailForm!: FormGroup;
  verifyForm!: FormGroup;

  credentials!: Credentials;
  textLogin: string = 'Iniciar Sesión';
  submitted = false;
  error = '';
  returnUrl: string = '/';
  loading: boolean = false;

  type: 'password' | 'text' = 'password';
  hide = true;

  step: 'login' | 'email' | 'otp' = 'login';

  otp: string[] = ['', '', '', ''];
  resendDisabled = false;
  resendSeconds = 60;
  private resendTimer?: number;
  resendMsg: string | null = null;

  constructor(
    private router: Router,
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initForms();
    document.body.setAttribute('class', 'authentication-bg');
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  ngOnDestroy() {
    document.body.classList.remove('authentication-bg');
    if (this.resendTimer) clearInterval(this.resendTimer as any);
  }

  get f() { return this.loginForm.controls; }

  myFunctionPasswordCurrent() {
    this.type = this.type === 'password' ? 'text' : 'password';
  }

  initForms() {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.emailForm = this.fb.group({
      userName: ['', [Validators.required, Validators.email]]
    });

    this.verifyForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
    });
  }

  onSubmit(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();
    this.submitted = true;
    if (this.loginForm.invalid || this.loading) return;

    this.loading = true;
    this.textLogin = 'Cargando...';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.credentials = this.loginForm.value;

    this.auth.authenticate(this.credentials).pipe(
      catchError((error) => {
        this.loading = false;
        this.textLogin = 'Iniciar Sesión';
        Swal.fire({
          background: '#002136',
          icon: 'error',
          title: '¡Ops!',
          text: error?.error,
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
        return EMPTY;
      })
    ).subscribe((result: any) => {
      setTimeout(() => {
        const permisosIds = (result?.permisos ?? []).map((p: any) => String(p.idPermiso));
        result.permisos = permisosIds;

        this.auth.setData(result);

        let target = '/contacts/profile';
        if ((result?.rol?.nombre ?? '').trim().toLowerCase() === 'pasajeros') {
          target = '/vista-pasajero';
        } else if (permisosIds.includes('100')) {
          target = '/';
        }

        this.router.navigate([target]);
        this.toastr.success('Bienvenido al Sistema', '¡Operación Exitosa!');
        this.loading = false;
        this.textLogin = 'Iniciar Sesión';
      }, 700);
    });
  }

  openEmailStep() {
    this.step = 'email';
    this.resendMsg = null;
    this.otp = ['', '', '', ''];
    this.verifyForm.reset({ codigo: '' });
    this.cdr.markForCheck();
  }

  backToLogin() {
    this.step = 'login';
    this.resendMsg = null;
    this.clearResend();
    this.cdr.markForCheck();
  }

  goToOtpStep() {
    this.step = 'otp';
    this.resendMsg = null;
    this.otp = ['', '', '', ''];
    this.verifyForm.reset({ codigo: '' });
    this.cdr.detectChanges();
    setTimeout(() => {
      const first = document.querySelector<HTMLInputElement>('#otp-box-0');
      first?.focus();
      first?.select?.();
    }, 0);
  }

  onSendEmail(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();
    if (this.emailForm.invalid || this.loading) return;
    this.loading = true;

    const payload = { userName: this.emailForm.get('userName')!.value };

    this.auth.recuperarAcceso(payload).subscribe({
      next: (msg: string) => {
        this.loading = false;
        Swal.fire({
          background: '#002136',
          icon: 'success',
          title: '¡Operación Exitosa!',
          text: msg || 'Se ha enviado a tu correo el código de verificación.',
          confirmButtonText: 'Confirmar',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          this.startResendCountdown();
          this.resendMsg = null;
          this.goToOtpStep();
        });
      },
      error: async (err) => {
        const msg = await this.getErrorMessage(err);
        this.loading = false;
        Swal.fire({
          background: '#002136',
          icon: 'error',
          title: '¡Ops!',
          text: msg,
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      }
    });
  }

  onOtpInput(e: Event, i: number) {
    const input = e.target as HTMLInputElement;
    const v = (input.value || '').replace(/\D/g, '').slice(0, 1);
    input.value = v;
    this.otp[i] = v;
    if (v && i < 3) {
      const next = document.querySelector<HTMLInputElement>(`#otp-box-${i + 1}`);
      next?.focus();
      next?.select?.();
    }
    const joined = this.otp.join('');
    if (joined.length === 4) {
      this.verifyForm.patchValue({ codigo: joined }, { emitEvent: false });
    }
  }

  onOtpKeydown(e: KeyboardEvent, i: number) {
    const input = e.target as HTMLInputElement;
    if (e.key === 'Backspace' && !input.value && i > 0) {
      const prev = document.querySelector<HTMLInputElement>(`#otp-box-${i - 1}`);
      prev?.focus();
      prev?.select?.();
      return;
    }
    if (!/^\d$/.test(e.key) && e.key !== 'Backspace' && e.key.length === 1) {
      e.preventDefault();
    }
  }

  onVerify(e?: Event) {
    e?.preventDefault();
    e?.stopPropagation();
    this.verifyForm.patchValue({ codigo: this.otp.join('') }, { emitEvent: false });
    this.verifyForm.markAllAsTouched();
    this.verifyForm.updateValueAndValidity();
    if (this.verifyForm.invalid) {
      Swal.fire({
        background: '#002136',
        icon: 'warning',
        title: '¡Ops!',
        html: `
          <p style="text-align:center;font-size:15px;margin-bottom:16px;">
            Los siguientes <strong>campos obligatorios</strong> están vacíos o son inválidos.<br>
            Por favor complétalos antes de continuar:
          </p>
          <div style="max-height:350px;overflow-y:auto;">
            <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#f2d7d5;text-align:center;margin-bottom:8px;border-radius:4px;">
              <strong style="color:#b02a37;">1. Código de Verificación (4 dígitos)</strong>
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
        allowEscapeKey: false
      });
      return;
    }

    if (this.loading) return;
    this.loading = true;

    const codigo = (this.verifyForm.get('codigo')!.value || '').toString().trim();

    this.auth.reenviarCodigo({ codigo }).subscribe({
      next: (msg: string) => {
        this.loading = false;
        this.otp = ['', '', '', ''];
        this.verifyForm.reset({ codigo: '' }, { emitEvent: false });
        Swal.fire({
          background: '#002136',
          icon: 'success',
          title: '¡Operación Exitosa!',
          text: msg || 'Código validado correctamente. Tu cuenta fue verificada.',
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          this.backToLogin();
        });
      },
      error: async (err) => {
        this.loading = false;
        const msg = await this.getErrorMessage(err);
        Swal.fire({
          background: '#002136',
          icon: 'error',
          title: '¡Ops!',
          text: msg,
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      }
    });
  }

  onResend() {
    if (this.resendDisabled || this.loading) return;
    if (this.emailForm.invalid) return;

    this.loading = true;
    const payload = { userName: this.emailForm.get('userName')!.value };

    this.auth.recuperarAcceso(payload).subscribe({
      next: (msg: string) => {
        this.loading = false;
        this.startResendCountdown();
        this.resendMsg = msg || 'Se ha reenviado el correo con tu código de verificación.';
        this.cdr.markForCheck();
      },
      error: async (err) => {
        const msg = await this.getErrorMessage(err);
        this.loading = false;
        Swal.fire({
          background: '#002136',
          icon: 'error',
          title: '¡Ops!',
          text: msg,
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      }
    });
  }

  private startResendCountdown() {
    this.clearResend();
    this.resendDisabled = true;
    this.resendSeconds = 60;
    this.resendTimer = setInterval(() => {
      this.resendSeconds -= 1;
      if (this.resendSeconds <= 0) {
        this.clearResend();
      }
      this.cdr.markForCheck();
    }, 1000) as unknown as number;
  }

  private clearResend() {
    if (this.resendTimer) clearInterval(this.resendTimer as any);
    this.resendTimer = undefined;
    this.resendDisabled = false;
  }

  private async getErrorMessage(err: any): Promise<string> {
    if (err?.status === 0 && !err?.error) return 'No hay conexión con el servidor (status 0). Verifica tu red.';
    if (err?.error instanceof Blob) {
      try {
        const txt = await err.error.text();
        if (txt) return txt;
      } catch {}
    }
    if (typeof err?.error === 'string' && err.error.trim()) return err.error;
    if (typeof err?.message === 'string' && err.message.trim()) return err.message;
    if (err?.error?.message) return String(err.error.message);
    if (err?.error?.errors) {
      const e = err.error.errors;
      if (Array.isArray(e)) return e.filter(Boolean).join('\n');
      if (typeof e === 'object') {
        const lines: string[] = [];
        for (const k of Object.keys(e)) {
          const val = e[k];
          if (Array.isArray(val)) lines.push(`${k}: ${val.join(', ')}`);
          else if (val) lines.push(`${k}: ${val}`);
        }
        if (lines.length) return lines.join('\n');
      }
    }
    const statusLine = err?.status ? `HTTP ${err.status}${err.statusText ? ' ' + err.statusText : ''}` : '';
    return statusLine || 'Error desconocido';
  }
}
