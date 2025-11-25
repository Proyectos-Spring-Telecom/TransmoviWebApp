import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { InstalacionesService } from 'src/app/shared/services/instalaciones.service';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import { VerificacionesService } from 'src/app/shared/services/verificaciones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-verificacion',
  templateUrl: './agregar-verificacion.component.html',
  styleUrl: './agregar-verificacion.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarVerificacionComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public verificacionesForm: FormGroup;
  public idVerificacion: number;
  public title = 'Agregar Verificación';
  public listaClientes: any[] = [];
  public listaInstalaciones: any;
  public listaOperadores: any;
  public listaTipoVerificaciones: any;
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private verService: VerificacionesService,
    private activatedRouted: ActivatedRoute,
    private insService: InstalacionesService,
    private route: Router,
    private opService: OperadoresService,
  ) {}

  ngOnInit(): void {
    this.obtenerOperadores();
    this.obtenerTipoVerificaciones();
    this.obtenerInstalaciones();
    this.initForm();
    this.activatedRouted.params.subscribe((params) => {
      this.idVerificacion = params['idVerificacion'];
      if (this.idVerificacion) {
        this.title = 'Actualizar Verificación';
        this.obtenerVerificacion();
      }
    });
  }

  displayOperador = (item: any) => {
  if (!item) return '';
  return `${item.nombreUsuario} ${item.apellidoPaternoUsuario || ''} ${item.apellidoMaternoUsuario || ''}`.trim();
};


  obtenerOperadores() {
    this.opService.obtenerOperadores().subscribe((response) => {
      this.listaOperadores = response;
    });
  }

  obtenerTipoVerificaciones() {
    this.verService.obtenerTipoVerificaciones().subscribe((response) => {
      this.listaTipoVerificaciones = response.data;
    });
  }

  displayInstalacion = (item: any) => {
    if (!item) return '';
    return `Placa: ${item.placaVehiculo}  |  BlueVox: ${item.numeroSerieBlueVox}  |  Dispositivo: ${item.numeroSerieDispositivo}`;
  };

  obtenerInstalaciones() {
    this.insService.obtenerInstalaciones().subscribe((response) => {
      this.listaInstalaciones = response.data;
    });
  }

  onRangoFechasChange(e: any) {
    const value = e.value || [];
    this.verificacionesForm.patchValue({
      verificacionActual: value[0] || null,
      proximaVerificacion: value[1] || null,
    });
  }

  private formatearFechaSwagger(date: Date | string | null): string | null {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
      d.getFullYear() +
      '-' +
      pad(d.getMonth() + 1) +
      '-' +
      pad(d.getDate()) +
      'T' +
      pad(d.getHours()) +
      ':' +
      pad(d.getMinutes()) +
      ':' +
      pad(d.getSeconds())
    );
  }

  obtenerVerificacion() {
    this.verService
      .obtenerVerificacion(this.idVerificacion)
      .subscribe((response: any) => {
        const rawData = response?.data;
        const data = Array.isArray(rawData) ? rawData[0] : rawData;

        if (!data) {
          return;
        }

        this.verificacionesForm.patchValue({
          verificacionActual: data.verificacionActual
            ? new Date(data.verificacionActual)
            : null,
          proximaVerificacion: data.proximaVerificacion
            ? new Date(data.proximaVerificacion)
            : null,
          idInstalacion: data.idInstalacion,
          idOperador: data.idOperador,
          estatus: data.estatus,
          notaVerificacion: data.notaVerificacion,
          idTipoVerificacion: data.idTipoVerificacion,
        });
      });
  }

  initForm() {
    this.verificacionesForm = this.fb.group({
      verificacionActual: [null, Validators.required],
      proximaVerificacion: [null, Validators.required],
      idInstalacion: [null, Validators.required],
      idOperador: [null, Validators.required],
      notaVerificacion: [null],
      idTipoVerificacion: [null, Validators.required],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idVerificacion) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.verificacionesForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        verificacionActual: 'Fecha de la verificación actual',
        proximaVerificacion: 'Fecha de la próxima verificación',
        idInstalacion: 'Instalación',
        idOperador: 'Operador',
        idTipoVerificacion: 'Tipo de verificación',
        notaVerificacion: 'Nota de verificación',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.verificacionesForm.controls).forEach((key) => {
        const control = this.verificacionesForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, index) => `
            <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                        background: #caa8a8; text-align: center; margin-bottom: 8px;
                        border-radius: 4px;">
              <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
            </div>
          `
        )
        .join('');

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
          popup: 'swal2-padding swal2-border',
        },
      });
      return;
    }

    if (!this.notaFile) {
      this.submitButton = 'Guardar';
      this.loading = false;
      this.verificacionesForm
        .get('notaVerificacion')
        ?.setErrors({ required: true });
      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
              <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
                Debes adjuntar la <strong>imagen de la nota de verificación</strong>.
              </p>
            `,
        icon: 'error',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const formValue = this.verificacionesForm.value;

    const fd = new FormData();
    fd.append(
      'verificacionActual',
      this.formatearFechaSwagger(formValue.verificacionActual) || ''
    );
    fd.append(
      'proximaVerificacion',
      this.formatearFechaSwagger(formValue.proximaVerificacion) || ''
    );
    fd.append('idInstalacion', String(Number(formValue.idInstalacion)));
    fd.append('idOperador', String(Number(formValue.idOperador)));
    fd.append('estatus', String(Number(formValue.estatus ?? 1)));
    fd.append('notaVerificacion', this.notaFile, this.notaFile.name);
    fd.append(
      'idTipoVerificacion',
      String(Number(formValue.idTipoVerificacion))
    );

    this.verService.agregarVerificacion(fd).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo registro de verificación vehicular.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      (error) => {
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

  if (this.verificacionesForm.invalid) {
    this.submitButton = 'Guardar';
    this.loading = false;

    const etiquetas: any = {
      verificacionActual: 'Fecha de la verificación actual',
      proximaVerificacion: 'Fecha de la próxima verificación',
      idInstalacion: 'Instalación',
      idOperador: 'Operador',
      idTipoVerificacion: 'Tipo de verificación',
      notaVerificacion: 'Nota de verificación',
    };

    const camposFaltantes: string[] = [];
    Object.keys(this.verificacionesForm.controls).forEach((key) => {
      const control = this.verificacionesForm.get(key);
      if (control?.invalid && control.errors?.['required']) {
        camposFaltantes.push(etiquetas[key] || key);
      }
    });

    const lista = camposFaltantes
      .map(
        (campo, index) => `
          <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                      background: #caa8a8; text-align: center; margin-bottom: 8px;
                      border-radius: 4px;">
            <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
          </div>
        `
      )
      .join('');

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
        popup: 'swal2-padding swal2-border',
      },
    });
    return;
  }

  const formValue = this.verificacionesForm.value;

  const payload = {
    verificacionActual: this.formatearFechaSwagger(formValue.verificacionActual),
    proximaVerificacion: this.formatearFechaSwagger(formValue.proximaVerificacion),
    idInstalacion: Number(formValue.idInstalacion),
    idOperador: Number(formValue.idOperador),
    estatus: Number(formValue.estatus ?? 1),
    notaVerificacion: formValue.notaVerificacion,
    idTipoVerificacion: Number(formValue.idTipoVerificacion),
  };

  this.verService
    .actualizarVerificacion(Number(this.idVerificacion), payload)
    .subscribe(
      (response) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Los datos del registro de verificación vehicular se actualizaron de manera correcta.`,
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


  regresar() {
    this.route.navigateByUrl('/verificaciones');
  }

  @ViewChild('notaFileInput') notaFileInput!: ElementRef<HTMLInputElement>;
  notaPreviewUrl: string | ArrayBuffer | null = null;
  notaDragging = false;
  private notaFile: File | null = null;

  private readonly DEFAULT_AVATAR_URL =
    'https://transmovi.s3.us-east-2.amazonaws.com/imagenes/user_default.png';
  private readonly MAX_MB = 3;
  private readonly S3_FOLDER = 'usuarios';
  private readonly S3_ID_MODULE = 2;

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
    }
    fd.append('folder', this.S3_FOLDER);
    fd.append('idModule', String(this.S3_ID_MODULE));
    return fd;
  }

  private uploadNotaAuto(): void {
    if (!this.notaFile) {
      this.verificacionesForm.get('notaVerificacion')?.setErrors({ required: true });
      return;
    }
  }

  openNotaFilePicker() {
    this.notaFileInput.nativeElement.click();
  }

  onNotaDragOver(e: DragEvent) {
    e.preventDefault();
    this.notaDragging = true;
  }

  onNotaDragLeave(_e: DragEvent) {
    this.notaDragging = false;
  }

  onNotaDrop(e: DragEvent) {
    e.preventDefault();
    this.notaDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.handleNotaFile(f);
  }

  onNotaFileSelected(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.handleNotaFile(f);
  }

  clearNotaImage(e: Event) {
    e.stopPropagation();
    this.notaPreviewUrl = null;
    this.notaFileInput.nativeElement.value = '';
    this.notaFile = null;
    this.verificacionesForm.patchValue({ notaVerificacion: null });
    this.verificacionesForm.get('notaVerificacion')?.setErrors({ required: true });
  }

  private handleNotaFile(file: File) {
    if (!this.isAllowed(file)) {
      this.verificacionesForm.get('notaVerificacion')?.setErrors({ invalid: true });
      return;
    }
    this.loadPreview(file, (url) => (this.notaPreviewUrl = url));
    this.notaFile = file;
    this.verificacionesForm.patchValue({ notaVerificacion: file.name });
    this.verificacionesForm.get('notaVerificacion')?.setErrors(null);
  }
}
