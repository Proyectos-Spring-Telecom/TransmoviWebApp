import { animate, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { PasajerosService } from 'src/app/shared/services/pasajeros.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-pasajero',
  templateUrl: './alta-pasajero.component.html',
  styleUrl: './alta-pasajero.component.scss',
  animations: [
    fadeInUpAnimation,
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
export class AltaPasajeroComponent implements OnInit {

  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public pasajeroForm: FormGroup;
  public idPasajero: number;
  public title = 'Agregar Pasajero';
  logoPreviewUrl: string | ArrayBuffer | null = null;
  public showCorreo: boolean = true;
  selectedFileName: string = '';
  private subs: Subscription[] = [];
  previewUrl: string | ArrayBuffer | null = null;
  idClienteUser!: number;
  public listaTipoPasajero: any;
  public showInputsNoUpdate = true;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private pasajService: PasajerosService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private usuaService: UsuariosService,
    private users: AuthenticationService,
  ) {
    const user = this.users.getUser();
    this.idClienteUser = Number(user?.idCliente);
  }

  ngOnInit(): void {
    this.initForm()
    this.activatedRouted.params.subscribe(
      (params) => {
        this.idPasajero = params['idPasajero'];
        if (this.idPasajero) {
          this.title = 'Actualizar Pasajero';
          this.obtenerPasajeroID();
          this.showCorreo = false;
          this.showInputsNoUpdate = false;
        }
      }
    )

    this.subs.push(
      this.pasajeroForm.get('passwordHash')!.valueChanges.subscribe((raw: string) => {
        const v = (raw || '').trim();
        if (raw !== v) this.pasajeroForm.get('passwordHash')!.setValue(v, { emitEvent: false });

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
    this.obtenerTipoPasajero()
  }

  obtenerTipoPasajero() {
    this.pasajService.obtenerPasajeroClienteId(this.idClienteUser).subscribe((response) => {
      this.listaTipoPasajero = response.data
    })
  }

  obtenerPasajeroID() {
    this.pasajService.obtenerPasajero(this.idPasajero).subscribe((response: any) => {
      const raw = response?.data ?? {};
      const get = (o: any, keys: string[]) => {
        for (const k of keys) {
          const v = o?.[k];
          if (v !== undefined && v !== null) return v;
        }
        return null;
      };

      const fechaNac = get(raw, ['fechaNacimiento', 'FechaNacimiento']);
      const fecha = typeof fechaNac === 'string' ? fechaNac.split('T')[0] : '';

      this.pasajeroForm.patchValue({
        estatus: Number(get(raw, ['estatus', 'Estatus'])) ?? 1,
        nombre: get(raw, ['nombre', 'Nombre']) ?? '',
        apellidoPaterno: get(raw, ['apellidoPaterno', 'ApellidoPaterno']) ?? '',
        apellidoMaterno: get(raw, ['apellidoMaterno', 'ApellidoMaterno']) ?? '',
        telefono: get(raw, ['telefono', 'Telefono', 'teléfono']) ?? '',
        correo: get(raw, ['correo', 'Correo']) ?? '',
        fechaNacimiento: fecha,
        passwordHash: '',
        idTipoPasajero: Number(get(raw, ['idTipoPasajero', 'idtipopasajero'])) ?? 0,
        documentacion: get(raw, ['documentacion', 'Documentacion']) ?? '',
        curp: get(raw, ['curp', 'CURP']) ?? '',
        numeroSerieMonedero: get(raw, ['numeroSerieMonedero', 'NumeroSerieMonedero']) ?? ''
      });
    });
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  initForm() {
    this.pasajeroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      passwordHash: ['', Validators.required],
      estatus: [1, Validators.required],
      idTipoPasajero: [0, Validators.required],
      documentacion: ['', Validators.required],
      curp: ['', Validators.required],
      numeroSerieMonedero: ['', Validators.required],
    });
  }

  submit() {
    if (this.idPasajero) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.pasajeroForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        nombre: 'Nombre',
        apellidoPaterno: 'Apellido Paterno',
        apellidoMaterno: 'Apellido Materno',
        fechaNacimiento: 'Fecha de Nacimiento',
        correo: 'Correo Electrónico',
        telefono: 'Teléfono',
        passwordHash: 'Contraseña',
        estatus: 'Estatus',
        idTipoPasajero: 'Tipo de Pasajero',
        documentacion: 'Documentación',
        curp: 'CURP',
        numeroSerieMonedero: 'Número de Serie Monedero'
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.pasajeroForm.controls).forEach(key => {
        const control = this.pasajeroForm.get(key);
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

    const raw = { ...this.pasajeroForm.value };
    if (raw.fechaNacimiento instanceof Date && !isNaN(raw.fechaNacimiento.getTime())) {
      const y = raw.fechaNacimiento.getFullYear();
      const m = String(raw.fechaNacimiento.getMonth() + 1).padStart(2, '0');
      const d = String(raw.fechaNacimiento.getDate()).padStart(2, '0');
      raw.fechaNacimiento = `${y}-${m}-${d}`;
    } else if (typeof raw.fechaNacimiento === 'string') {
      if (raw.fechaNacimiento.includes('T')) {
        raw.fechaNacimiento = raw.fechaNacimiento.split('T')[0];
      } else {
        raw.fechaNacimiento = raw.fechaNacimiento.replace(/\//g, '-');
        const isoMatch = raw.fechaNacimiento.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        const dmyMatch = raw.fechaNacimiento.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (dmyMatch) {
          const dd = dmyMatch[1].padStart(2, '0');
          const mm = dmyMatch[2].padStart(2, '0');
          const yyyy = dmyMatch[3];
          raw.fechaNacimiento = `${yyyy}-${mm}-${dd}`;
        } else if (!isoMatch) {
          const parsed = new Date(raw.fechaNacimiento);
          if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            raw.fechaNacimiento = `${y}-${m}-${d}`;
          } else {
            raw.fechaNacimiento = null;
          }
        }
      }
    }

    if ('id' in this.pasajeroForm.controls) this.pasajeroForm.removeControl('id');
    this.pasajService.agregarPasajero(raw).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo dispositivo de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error: any) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: error.error,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  actualizar() {
    if (this.loading) return;

    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.pasajeroForm.invalid) {
      this.submitButton = 'Actualizar';
      this.loading = false;

      const etiquetas: Record<string, string> = {
        nombre: 'Nombre',
        apellidoPaterno: 'Apellido Paterno',
        apellidoMaterno: 'Apellido Materno',
        fechaNacimiento: 'Fecha de Nacimiento',
        correo: 'Correo Electrónico',
        telefono: 'Teléfono',
        passwordHash: 'Contraseña',
        estatus: 'Estatus',
        idTipoPasajero: 'Tipo de Pasajero',
        documentacion: 'Documentación',
        curp: 'CURP',
        numeroSerieMonedero: 'Número de Serie Monedero'
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.pasajeroForm.controls).forEach((key) => {
        const control = this.pasajeroForm.get(key);
        if (control?.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
    <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
      <strong style="color:#b02a37;">${index + 1}. ${campo}</strong>
    </div>
  `).join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios del pasajero!',
        background: '#002136',
        html: `
      <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
        Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
        Por favor complétalos antes de continuar:
      </p>
      <div style="max-height:350px;overflow-y:auto;">${lista}</div>
    `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: { popup: 'swal2-padding swal2-border' }
      });

      return;
    }

    const { correo, ...payload } = this.pasajeroForm.value;

    if (payload.fechaNacimiento instanceof Date && !isNaN(payload.fechaNacimiento.getTime())) {
      const y = payload.fechaNacimiento.getFullYear();
      const m = String(payload.fechaNacimiento.getMonth() + 1).padStart(2, '0');
      const d = String(payload.fechaNacimiento.getDate()).padStart(2, '0');
      payload.fechaNacimiento = `${y}-${m}-${d}`;
    } else if (typeof payload.fechaNacimiento === 'string') {
      if (payload.fechaNacimiento.includes('T')) {
        payload.fechaNacimiento = payload.fechaNacimiento.split('T')[0];
      } else {
        payload.fechaNacimiento = payload.fechaNacimiento.replace(/\//g, '-');
        const dmyMatch = payload.fechaNacimiento.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (dmyMatch) {
          const dd = dmyMatch[1].padStart(2, '0');
          const mm = dmyMatch[2].padStart(2, '0');
          const yyyy = dmyMatch[3];
          payload.fechaNacimiento = `${yyyy}-${mm}-${dd}`;
        } else {
          const parsed = new Date(payload.fechaNacimiento);
          if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            payload.fechaNacimiento = `${y}-${m}-${d}`;
          }
        }
      }
    }

    this.pasajService.actualizarPasajero(this.idPasajero, payload).subscribe(
      () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: 'Los datos del pasajero se actualizaron correctamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: 'Ocurrió un error al actualizar el pasajero.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/pasajeros')
  }

  @ViewChild('docFileInput') docFileInput!: ElementRef<HTMLInputElement>;
  docPreviewUrl: string | ArrayBuffer | null = null;
  docDragging = false;
  private docFile: File | null = null;

  private readonly DEFAULT_DOC_URL =
    'https://transmovi.s3.us-east-2.amazonaws.com/imagenes/user_default.png';
  private readonly MAX_MB = 3;
  private readonly S3_FOLDER = 'pasajeros';
  private readonly S3_ID_MODULE = 21;

  private isImage(file: File) {
    return /^image\/(png|jpe?g|webp)$/i.test(file.type);
  }

  private isAllowed(file: File) {
    const okImg = this.isImage(file);
    const okDoc = /(pdf|msword|officedocument|excel)/i.test(file.type);
    return (okImg || okDoc) && file.size <= this.MAX_MB * 1024 * 1024;
  }

  private loadPreview(file: File, setter: (url: string | ArrayBuffer | null) => void) {
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
      fd.append('file', this.DEFAULT_DOC_URL);
    }
    fd.append('folder', this.S3_FOLDER);
    fd.append('idModule', String(this.S3_ID_MODULE));
    return fd;
  }

  private uploadDocumentacionAuto(): void {
    const fd = this.buildS3Payload(this.docFile);

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        console.log('Respuesta del backend:', res);
        const url = res?.url ?? res?.Location ?? res?.data?.url ?? '';

        if (url) {
          this.pasajeroForm.patchValue({ documentacion: url });
          if (/\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(url)) {
            this.docPreviewUrl = url;
          }
        }
      },
      error: (err) => {
        console.error('Error al subir archivo', err);
      },
    });
  }

  openDocFilePicker() {
    this.docFileInput.nativeElement.click();
  }

  onDocDragOver(e: DragEvent) {
    e.preventDefault();
    this.docDragging = true;
  }

  onDocDragLeave(_e: DragEvent) {
    this.docDragging = false;
  }

  onDocDrop(e: DragEvent) {
    e.preventDefault();
    this.docDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleDocFile(f);
  }

  onDocFileSelected(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.handleDocFile(f);
  }

  clearDocFile(e: Event) {
    e.stopPropagation();
    this.docPreviewUrl = null;
    this.docFileInput.nativeElement.value = '';
    this.docFile = null;
    this.pasajeroForm.patchValue({ documentacion: this.DEFAULT_DOC_URL });
    this.pasajeroForm.get('documentacion')?.setErrors(null);
    this.uploadDocumentacionAuto();
  }

  private handleDocFile(file: File) {
    if (!this.isAllowed(file)) {
      this.pasajeroForm.get('documentacion')?.setErrors({ invalid: true });
      return;
    }
    this.loadPreview(file, (url) => (this.docPreviewUrl = url));
    this.docFile = file;
    this.pasajeroForm.patchValue({ documentacion: file });
    this.pasajeroForm.get('documentacion')?.setErrors(null);
    this.uploadDocumentacionAuto();
  }


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
  myFunctionPasswordCurrent() {
    this.type = this.type === 'password' ? 'text' : 'password';
  }

  get showPwHint(): boolean {
    const c = this.pasajeroForm?.get('passwordHash');
    const v = (c?.value || '').toString();
    return this.pwFocused && v.length > 0;
  }

  private pad2(n: number): string {
    return n < 10 ? '0' + n : String(n);
  }

  private parseToDate(v: any): Date | null {
    if (!v && v !== 0) return null;
    if (v instanceof Date && !isNaN(v.getTime())) {
      return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    }
    const s = String(v).trim();
    if (!s) return null;
    const isoMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (isoMatch) {
      const y = Number(isoMatch[1]), m = Number(isoMatch[2]), d = Number(isoMatch[3]);
      if (y && m >= 1 && m <= 12 && d >= 1 && d <= 31) return new Date(y, m - 1, d);
    }
    const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const d = Number(dmyMatch[1]), m = Number(dmyMatch[2]), y = Number(dmyMatch[3]);
      if (y && m >= 1 && m <= 12 && d >= 1 && d <= 31) return new Date(y, m - 1, d);
    }
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    return null;
  }

  private formatDateForApi(v: any): string | null {
    const d = this.parseToDate(v);
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = this.pad2(d.getMonth() + 1);
    const dd = this.pad2(d.getDate());
    return `${yyyy}-${mm}-${dd}`;
  }
}
