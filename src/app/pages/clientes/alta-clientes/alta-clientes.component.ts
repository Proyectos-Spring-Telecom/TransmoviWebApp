import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-clientes',
  templateUrl: './alta-clientes.component.html',
  styleUrl: './alta-clientes.component.scss',
  animations: [fadeInUpAnimation]
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

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private clieService: ClientesService,
    private activatedRouted: ActivatedRoute,
    private route: Router
  ) { }

  ngOnInit(): void {
    this.obtenerClientes()
    this.initForm();
    this.activatedRouted.params.subscribe(
      (params) => {
        this.idCliente = params['idCliente'];
        if (this.idCliente) {
          this.title = 'Actualizar Cliente';
          this.obtenerClienteID();
        }
      }
    )
  }

  obtenerClientes() {
    this.clieService.obtenerClientes().subscribe((response) => {
      this.listaClientes = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c.id)
      }));
    });
  }


  obtenerClienteID() {
    this.clieService.obtenerCliente(this.idCliente).subscribe(
      (response: any) => {
        this.clienteForm.patchValue({
          idPadre: Number(response.data?.id ?? response.data?.id ?? 0),
          rfc: response.data.rfc,
          tipoPersona: response.data.tipoPersona,
          estatus: response.data.estatus,
          logotipo: response.data.logotipo,
          nombre: response.data.nombre,
          apellidoPaterno: response.data.apellidoPaterno,
          apellidoMaterno: response.data.apellidoMaterno,
          telefono: response.data.telefono,
          correo: response.data.correo,
          estado: response.data.estado,
          municipio: response.data.municipio,
          colonia: response.data.colonia,
          calle: response.data.calle,
          entreCalles: response.data.entreCalles,
          numeroExterior: response.data.numeroExterior,
          numeroInterior: response.data.numeroInterior,
          cp: response.data.cp,
          nombreEncargado: response.data.nombreEncargado,
          telefonoEncargado: response.data.telefonoEncargado,
          correoEncargado: response.data.correoEncargado,
          sitioWeb: response.data.sitioWeb
        });
      }
    );
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.clienteForm.patchValue({ Logotipo: file });
      this.clienteForm.get('Logotipo')?.markAsTouched();
      this.clienteForm.get('Logotipo')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = reader.result; };
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
      this.clienteForm.get('apellidoPaterno')?.setValidators([Validators.required]);
      this.clienteForm.get('apellidoMaterno')?.setValidators([Validators.required]);
    } else if (value === 2) {
      this.clienteForm.get('apellidoPaterno')?.clearValidators();
      this.clienteForm.get('apellidoMaterno')?.clearValidators();
      this.clienteForm.patchValue({ apellidoPaterno: null, apellidoMaterno: null });
    }

    this.clienteForm.get('apellidoPaterno')?.updateValueAndValidity();
    this.clienteForm.get('apellidoMaterno')?.updateValueAndValidity();
  }

  sanitizeInput(event: any): void {
    const inputElement = event.target as HTMLInputElement;
    const sanitizedValue = inputElement.value.replace(/[^A-Za-z0-9]/g, '');
    inputElement.value = sanitizedValue.slice(0, 13);
    this.clienteForm.get('RFC')?.setValue(inputElement.value, { emitEvent: false });
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
      idPadre: [null, Validators.required],
      rfc: ['', Validators.required],
      tipoPersona: [null, Validators.required],
      estatus: [1, Validators.required],
      logotipo: [this.DEFAULT_AVATAR_URL],
      constanciaSituacionFiscal: [this.DEFAULT_AVATAR_URL],
      comprobanteDomicilio: [this.DEFAULT_AVATAR_URL],
      actaConstitutiva: [this.DEFAULT_AVATAR_URL],
      nombre: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      telefono: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      estado: ['', Validators.required],
      municipio: ['', Validators.required],
      colonia: ['', Validators.required],
      calle: ['', Validators.required],
      entreCalles: ['', Validators.required],
      numeroExterior: ['', Validators.required],
      numeroInterior: ['', Validators.required],
      cp: ['', Validators.required],
      nombreEncargado: ['', Validators.required],
      telefonoEncargado: ['', Validators.required],
      correoEncargado: ['', [Validators.required, Validators.email]],
      sitioWeb: [null, [Validators.required]]
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
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        idPadre: 'Id Padre',
        rfc: 'RFC',
        tipoPersona: 'Tipo de Persona',
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
        cp: 'Código Postal',
        numeroExterior: 'Número Exterior',
        numeroInterior: 'Número Interior',
        nombreEncargado: 'Nombre del Encargado',
        telefonoEncargado: 'Teléfono del Encargado',
        correoEncargado: 'Email del Encargado',
        sitioWeb: 'Sitio Web'
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.clienteForm.controls).forEach(key => {
        const control = this.clienteForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${index + 1}. ${campo}</strong>
      </div>
    `).join('');

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
        customClass: { popup: 'swal2-padding swal2-border' }
      });
      return;
    }
    if (this.clienteForm.contains('id')) this.clienteForm.removeControl('id');
    const v = this.clienteForm.value;
    const payload = {
      ...v,
      idPadre: v.idPadre != null ? Number(v.idPadre) : null,
      tipoPersona: v.tipoPersona != null ? Number(v.tipoPersona) : null
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
        idPadre: 'Id Padre',
        rfc: 'RFC',
        tipoPersona: 'Tipo de Persona',
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
        cp: 'Código Postal',
        numeroExterior: 'Número Exterior',
        numeroInterior: 'Número Interior',
        nombreEncargado: 'Nombre del Encargado',
        telefonoEncargado: 'Teléfono del Encargado',
        correoEncargado: 'Email del Encargado',
        sitioWeb: 'Sitio Web'
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.clienteForm.controls).forEach(key => {
        const control = this.clienteForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, index) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${index + 1}. ${campo}</strong>
      </div>
    `).join('');

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
        customClass: { popup: 'swal2-padding swal2-border' }
      });
      return;
    }
    const v = this.clienteForm.value;
    const payload = {
      ...v,
      idPadre: v.idPadre != null ? Number(v.idPadre) : null,
      tipoPersona: v.tipoPersona != null ? Number(v.tipoPersona) : null
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
  }

  regresar() {
    this.route.navigateByUrl('/clientes');
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

  private readonly MAX_MB = 3;
  private isImage(file: File) { return /^image\/(png|jpe?g|webp)$/i.test(file.type); }
  private isAllowed(file: File) {
    const okImg = this.isImage(file);
    const okDoc = /(pdf|msword|officedocument|excel)/i.test(file.type);
    return (okImg || okDoc) && file.size <= this.MAX_MB * 1024 * 1024;
  }
  private loadPreview(file: File, setter: (url: string | ArrayBuffer | null) => void) {
    if (!this.isImage(file)) { setter(null); return; }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.readAsDataURL(file);
  }

  // logo
  openLogoFilePicker() { this.logoFileInput.nativeElement.click(); }
  onLogoDragOver(e: DragEvent) { e.preventDefault(); this.logoDragging = true; }
  onLogoDragLeave(_e: DragEvent) { this.logoDragging = false; }
  onLogoDrop(e: DragEvent) { e.preventDefault(); this.logoDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handleLogoFile(f); }
  onLogoFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handleLogoFile(f); }
  clearLogoImage(e: Event) {
    e.stopPropagation();
    this.logoPreviewUrl = null;
    this.logoFileInput.nativeElement.value = '';
    this.clienteForm.patchValue({ logotipo: this.DEFAULT_AVATAR_URL });
    this.clienteForm.get('logotipo')?.setErrors(null);
  }
  private handleLogoFile(file: File) {
    if (!this.isAllowed(file)) { this.clienteForm.get('logotipo')?.setErrors({ invalid: true }); return; }
    this.loadPreview(file, url => this.logoPreviewUrl = url);
    this.clienteForm.patchValue({ logotipo: file });
    this.clienteForm.get('logotipo')?.setErrors(null);
  }

  // constancia
  openCsfFilePicker() { this.csfFileInput.nativeElement.click(); }
  onCsfDragOver(e: DragEvent) { e.preventDefault(); this.csfDragging = true; }
  onCsfDragLeave(_e: DragEvent) { this.csfDragging = false; }
  onCsfDrop(e: DragEvent) { e.preventDefault(); this.csfDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handleCsfFile(f); }
  onCsfFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handleCsfFile(f); }

  clearCsfFile(e: Event) {
    e.stopPropagation();
    this.csfPreviewUrl = null;
    this.csfFileInput.nativeElement.value = '';
    this.clienteForm.patchValue({ constanciaSituacionFiscal: this.DEFAULT_AVATAR_URL });
    this.clienteForm.get('constanciaSituacionFiscal')?.setErrors(null);
  }
  private handleCsfFile(file: File) {
    if (!this.isAllowed(file)) { this.clienteForm.get('constanciaSituacionFiscal')?.setErrors({ invalid: true }); return; }
    this.loadPreview(file, url => this.csfPreviewUrl = url);
    this.clienteForm.patchValue({ constanciaSituacionFiscal: file });
    this.clienteForm.get('constanciaSituacionFiscal')?.setErrors(null);
  }

  //comprobante
  openCompDomFilePicker() { this.compDomFileInput.nativeElement.click(); }
  onCompDomDragOver(e: DragEvent) { e.preventDefault(); this.compDomDragging = true; }
  onCompDomDragLeave(_e: DragEvent) { this.compDomDragging = false; }
  onCompDomDrop(e: DragEvent) { e.preventDefault(); this.compDomDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handleCompDomFile(f); }
  onCompDomFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handleCompDomFile(f); }

  clearCompDomFile(e: Event) {
    e.stopPropagation();
    this.compDomPreviewUrl = null;
    this.compDomFileInput.nativeElement.value = '';
    this.clienteForm.patchValue({ comprobanteDomicilio: this.DEFAULT_AVATAR_URL });
    this.clienteForm.get('comprobanteDomicilio')?.setErrors(null);
  }
  private handleCompDomFile(file: File) {
    if (!this.isAllowed(file)) { this.clienteForm.get('comprobanteDomicilio')?.setErrors({ invalid: true }); return; }
    this.loadPreview(file, url => this.compDomPreviewUrl = url);
    this.clienteForm.patchValue({ comprobanteDomicilio: file });
    this.clienteForm.get('comprobanteDomicilio')?.setErrors(null);
  }

  // acta
  openActaFilePicker() { this.actaFileInput.nativeElement.click(); }
  onActaDragOver(e: DragEvent) { e.preventDefault(); this.actaDragging = true; }
  onActaDragLeave(_e: DragEvent) { this.actaDragging = false; }
  onActaDrop(e: DragEvent) { e.preventDefault(); this.actaDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handleActaFile(f); }
  onActaFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handleActaFile(f); }
  clearActaFile(e: Event) {
    e.stopPropagation();
    this.actaPreviewUrl = null;
    this.actaFileInput.nativeElement.value = '';
    this.clienteForm.patchValue({ actaConstitutiva: this.DEFAULT_AVATAR_URL });
    this.clienteForm.get('actaConstitutiva')?.setErrors(null);
  }
  private handleActaFile(file: File) {
    if (!this.isAllowed(file)) { this.clienteForm.get('actaConstitutiva')?.setErrors({ invalid: true }); return; }
    this.loadPreview(file, url => this.actaPreviewUrl = url);
    this.clienteForm.patchValue({ actaConstitutiva: file });
    this.clienteForm.get('actaConstitutiva')?.setErrors(null);
  }


}