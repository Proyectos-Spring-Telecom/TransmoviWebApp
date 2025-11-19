import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-operador',
  templateUrl: './alta-operador.component.html',
  styleUrl: './alta-operador.component.scss',
  animations: [fadeInUpAnimation]
})
export class AltaOperadorComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public operadorForm: FormGroup;
  public idOperador: number;
  public listaUsuarios: any;
  public title = 'Agregar Operador';
  displayUsuario = (it: any) => it ? `${it.nombre} ${it.apellidoPaterno ?? ''}`.trim() : '';
  public idClienteUser: any;
  public listaCategorias: any;
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private operService: OperadoresService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private usuaService: UsuariosService,
    private users: AuthenticationService,
  ) {
    const user = this.users.getUser();
    this.idClienteUser = Number(user?.idCliente);
  }

  ngOnInit(): void {
    this.obtenerTipoLicencia()
    this.obtenerCategorias()
    this.obtenerUsuarios()
    this.initForm()
    this.activatedRouted.params.subscribe(
      (params) => {
        this.idOperador = params['idOperador'];
        if (this.idOperador) {
          this.title = 'Actualizar Operador';
          this.obtenerOperadorID();
          this.operadorForm.controls['idUsuario'].disable();
        }
      }
    )
  }

  public listaTipos: any[] = [];

  private mapCategoria = (c: any) => ({
    ...c,
    id: Number(c?.idCategoriaLicencia ?? c?.id ?? c?.Id ?? c?.ID),
    nombre: c?.nombreCategoriaLicencia ?? c?.nombre ?? c?.descripcion ?? ''
  });

  private mapTipo = (t: any) => ({
    ...t,
    id: Number(t?.idTipoLicencia ?? t?.id ?? t?.Id ?? t?.ID),
    nombre: t?.nombreTipoLicencia ?? t?.nombre ?? t?.descripcion ?? ''
  });

  obtenerTipoLicencia() {
    this.operService.obtenerTiposLicencia().subscribe((response: any) => {
      this.listaTipos = (response?.data ?? []).map(this.mapTipo);
    });
  }

  obtenerCategorias() {
    this.operService.obtenerCaregoriasLicencia().subscribe((response: any) => {
      this.listaCategorias = (response?.data ?? []).map(this.mapCategoria);
    });
  }

  private toISODate(val: any): string | null {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return null;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  onRangoVigenciaChanged(e: any) {
    const [start, end] = e?.value || [];
    this.operadorForm.patchValue({
      fechaExpedicion: this.toISODate(start),
      fechaVencimiento: this.toISODate(end),
    });
  }

  // Añade esto en tu componente
  private buildPayload() {
    const v = this.operadorForm.value;
    return {
      // campos del esquema
      fechaNacimiento: v.fechaNacimiento,
      identificacion: v.identificacion,
      foto: v.fotoOperador,                 // 👈 mapeo requerido
      comprobanteDomicilio: v.comprobanteDomicilio,
      certificadoMedico: v.examenMedico,    // 👈 mapeo requerido
      antecedentesNoPenales: v.antecedentesNoPenales,
      estatus: v.estatus,
      idUsuario: v.idUsuario,
      licencia: v.licencia,
      numeroLicencia: v.numeroLicencia,
      fechaExpedicion: v.fechaExpedicion,
      fechaVencimiento: v.fechaVencimiento,
      idTipoLicencia: v.idTipoLicencia,
      idCategoriaLicencia: v.idCategoriaLicencia,
    };
  }

  obtenerOperadorID() {
    this.operService.obtenerOperador(this.idOperador).subscribe((response: any) => {
      const raw = Array.isArray(response?.data)
        ? response.data[0]
        : response?.operador ?? response?.data ?? response ?? {};

      const get = (o: any, keys: string[]) => {
        for (const k of keys) {
          const v = o?.[k];
          if (v !== undefined && v !== null) return v;
        }
        return null;
      };

      const licArr = get(raw, ['licencias', 'Licencias']);
      const lic = Array.isArray(licArr) && licArr.length ? licArr[0] : {};

      const fechaNacimientoRaw = get(raw, ['fechaNacimiento', 'FechaNacimiento']);
      const fechaNacimiento = fechaNacimientoRaw ? String(fechaNacimientoRaw).split('T')[0] : null;

      const fechaExpedicionRaw = get(lic, ['fechaExpedicion', 'FechaExpedicion']);
      const fechaVencimientoRaw = get(lic, ['fechaVencimiento', 'FechaVencimiento']);
      const fechaExpedicion = fechaExpedicionRaw ? String(fechaExpedicionRaw).split('T')[0] : null;
      const fechaVencimiento = fechaVencimientoRaw ? String(fechaVencimientoRaw).split('T')[0] : null;

      const numeroLicencia = get(lic, ['numeroLicencia', 'NumeroLicencia']) ?? get(raw, ['numeroLicencia', 'NumeroLicencia']);
      const idTipoLicencia = get(lic, ['idTipoLicencia', 'IdTipoLicencia']);
      const idCategoriaLicencia = get(lic, ['idCategoriaLicencia', 'IdCategoriaLicencia']);

      const idUsuario = get(raw, ['idUsuario', 'IdUsuario']);
      const estatus = get(raw, ['estatusOperador', 'estatus', 'EstatusOperador', 'Estatus']);

      const identificacion = get(raw, ['identificacion', 'Identificacion']);
      const comprobanteDomicilio = get(raw, ['comprobanteDomicilio', 'ComprobanteDomicilio']);
      const antecedentesNoPenales = get(raw, ['antecedentesNoPenales', 'AntecedentesNoPenales']);
      const licenciaUrl = get(lic, ['licencia', 'Licencia']) ?? get(raw, ['licencia', 'Licencia']);
      const examenMedico = get(raw, ['certificadoMedico', 'CertificadoMedico', 'examenMedico', 'ExamenMedico']);
      const fotoOperador = get(raw, ['fotoOperador', 'FotoOperador', 'foto', 'Foto']);

      this.operadorForm.patchValue({
        numeroLicencia: numeroLicencia ?? '',
        fechaNacimiento,
        fechaExpedicion,
        fechaVencimiento,
        idTipoLicencia: idTipoLicencia != null ? Number(idTipoLicencia) : null,
        idCategoriaLicencia: idCategoriaLicencia != null ? Number(idCategoriaLicencia) : null,
        idUsuario: idUsuario != null ? Number(idUsuario) : null,
        estatus: estatus != null ? Number(estatus) : 1,
        identificacion: identificacion ?? null,
        comprobanteDomicilio: comprobanteDomicilio ?? null,
        antecedentesNoPenales: antecedentesNoPenales ?? null,
        licencia: licenciaUrl ?? null,
        examenMedico: examenMedico ?? null,
        fotoOperador: fotoOperador ?? null,
      });
    });
  }

  obtenerUsuarios() {
    this.usuaService.obtenerUsuariosRolOperador(this.idClienteUser).subscribe((response) => {
      this.listaUsuarios = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(
          c?.idUsuario ??
          c?.IdUsuario ??
          c?.id ??
          c?.Id ??
          c?.ID
        ),
      }));
    });
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  initForm() {
    this.operadorForm = this.fb.group({
      numeroLicencia: ['', Validators.required],
      fechaNacimiento: [null, Validators.required],
      fechaExpedicion: ['', Validators.required],
      fechaVencimiento: ['', Validators.required],
      idTipoLicencia: [null, Validators.required],
      idCategoriaLicencia: [null, Validators.required],
      identificacion: [null, Validators.required],
      comprobanteDomicilio: [null, Validators.required],
      antecedentesNoPenales: [null, Validators.required],
      licencia: [null, Validators.required],
      fotoOperador: [null, Validators.required],
      examenMedico: [null, Validators.required],
      estatus: [1, Validators.required],
      idUsuario: [null, Validators.required],
    });
  }


  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idOperador) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.operadorForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        numeroLicencia: 'Número de Licencia',
        fechaNacimiento: 'Fecha de Nacimiento',
        fechaExpedicion: 'Fecha de Expedición',
        fechaVencimiento: 'Fecha de Vencimiento',
        idTipoLicencia: 'Tipo de Licencia',
        idCategoriaLicencia: 'Categoría de Licencia',
        idUsuario: 'Usuario',
        licencia: 'Licencia',
        identificacion: 'Identificación',
        comprobanteDomicilio: 'Comprobante de Domicilio',
        antecedentesNoPenales: 'Antecedentes No Penales',
        fotoOperador: 'Foto del Operador',
        examenMedico: 'Certificado Médico'
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.operadorForm.controls).forEach(key => {
        const control = this.operadorForm.get(key);
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

    this.operadorForm.removeControl('id');

    const payload = this.buildPayload();

    // 🔹 aquí forzamos el formato requerido por la API
    const fechaNacControl = this.operadorForm.get('fechaNacimiento')?.value;
    payload.fechaNacimiento = this.formatFechaNacimiento(fechaNacControl);

    this.operService.agregarOperador(payload).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo operador de manera exitosa.`,
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
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.operadorForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        numeroLicencia: 'Número de Licencia',
        fechaNacimiento: 'Fecha de Nacimiento',
        fechaExpedicion: 'Fecha de Expedición',
        fechaVencimiento: 'Fecha de Vencimiento',
        idTipoLicencia: 'Tipo de Licencia',
        idCategoriaLicencia: 'Categoría de Licencia',
        idUsuario: 'Usuario',
        licencia: 'Licencia',
        identificacion: 'Identificación',
        comprobanteDomicilio: 'Comprobante de Domicilio',
        antecedentesNoPenales: 'Antecedentes No Penales',
        fotoOperador: 'Foto del Operador',
        examenMedico: 'Certificado Médico'
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.operadorForm.controls).forEach(key => {
        const control = this.operadorForm.get(key);
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

    const payload = this.buildPayload();
    delete payload.idUsuario; // como ya lo tenías

    // 🔹 mismo formateo aquí
    const fechaNacControl = this.operadorForm.get('fechaNacimiento')?.value;
    payload.fechaNacimiento = this.formatFechaNacimiento(fechaNacControl);

    this.operService.actualizarOperador(this.idOperador, payload).subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos del operador se actualizaron correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error: any) => {
        this.submitButton = 'Actualizar';
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



  private formatFechaNacimiento(value: any): string | null {
    if (!value) return null;

    const d = value instanceof Date ? value : new Date(value);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    // ==> "1990-05-15"
    return `${year}-${month}-${day}`;
  }


  regresar() {
    this.route.navigateByUrl('/operadores');
  }


  private uploadToken = {
    identificacion: 0,
    comprobanteDomicilio: 0,
    antecedentesNoPenales: 0,
    licencia: 0,
    fotoOperador: 0,
    examenMedico: 0,
  };


  // ===== ViewChilds =====
  @ViewChild('identFileInput') identificacionFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('comprobanteFileInput') comprobanteFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('antecedentesFileInput') antecedentesFileInput!: ElementRef<HTMLInputElement>;

  // ===== Estado UI =====
  identificacionPreviewUrl: string | ArrayBuffer | null = null;
  comprobantePreviewUrl: string | ArrayBuffer | null = null;
  antecedentesPreviewUrl: string | ArrayBuffer | null = null;

  identificacionFileName: string | null = null;
  comprobanteFileName: string | null = null;
  antecedentesFileName: string | null = null;

  identificacionDragging = false;
  comprobanteDragging = false;
  antecedentesDragging = false;

  uploadingIdent = false;
  uploadingComprobante = false;
  uploadingAntecedentes = false;

  // Tamaño máximo (MB)
  private readonly MAX_MB = 3;

  // ===== Helpers =====
  private isPdf(file: File): boolean {
    return file.type === 'application/pdf';
  }
  private isAllowedPdf(file: File): boolean {
    return this.isPdf(file) && file.size <= this.MAX_MB * 1024 * 1024;
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

  // ===== Identificación =====
  openIdentFilePicker(): void { this.identificacionFileInput.nativeElement.click(); }
  onIdentDragOver(e: DragEvent) { e.preventDefault(); this.identificacionDragging = true; }
  onIdentDragLeave(_e: DragEvent) { this.identificacionDragging = false; }
  onIdentDrop(e: DragEvent) { e.preventDefault(); this.identificacionDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handleIdentFile(f); }
  onIdentFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handleIdentFile(f); }

  clearIdentFile(e: Event) {
    e.stopPropagation();
    this.identificacionPreviewUrl = null;
    this.identificacionFileName = null;
    this.identificacionFileInput.nativeElement.value = '';
    this.operadorForm.patchValue({ identificacion: null });
    this.operadorForm.get('identificacion')?.setErrors({ required: true });
  }

  private handleIdentFile(file: File) {
    if (!this.isAllowedPdf(file)) {
      this.operadorForm.get('identificacion')?.setErrors({ invalid: true });
      return;
    }
    this.identificacionFileName = file.name;
    // Para mantener tu estructura de preview, dejamos la url en null para PDF (no se muestra imagen)
    this.identificacionPreviewUrl = null;

    // 1) Colocamos el File temporalmente
    this.operadorForm.patchValue({ identificacion: file });
    this.operadorForm.get('identificacion')?.setErrors(null);

    // 2) Subimos y sustituimos por URL
    this.uploadIdentificacion(file);
  }

  private uploadIdentificacion(file: File): void {
    if (this.uploadingIdent) return;
    this.uploadingIdent = true;

    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'operadores');
    fd.append('idModule', '9');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = this.extractFileUrl(res);
        if (url) {
          this.operadorForm.patchValue({ identificacion: url });
        }
      },
      error: (err) => { console.error('[UPLOAD][identificacion]', err); },
      complete: () => { this.uploadingIdent = false; },
    });
  }

  // ===== Comprobante de Domicilio =====
  openComprobanteFilePicker(): void { this.comprobanteFileInput.nativeElement.click(); }
  onComprobanteDragOver(e: DragEvent) { e.preventDefault(); this.comprobanteDragging = true; }
  onComprobanteDragLeave(_e: DragEvent) { this.comprobanteDragging = false; }
  onComprobanteDrop(e: DragEvent) { e.preventDefault(); this.comprobanteDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handleComprobanteFile(f); }
  onComprobanteFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handleComprobanteFile(f); }

  clearComprobanteFile(e: Event) {
    e.stopPropagation();
    this.comprobantePreviewUrl = null;
    this.comprobanteFileName = null;
    this.comprobanteFileInput.nativeElement.value = '';
    this.operadorForm.patchValue({ comprobanteDomicilio: null });
    this.operadorForm.get('comprobanteDomicilio')?.setErrors({ required: true });
  }

  private handleComprobanteFile(file: File) {
    if (!this.isAllowedPdf(file)) {
      this.operadorForm.get('comprobanteDomicilio')?.setErrors({ invalid: true });
      return;
    }
    this.comprobanteFileName = file.name;
    this.comprobantePreviewUrl = null;

    this.operadorForm.patchValue({ comprobanteDomicilio: file });
    this.operadorForm.get('comprobanteDomicilio')?.setErrors(null);

    this.uploadComprobante(file);
  }

  private uploadComprobante(file: File): void {
    if (this.uploadingComprobante) return;
    this.uploadingComprobante = true;

    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'operadores');
    fd.append('idModule', '9');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = this.extractFileUrl(res);
        if (url) {
          this.operadorForm.patchValue({ comprobanteDomicilio: url });
        }
      },
      error: (err) => { console.error('[UPLOAD][comprobanteDomicilio]', err); },
      complete: () => { this.uploadingComprobante = false; },
    });
  }

  // ===== Antecedentes No Penales =====
  openAntecedentesFilePicker(): void { this.antecedentesFileInput.nativeElement.click(); }
  onAntecedentesDragOver(e: DragEvent) { e.preventDefault(); this.antecedentesDragging = true; }
  onAntecedentesDragLeave(_e: DragEvent) { this.antecedentesDragging = false; }
  onAntecedentesDrop(e: DragEvent) { e.preventDefault(); this.antecedentesDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handleAntecedentesFile(f); }
  onAntecedentesFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handleAntecedentesFile(f); }

  clearAntecedentesFile(e: Event) {
    e.stopPropagation();
    this.antecedentesPreviewUrl = null;
    this.antecedentesFileName = null;
    this.antecedentesFileInput.nativeElement.value = '';
    this.operadorForm.patchValue({ antecedentesNoPenales: null });
    this.operadorForm.get('antecedentesNoPenales')?.setErrors({ required: true });
  }

  private handleAntecedentesFile(file: File) {
    if (!this.isAllowedPdf(file)) {
      this.operadorForm.get('antecedentesNoPenales')?.setErrors({ invalid: true });
      return;
    }
    this.antecedentesFileName = file.name;
    this.antecedentesPreviewUrl = null;

    this.operadorForm.patchValue({ antecedentesNoPenales: file });
    this.operadorForm.get('antecedentesNoPenales')?.setErrors(null);

    this.uploadAntecedentes(file);
  }

  private uploadAntecedentes(file: File): void {
    if (this.uploadingAntecedentes) return;
    this.uploadingAntecedentes = true;

    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'operadores');
    fd.append('idModule', '9');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = this.extractFileUrl(res);
        if (url) {
          this.operadorForm.patchValue({ antecedentesNoPenales: url });
        }
      },
      error: (err) => { console.error('[UPLOAD][antecedentesNoPenales]', err); },
      complete: () => { this.uploadingAntecedentes = false; },
    });
  }


  @ViewChild('licenciaFileInput') licenciaFileInput!: ElementRef<HTMLInputElement>;
  licenciaPreviewUrl: string | ArrayBuffer | null = null;
  licenciaFileName: string | null = null;
  licenciaDragging = false;
  uploadingLicencia = false;



  // NEW
  private isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // NEW (acepta PDF o imagen dentro del límite)
  private isAllowedFile(file: File): boolean {
    return (this.isPdf(file) || this.isImage(file)) && file.size <= this.MAX_MB * 1024 * 1024;
  }

  // ===== Licencia (PDF o imagen) =====
  openLicFilePicker(): void { this.licenciaFileInput.nativeElement.click(); }
  onLicDragOver(e: DragEvent) { e.preventDefault(); this.licenciaDragging = true; }
  onLicDragLeave(_e: DragEvent) { this.licenciaDragging = false; }
  onLicDrop(e: DragEvent) {
    e.preventDefault();
    this.licenciaDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleLicFile(f);
  }
  onLicFileSelected(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.handleLicFile(f);
  }

  clearLicFile(e: Event) {
    e.stopPropagation();
    this.licenciaPreviewUrl = null;
    this.licenciaFileName = null;
    this.licenciaFileInput.nativeElement.value = '';
    this.operadorForm.patchValue({ licencia: null });
    this.operadorForm.get('licencia')?.setErrors({ required: true });
  }

  private handleLicFile(file: File) {
    if (!this.isAllowedFile(file)) {
      this.operadorForm.get('licencia')?.setErrors({ invalid: true });
      return;
    }

    this.licenciaFileName = file.name;

    if (this.isImage(file)) {
      // Preview para imagen
      const reader = new FileReader();
      reader.onload = () => { this.licenciaPreviewUrl = reader.result; };
      reader.readAsDataURL(file);
    } else {
      // PDF: sin preview de imagen
      this.licenciaPreviewUrl = null;
    }

    // Colocar temporalmente el File en el form
    this.operadorForm.patchValue({ licencia: file });
    this.operadorForm.get('licencia')?.setErrors(null);

    // Subir y sustituir por URL
    this.uploadLicencia(file);
  }

  private uploadLicencia(file: File): void {
    if (this.uploadingLicencia) return;
    this.uploadingLicencia = true;

    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'operadores');
    fd.append('idModule', '9');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = this.extractFileUrl(res);
        if (url) {
          this.operadorForm.patchValue({ licencia: url });
        }
      },
      error: (err) => { console.error('[UPLOAD][licencia]', err); },
      complete: () => { this.uploadingLicencia = false; },
    });
  }

  @ViewChild('fotoOperadorFileInput') fotoOperadorFileInput!: ElementRef<HTMLInputElement>;

  fotoOperadorPreviewUrl: string | ArrayBuffer | null = null;
  fotoOperadorFileName: string | null = null;
  fotoOperadorDragging = false;
  uploadingFotoOperador = false;



  openFotoOperadorFilePicker(): void { this.fotoOperadorFileInput.nativeElement.click(); }
  onFotoOperadorDragOver(e: DragEvent) { e.preventDefault(); this.fotoOperadorDragging = true; }
  onFotoOperadorDragLeave(_e: DragEvent) { this.fotoOperadorDragging = false; }
  onFotoOperadorDrop(e: DragEvent) {
    e.preventDefault();
    this.fotoOperadorDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleFotoOperadorFile(f);
  }
  onFotoOperadorFileSelected(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.handleFotoOperadorFile(f);
  }

  private handleFotoOperadorFile(file: File) {
    if (!file || file.size === 0 || !this.isImage(file) || file.size > this.MAX_MB * 1024 * 1024) {
      this.operadorForm.get('fotoOperador')?.setErrors({ invalid: true });
      return;
    }
    this.fotoOperadorFileName = file.name;

    const reader = new FileReader();
    reader.onload = () => { this.fotoOperadorPreviewUrl = reader.result; };
    reader.readAsDataURL(file);

    this.operadorForm.patchValue({ fotoOperador: file });
    this.operadorForm.get('fotoOperador')?.setErrors(null);

    this.uploadFotoOperador(file);
  }

  clearFotoOperadorFile(e: Event) {
    e.stopPropagation();
    this.fotoOperadorPreviewUrl = null;
    this.fotoOperadorFileName = null;
    this.fotoOperadorFileInput.nativeElement.value = '';
    this.operadorForm.patchValue({ fotoOperador: null });
    this.operadorForm.get('fotoOperador')?.setErrors({ required: true });
  }

  private uploadFotoOperador(file: File): void {
    if (this.uploadingFotoOperador) return;
    this.uploadingFotoOperador = true;
    const myToken = ++this.uploadToken.fotoOperador;

    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'operadores');
    fd.append('idModule', '9');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        if (myToken !== this.uploadToken.fotoOperador) return;
        const url = this.extractFileUrl(res);
        if (url) this.operadorForm.patchValue({ fotoOperador: url });
        else this.operadorForm.get('fotoOperador')?.setErrors({ upload: true });
      },
      error: () => {
        if (myToken !== this.uploadToken.fotoOperador) return;
        this.operadorForm.get('fotoOperador')?.setErrors({ upload: true });
      },
      complete: () => {
        if (myToken === this.uploadToken.fotoOperador) this.uploadingFotoOperador = false;
      },
    });
  }
  @ViewChild('examenMedicoFileInput') examenMedicoFileInput!: ElementRef<HTMLInputElement>;
  examenMedicoFileName: string | null = null;
  examenMedicoDragging = false;
  uploadingExamenMedico = false;

  openExamenMedicoFilePicker(): void { this.examenMedicoFileInput.nativeElement.click(); }
  onExamenMedicoDragOver(e: DragEvent) { e.preventDefault(); this.examenMedicoDragging = true; }
  onExamenMedicoDragLeave(_e: DragEvent) { this.examenMedicoDragging = false; }
  onExamenMedicoDrop(e: DragEvent) {
    e.preventDefault();
    this.examenMedicoDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleExamenMedicoFile(f);
  }
  onExamenMedicoFileSelected(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.handleExamenMedicoFile(f);
  }

  private handleExamenMedicoFile(file: File) {
    if (!file || file.size === 0 || !this.isPdf(file) || file.size > this.MAX_MB * 1024 * 1024) {
      this.operadorForm.get('examenMedico')?.setErrors({ invalid: true });
      return;
    }
    this.examenMedicoFileName = file.name;

    // Guardamos File temporal y limpiamos errores
    this.operadorForm.patchValue({ examenMedico: file });
    this.operadorForm.get('examenMedico')?.setErrors(null);

    // Subimos y sustituimos por URL
    this.uploadExamenMedico(file);
  }

  clearExamenMedicoFile(e: Event) {
    e.stopPropagation();
    this.examenMedicoFileName = null;
    this.examenMedicoFileInput.nativeElement.value = '';
    this.operadorForm.patchValue({ examenMedico: null });
    this.operadorForm.get('examenMedico')?.setErrors({ required: true });
  }

  private uploadExamenMedico(file: File): void {
    if (this.uploadingExamenMedico) return;
    this.uploadingExamenMedico = true;

    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('folder', 'operadores');
    fd.append('idModule', '9');

    this.usuaService.uploadFile(fd).subscribe({
      next: (res: any) => {
        const url = this.extractFileUrl(res);
        if (url) {
          this.operadorForm.patchValue({ examenMedico: url });
        } else {
          this.operadorForm.get('examenMedico')?.setErrors({ upload: true });
        }
      },
      error: () => {
        this.operadorForm.get('examenMedico')?.setErrors({ upload: true });
      },
      complete: () => { this.uploadingExamenMedico = false; },
    });
  }

}
