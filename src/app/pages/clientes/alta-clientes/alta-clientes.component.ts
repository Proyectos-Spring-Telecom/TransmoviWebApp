import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-clientes',
  templateUrl: './alta-clientes.component.html',
  styleUrl: './alta-clientes.component.scss',
  animations: [fadeInUpAnimation],
})
export class AltaClientesComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public clienteForm: FormGroup;
  public idCliente: number;
  public title = 'Agregar Cliente';
  public listaClientes: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;
  clienteDisplayExpr = (c: any) => c ? `${c.nombre || ''} ${c.apellidoPaterno || ''} ${c.apellidoMaterno || ''}`.trim() : '';
  tipoPersonaItems = [{ id: 1, text: 'Física' }, { id: 2, text: 'Moral' }];
  // public showRol: any;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private clieService: ClientesService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private usuaService: UsuariosService,
    private users: AuthenticationService,
  ) {
    // const user = this.users.getUser();
    // if(user.rol.nombre == 'SA' ){
    //   this.showRol = true;
    // } else {
    //   this.showRol = false;
    // }
  }

  ngOnInit(): void {
    this.obtenerClientes();
    this.initForm();
    this.activatedRouted.params.subscribe((params) => {
      this.idCliente = params['idCliente'];
      if (this.idCliente) {
        this.title = 'Actualizar Cliente';
        this.obtenerClienteID();
      }
    });
  }

  obtenerClientes() {
    this.clieService.obtenerClientes().subscribe((response) => {
      this.listaClientes = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c.id),
      }));
    });
  }

  obtenerClienteID() {
    this.clieService.obtenerCliente(this.idCliente).subscribe((response: any) => {
      const d = response?.data ?? {};

      this.clienteForm.patchValue({
        idPadre: Number(d.idPadre ?? 0),
        rfc: d.rfc ?? '',
        tipoPersona: d.tipoPersona ?? null,
        estatus: d.estatus ?? 1,
        logotipo: d.logotipo ?? null,
        nombre: d.nombre ?? '',
        apellidoPaterno: d.apellidoPaterno ?? null,
        apellidoMaterno: d.apellidoMaterno ?? null,
        telefono: d.telefono ?? '',
        correo: d.correo ?? '',
        estado: d.estado ?? '',
        municipio: d.municipio ?? '',
        colonia: d.colonia ?? '',
        calle: d.calle ?? '',
        entreCalles: d.entreCalles ?? '',
        numeroExterior: d.numeroExterior ?? '',
        numeroInterior: d.numeroInterior ?? '',
        cp: d.cp ?? '',
        nombreEncargado: d.nombreEncargado ?? '',
        telefonoEncargado: d.telefonoEncargado ?? '',
        correoEncargado: d.correoEncargado ?? '',
        sitioWeb: d.sitioWeb ?? '',
        constanciaSituacionFiscal: d.constanciaSituacionFiscal ?? null,
        comprobanteDomicilio: d.comprobanteDomicilio ?? null,
        actaConstitutiva: d.actaConstitutiva ?? null,
      });
      this.originalDocs = {
        logotipo: d.logotipo ?? '',
        constanciaSituacionFiscal: d.constanciaSituacionFiscal ?? '',
        comprobanteDomicilio: d.comprobanteDomicilio ?? '',
        actaConstitutiva: d.actaConstitutiva ?? '',
      };
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.clienteForm.patchValue({ Logotipo: file });
      this.clienteForm.get('Logotipo')?.markAsTouched();
      this.clienteForm.get('Logotipo')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  centerModal(centerDataModal: any) {
    this.modalService.open(centerDataModal, {
      centered: true,
      windowClass: 'modal-holder',
      backdrop: 'static',
      keyboard: false,
    });
  }

  onTipoPersonaChange(_event: any) {
    const value: number | null = this.clienteForm.get('tipoPersona')!.value;

    if (value === 1) {
      this.clienteForm
        .get('apellidoPaterno')
        ?.setValidators([Validators.required]);
      this.clienteForm
        .get('apellidoMaterno')
        ?.setValidators([Validators.required]);
    } else if (value === 2) {
      this.clienteForm.get('apellidoPaterno')?.clearValidators();
      this.clienteForm.get('apellidoMaterno')?.clearValidators();
      this.clienteForm.patchValue({
        apellidoPaterno: null,
        apellidoMaterno: null,
      });
    }

    this.clienteForm.get('apellidoPaterno')?.updateValueAndValidity();
    this.clienteForm.get('apellidoMaterno')?.updateValueAndValidity();
  }

  sanitizeInput(event: any): void {
    const inputElement = event.target as HTMLInputElement;
    const sanitizedValue = inputElement.value.replace(/[^A-Za-z0-9]/g, '');
    inputElement.value = sanitizedValue.slice(0, 13);
    this.clienteForm
      .get('RFC')
      ?.setValue(inputElement.value, { emitEvent: false });
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  private readonly DEFAULT_AVATAR_URL =
    'https://wallpapercat.com/w/full/9/5/a/945731-3840x2160-desktop-4k-matte-black-wallpaper-image.jpg';

  initForm() {
    this.clienteForm = this.fb.group({
      idPadre: [null],
      rfc: ['', Validators.required],
      tipoPersona: [null, Validators.required],
      estatus: [1, Validators.required],
      logotipo: [null, Validators.required],
      constanciaSituacionFiscal: [null, Validators.required],
      comprobanteDomicilio: [null, Validators.required],
      actaConstitutiva: [null, Validators.required],
      nombre: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      telefono: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      estado: ['', Validators.required],
      municipio: ['', Validators.required],
      colonia: ['', Validators.required],
      calle: ['', Validators.required],
      entreCalles: [null],
      numeroExterior: ['', Validators.required],
      numeroInterior: [''],
      cp: ['', Validators.required],
      nombreEncargado: ['', Validators.required],
      telefonoEncargado: ['', Validators.required],
      correoEncargado: ['', [Validators.required, Validators.email]],
      sitioWeb: [null],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idCliente) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    const tipo = Number(this.clienteForm.get('tipoPersona')?.value ?? null);
    if (tipo === 1) {
      this.clienteForm
        .get('apellidoPaterno')
        ?.setValidators([Validators.required]);
      this.clienteForm
        .get('apellidoMaterno')
        ?.setValidators([Validators.required]);
    } else if (tipo === 2) {
      this.clienteForm.get('apellidoPaterno')?.clearValidators();
      this.clienteForm.get('apellidoMaterno')?.clearValidators();
      this.clienteForm.patchValue({
        apellidoPaterno: null,
        apellidoMaterno: null,
      });
    }
    this.clienteForm
      .get('apellidoPaterno')
      ?.updateValueAndValidity({ emitEvent: false });
    this.clienteForm
      .get('apellidoMaterno')
      ?.updateValueAndValidity({ emitEvent: false });

    if (this.clienteForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        rfc: 'RFC',
        tipoPersona: 'Tipo de Persona',
        estatus: 'Estatus',
        logotipo: 'Logotipo',
        constanciaSituacionFiscal: 'Constancia de Situación Fiscal',
        comprobanteDomicilio: 'Comprobante de Domicilio',
        actaConstitutiva: 'Acta Constitutiva',
        nombre: 'Nombre / Razón Social',
        apellidoPaterno: 'Apellido Paterno',
        apellidoMaterno: 'Apellido Materno',
        telefono: 'Teléfono',
        correo: 'Correo Electrónico',
        estado: 'Estado',
        municipio: 'Municipio',
        colonia: 'Colonia',
        calle: 'Calle',
        entreCalles: 'Entre Calles',
        numeroExterior: 'Número Exterior',
        cp: 'Código Postal',
        nombreEncargado: 'Nombre del Encargado',
        telefonoEncargado: 'Teléfono del Encargado',
        correoEncargado: 'Email del Encargado',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.clienteForm.controls).forEach((key) => {
        const control = this.clienteForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, index) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${index + 1}. ${campo}</strong>
      </div>
    `
        )
        .join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
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
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }
    if (this.clienteForm.contains('id')) this.clienteForm.removeControl('id');
    const v = this.clienteForm.value;
    const payload = {
      ...v,
      tipoPersona: v.tipoPersona != null ? Number(v.tipoPersona) : null,
    };

    this.clieService.agregarCliente(payload).subscribe(
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: 'Se agregó un nuevo cliente de manera exitosa.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          background: '#002136',
          text: 'Ocurrió un error al agregar el cliente.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    );
  }

  actualizar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    const tipo = Number(this.clienteForm.get('tipoPersona')?.value ?? null);
    if (tipo === 1) {
      this.clienteForm.get('apellidoPaterno')?.setValidators([Validators.required]);
      this.clienteForm.get('apellidoMaterno')?.setValidators([Validators.required]);
    } else if (tipo === 2) {
      this.clienteForm.get('apellidoPaterno')?.clearValidators();
      this.clienteForm.get('apellidoMaterno')?.clearValidators();
      this.clienteForm.patchValue({ apellidoPaterno: null, apellidoMaterno: null });
    }
    this.clienteForm.get('apellidoPaterno')?.updateValueAndValidity({ emitEvent: false });
    this.clienteForm.get('apellidoMaterno')?.updateValueAndValidity({ emitEvent: false });

    if (this.clienteForm.invalid) {
      this.submitButton = 'Actualizar';
      this.loading = false;

      const etiquetas: any = {
        rfc: 'RFC',
        tipoPersona: 'Tipo de Persona',
        estatus: 'Estatus',
        logotipo: 'Logotipo',
        constanciaSituacionFiscal: 'Constancia de Situación Fiscal',
        comprobanteDomicilio: 'Comprobante de Domicilio',
        actaConstitutiva: 'Acta Constitutiva',
        nombre: 'Nombre / Razón Social',
        apellidoPaterno: 'Apellido Paterno',
        apellidoMaterno: 'Apellido Materno',
        telefono: 'Teléfono',
        correo: 'Correo Electrónico',
        estado: 'Estado',
        municipio: 'Municipio',
        colonia: 'Colonia',
        calle: 'Calle',
        entreCalles: 'Entre Calles',
        numeroExterior: 'Número Exterior',
        cp: 'Código Postal',
        nombreEncargado: 'Nombre del Encargado',
        telefonoEncargado: 'Teléfono del Encargado',
        correoEncargado: 'Email del Encargado',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.clienteForm.controls).forEach((key) => {
        const control = this.clienteForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, index) => `
        <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
          <strong style="color:#b02a37;">${index + 1}. ${campo}</strong>
        </div>`
        )
        .join('');

      Swal.fire({
        title: '¡Faltan campos obligatorios!',
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
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const v = this.clienteForm.value;

    const urls$ = forkJoin({
      logotipo: this.resolveUrlForField('logotipo', v.logotipo),
      constanciaSituacionFiscal: this.resolveUrlForField('constanciaSituacionFiscal', v.constanciaSituacionFiscal),
      comprobanteDomicilio: this.resolveUrlForField('comprobanteDomicilio', v.comprobanteDomicilio),
      actaConstitutiva: this.resolveUrlForField('actaConstitutiva', v.actaConstitutiva),
    });

    urls$
      .pipe(finalize(() => { }))
      .subscribe({
        next: (u) => {
          const payload = {
            ...v,
            tipoPersona: v.tipoPersona != null ? Number(v.tipoPersona) : null,
            logotipo: u.logotipo,
            constanciaSituacionFiscal: u.constanciaSituacionFiscal,
            comprobanteDomicilio: u.comprobanteDomicilio,
            actaConstitutiva: u.actaConstitutiva,
          };

          this.clieService.actualizarCliente(this.idCliente, payload).subscribe(
            () => {
              this.submitButton = 'Actualizar';
              this.loading = false;
              Swal.fire({
                title: '¡Operación Exitosa!',
                background: '#002136',
                text: 'Los datos del cliente se actualizaron correctamente.',
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
                text: 'Ocurrió un error al actualizar el cliente.',
                icon: 'error',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Confirmar',
              });
            }
          );
        },
        error: () => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Ops!',
            background: '#002136',
            text: 'No fue posible preparar los documentos para actualizar.',
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        },
      });
  }

  regresar() {
    this.route.navigateByUrl('/clientes');
  }

  private originalDocs = {
    logotipo: '' as string,
    constanciaSituacionFiscal: '' as string,
    comprobanteDomicilio: '' as string,
    actaConstitutiva: '' as string,
  };

  private isFileLike(v: any): v is File {
    return v instanceof File;
  }

  @ViewChild('logoFileInput') logoFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('csfFileInput') csfFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('compDomFileInput') compDomFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('actaFileInput') actaFileInput!: ElementRef<HTMLInputElement>;

  logoPreviewUrl: string | ArrayBuffer | null = null;
  csfPreviewUrl: string | ArrayBuffer | null = null;
  compDomPreviewUrl: string | ArrayBuffer | null = null;
  actaPreviewUrl: string | ArrayBuffer | null = null;

  logoDragging = false;
  csfDragging = false;
  compDomDragging = false;
  actaDragging = false;

  csfFileName: string | null = null;
  compDomFileName: string | null = null;
  actaFileName: string | null = null;

  private readonly MAX_MB = 3;

  private isImage(file: File): boolean {
    if (!file?.type) return /\.(png|jpe?g|webp)$/i.test(file.name);
    return /^image\/(png|jpe?g|webp)$/i.test(file.type);
  }
  private isPdf(file: File): boolean {
    if (!file?.type) return /\.pdf$/i.test(file.name);
    return file.type === 'application/pdf';
  }
  private isOffice(file: File): boolean {
    const t = file?.type;
    if (!t) return /\.(docx?|xlsx?)$/i.test(file.name);
    return [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ].includes(t);
  }
  private isImageUrl(u: string): boolean {
    return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?.*)?$/i.test(u);
  }

  private isAllowedLogo(file: File): boolean {
    const okType = this.isImage(file) || this.isPdf(file) || this.isOffice(file);
    const okSize = file.size <= this.MAX_MB * 1024 * 1024;
    return okType && okSize;
  }
  private isAllowedDoc(file: File): boolean {
    const okType = this.isPdf(file);
    const okSize = file.size <= this.MAX_MB * 1024 * 1024;
    return okType && okSize;
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

  openLogoFilePicker() {
    this.logoFileInput.nativeElement.click();
  }
  onLogoDragOver(e: DragEvent) {
    e.preventDefault();
    this.logoDragging = true;
  }
  onLogoDragLeave(e: DragEvent) {
    e.preventDefault();
    this.logoDragging = false;
  }
  onLogoDrop(e: DragEvent) {
    e.preventDefault();
    this.logoDragging = false;
    const f = e.dataTransfer?.files?.[0] || null;
    if (f) this.handleLogoFile(f);
  }
  onLogoFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handleLogoFile(f);
    if (input) input.value = '';
  }
  clearLogoImage(e: Event) {
    e.stopPropagation();
    this.logoPreviewUrl = null;
    this.logoFileInput.nativeElement.value = '';
    this.clienteForm.patchValue({ logotipo: this.DEFAULT_AVATAR_URL });
    this.clienteForm.get('logotipo')?.setErrors(null);
  }
  private handleLogoFile(file: File) {
    if (!this.isAllowedLogo(file)) {
      this.clienteForm.get('logotipo')?.setErrors({ invalid: true });
      return;
    }
    this.loadPreview(file, (url) => (this.logoPreviewUrl = url));
    this.clienteForm.patchValue({ logotipo: file });
    this.clienteForm.get('logotipo')?.setErrors(null);
    this.uploadLogo(file);
  }
  private uploadingLogo = false;
  private uploadLogo(file: File): void {
    if (this.uploadingLogo) return;
    this.uploadingLogo = true;

    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'clientes');
    fd.append('idModule', '1');

    this.usuaService.uploadFile(fd)
      .pipe(finalize(() => { this.uploadingLogo = false; }))
      .subscribe({
        next: (res: any) => {
          const url = this.extractFileUrl(res);
          if (url) {
            this.clienteForm.patchValue({ logotipo: url });
            this.logoPreviewUrl = this.isImageUrl(url) ? url : null;
          } else {
            this.clienteForm.get('logotipo')?.setErrors({ uploadFailed: true });
          }
        },
        error: () => {
          this.clienteForm.get('logotipo')?.setErrors({ uploadFailed: true });
        },
      });
  }

  openCsfFilePicker() {
    this.csfFileInput.nativeElement.click();
  }
  onCsfDragOver(e: DragEvent) {
    e.preventDefault();
    this.csfDragging = true;
  }
  onCsfDragLeave(e: DragEvent) {
    e.preventDefault();
    this.csfDragging = false;
  }
  onCsfDrop(e: DragEvent) {
    e.preventDefault();
    this.csfDragging = false;
    const f = e.dataTransfer?.files?.[0] || null;
    if (f) this.handleCsfFile(f);
  }
  onCsfFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handleCsfFile(f);
    if (input) input.value = '';
  }
  clearCsfFile(e: Event) {
    e.stopPropagation();
    this.csfPreviewUrl = null;
    this.csfFileName = null;
    this.csfFileInput.nativeElement.value = '';
    this.clienteForm.patchValue({ constanciaSituacionFiscal: this.DEFAULT_AVATAR_URL });
    this.clienteForm.get('constanciaSituacionFiscal')?.setErrors(null);
  }
  private handleCsfFile(file: File) {
    if (!this.isAllowedDoc(file)) {
      this.clienteForm.get('constanciaSituacionFiscal')?.setErrors({ invalid: true });
      return;
    }
    this.csfFileName = file.name;
    this.loadPreview(file, (url) => (this.csfPreviewUrl = url));
    this.clienteForm.patchValue({ constanciaSituacionFiscal: file });
    this.clienteForm.get('constanciaSituacionFiscal')?.setErrors(null);
    this.uploadCsf(file);
  }
  private uploadingCsf = false;
  private uploadCsf(file: File): void {
    if (this.uploadingCsf) return;
    this.uploadingCsf = true;

    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'clientes');
    fd.append('idModule', '1');

    this.usuaService.uploadFile(fd)
      .pipe(finalize(() => { this.uploadingCsf = false; }))
      .subscribe({
        next: (res: any) => {
          const url = this.extractFileUrl(res);
          if (url) {
            this.clienteForm.patchValue({ constanciaSituacionFiscal: url });
            this.csfPreviewUrl = this.isImageUrl(url) ? url : null;
          } else {
            this.clienteForm.get('constanciaSituacionFiscal')?.setErrors({ uploadFailed: true });
          }
        },
        error: () => {
          this.clienteForm.get('constanciaSituacionFiscal')?.setErrors({ uploadFailed: true });
        },
      });
  }

  openCompDomFilePicker() {
    this.compDomFileInput.nativeElement.click();
  }
  onCompDomDragOver(e: DragEvent) {
    e.preventDefault();
    this.compDomDragging = true;
  }
  onCompDomDragLeave(e: DragEvent) {
    e.preventDefault();
    this.compDomDragging = false;
  }
  onCompDomDrop(e: DragEvent) {
    e.preventDefault();
    this.compDomDragging = false;
    const f = e.dataTransfer?.files?.[0] || null;
    if (f) this.handleCompDomFile(f);
  }
  onCompDomFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handleCompDomFile(f);
    if (input) input.value = '';
  }
  clearCompDomFile(e: Event) {
    e.stopPropagation();
    this.compDomPreviewUrl = null;
    this.compDomFileName = null;
    this.compDomFileInput.nativeElement.value = '';
    this.clienteForm.patchValue({ comprobanteDomicilio: this.DEFAULT_AVATAR_URL });
    this.clienteForm.get('comprobanteDomicilio')?.setErrors(null);
  }
  private handleCompDomFile(file: File) {
    if (!this.isAllowedDoc(file)) {
      this.clienteForm.get('comprobanteDomicilio')?.setErrors({ invalid: true });
      return;
    }
    this.compDomFileName = file.name;
    this.loadPreview(file, (url) => (this.compDomPreviewUrl = url));
    this.clienteForm.patchValue({ comprobanteDomicilio: file });
    this.clienteForm.get('comprobanteDomicilio')?.setErrors(null);
    this.uploadCompDom(file);
  }
  private uploadingComp = false;
  private uploadCompDom(file: File): void {
    if (this.uploadingComp) return;
    this.uploadingComp = true;

    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'clientes');
    fd.append('idModule', '1');

    this.usuaService.uploadFile(fd)
      .pipe(finalize(() => { this.uploadingComp = false; }))
      .subscribe({
        next: (res: any) => {
          const url = this.extractFileUrl(res);
          if (url) {
            this.clienteForm.patchValue({ comprobanteDomicilio: url });
            this.compDomPreviewUrl = this.isImageUrl(url) ? url : null;
          } else {
            this.clienteForm.get('comprobanteDomicilio')?.setErrors({ uploadFailed: true });
          }
        },
        error: () => {
          this.clienteForm.get('comprobanteDomicilio')?.setErrors({ uploadFailed: true });
        },
      });
  }

  openActaFilePicker() {
    this.actaFileInput.nativeElement.click();
  }
  onActaDragOver(e: DragEvent) {
    e.preventDefault();
    this.actaDragging = true;
  }
  onActaDragLeave(e: DragEvent) {
    e.preventDefault();
    this.actaDragging = false;
  }
  onActaDrop(e: DragEvent) {
    e.preventDefault();
    this.actaDragging = false;
    const f = e.dataTransfer?.files?.[0] || null;
    if (f) this.handleActaFile(f);
  }
  onActaFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) this.handleActaFile(f);
    if (input) input.value = '';
  }
  clearActaFile(e: Event) {
    e.stopPropagation();
    this.actaPreviewUrl = null;
    this.actaFileName = null;
    this.actaFileInput.nativeElement.value = '';
    this.clienteForm.patchValue({ actaConstitutiva: this.DEFAULT_AVATAR_URL });
    this.clienteForm.get('actaConstitutiva')?.setErrors(null);
  }
  private handleActaFile(file: File) {
    if (!this.isAllowedDoc(file)) {
      this.clienteForm.get('actaConstitutiva')?.setErrors({ invalid: true });
      return;
    }
    this.actaFileName = file.name;
    this.loadPreview(file, (url) => (this.actaPreviewUrl = url));
    this.clienteForm.patchValue({ actaConstitutiva: file });
    this.clienteForm.get('actaConstitutiva')?.setErrors(null);
    this.uploadActa(file);
  }
  private uploadingActa = false;
  private uploadActa(file: File): void {
    if (this.uploadingActa) return;
    this.uploadingActa = true;

    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'clientes');
    fd.append('idModule', '1');

    this.usuaService.uploadFile(fd)
      .pipe(finalize(() => { this.uploadingActa = false; }))
      .subscribe({
        next: (res: any) => {
          const url = this.extractFileUrl(res);
          if (url) {
            this.clienteForm.patchValue({ actaConstitutiva: url });
            this.actaPreviewUrl = this.isImageUrl(url) ? url : null;
          } else {
            this.clienteForm.get('actaConstitutiva')?.setErrors({ uploadFailed: true });
          }
        },
        error: () => {
          this.clienteForm.get('actaConstitutiva')?.setErrors({ uploadFailed: true });
        },
      });
  }

  private extractFileUrl(res: any): string {
    return (
      res?.url ??
      res?.Location ??
      res?.data?.url ??
      res?.data?.Location ??
      res?.key ??
      res?.Key ??
      res?.path ??
      res?.filePath ??
      ''
    );
  }

  private buildFD(file: File): FormData {
    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'clientes');
    fd.append('idModule', '1');
    return fd;
  }
  
  private resolveUrlForField(field: keyof typeof this.originalDocs, value: any) {
    if (this.isFileLike(value)) {
      return this.usuaService.uploadFile(this.buildFD(value)).pipe(
        map((r: any) => this.extractFileUrl(r) || ''),
        catchError(() => of(this.originalDocs[field] || ''))
      );
    }
    if (typeof value === 'string' && value.trim()) return of(value.trim());
    return of(this.originalDocs[field] || '');
  }
}
