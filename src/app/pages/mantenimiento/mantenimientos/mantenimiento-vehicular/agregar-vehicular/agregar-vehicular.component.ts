import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { CatReferenciaService } from 'src/app/shared/services/cat-referenciaServicio.service';
import { InstalacionesService } from 'src/app/shared/services/instalaciones.service';
import { MantenimientoVehicularService } from 'src/app/shared/services/mat-vehicular.service';
import { TallereService } from 'src/app/shared/services/talleres.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-vehicular',
  templateUrl: './agregar-vehicular.component.html',
  styleUrl: './agregar-vehicular.component.scss',
  animations: [fadeInUpAnimation],
})
export class AgregarVehicularComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public manVehicularForm: FormGroup;
  public idManVehicular: number;
  public title = 'Agregar Mantenimiento Vehicular';
  public listaClientes: any[] = [];
  public listaInstalaciones: any;
  public listaReferenciasServicios: any;
  public listaTalleres: any;
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private manteVeh: MantenimientoVehicularService,
    private activatedRouted: ActivatedRoute,
    private insService: InstalacionesService,
    private route: Router,
    private refService: CatReferenciaService,
    private talleService: TallereService,
    private usuaService: UsuariosService,
  ) { }

  ngOnInit(): void {
    this.obtenerTalleres();
    this.obtenerCatRerenciaServicio();
    this.obtenerInstalaciones();
    this.initForm();
    this.activatedRouted.params.subscribe((params) => {
      this.idManVehicular = params['idManVehicular'];
      if (this.idManVehicular) {
        this.title = 'Actualizar Mantenimiento Vehicular';
        this.obtenerManVehicular();
      }
    });
  }

  displayInstalacion = (item: any) => {
    if (!item) return '';
    return `Placa: ${item.placaVehiculo}  |  BlueVox: ${item.numeroSerieBlueVox}  |  Dispositivo: ${item.numeroSerieDispositivo}`;
  };

  onTarifaFocus(): void {
    const c = this.manVehicularForm.get('costo');
    if (!c) return;
    const raw = (c.value ?? '').toString();
    c.setValue(raw.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  }

  onTarifaBlur(): void {
    const c = this.manVehicularForm.get('costo');
    if (!c) return;
    const raw = (c.value ?? '').toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) {
      c.setValue('');
      return;
    }
    c.setValue(`$${num.toFixed(2)}`);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  obtenerTalleres() {
    this.talleService.obtenerTalleres().subscribe((response: any) => {
      this.listaTalleres = (response || []).map((t: any) => ({
        ...t,
        Id: Number(t.Id),
        id: Number(t.Id)
      }));
    });
  }

  obtenerCatRerenciaServicio() {
    this.refService.obtenerReferenciaServicios().subscribe((response) => {
      this.listaReferenciasServicios = response.data;
    });
  }

  obtenerInstalaciones() {
    this.insService.obtenerInstalaciones().subscribe((response) => {
      this.listaInstalaciones = response.data;
    });
  }

  onRangoFechasChange(e: any) {
    const value = e.value || [];
    this.manVehicularForm.patchValue({
      fechaInicio: value[0] || null,
      fechaFinal: value[1] || null,
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

  obtenerManVehicular() {
    this.manteVeh
      .obtenerMatVehicular(this.idManVehicular)
      .subscribe((response: any) => {
        const rawData = response?.data;
        const data = Array.isArray(rawData) ? rawData[0] : rawData;

        if (!data) {
          return;
        }

        const costoDisplay =
          data.costo != null ? `$${Number(data.costo).toFixed(2)}` : null;

        this.manVehicularForm.patchValue({
          idInstalacion: data.idInstalacion,
          idReferencia: data.idReferencia,
          servicioDescripcion: data.servicioDescripcion,
          notaServicio: data.notaServicio,
          idEstatus: data.idEstatus,
          fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
          fechaFinal: data.fechaFinal ? new Date(data.fechaFinal) : null,
          idTaller: data.idTaller,
          costo: costoDisplay,
          encargado: data.encargado
        });
      });
  }


  initForm() {
    this.manVehicularForm = this.fb.group({
      idInstalacion: [null, Validators.required],
      idReferencia: [null, Validators.required],
      servicioDescripcion: ['', Validators.required],
      notaServicio: ['', Validators.required],
      idEstatus: [1],
      fechaInicio: [null, Validators.required],
      fechaFinal: [null, Validators.required],
      idTaller: [null, Validators.required],
      costo: [null, Validators.required],
      encargado: ['', Validators.required],
    });
  }

  private parseCosto(value: any): number {
    if (value == null) return 0;
    const raw = value.toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(raw);
    return isNaN(num) ? 0 : num;
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idManVehicular) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.manVehicularForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        idInstalacion: 'Instalación',
        idReferencia: 'Referencia',
        servicioDescripcion: 'Descripción del servicio',
        notaServicio: 'Nota del servicio',
        fechaInicio: 'Fecha inicio',
        fechaFinal: 'Fecha final',
        idTaller: 'Taller',
        costo: 'Costo',
        encargado: 'Encargado',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.manVehicularForm.controls).forEach((key) => {
        const control = this.manVehicularForm.get(key);
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

    // Debe existir archivo para notaServicio en alta
    if (!this.notaFile) {
      this.submitButton = 'Guardar';
      this.loading = false;
      this.manVehicularForm.get('notaServicio')?.setErrors({ required: true });
      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        background: '#002136',
        html: `
            <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
              Debes adjuntar la <strong>imagen de las notas del servicio</strong>.
            </p>
          `,
        icon: 'error',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const formValue = this.manVehicularForm.value;

    const fd = new FormData();
    fd.append('idInstalacion', String(Number(formValue.idInstalacion)));
    fd.append('idReferencia', String(Number(formValue.idReferencia)));
    fd.append('servicioDescripcion', formValue.servicioDescripcion);
    fd.append('notaServicio', this.notaFile, this.notaFile.name); // string($binary)
    fd.append('idEstatus', String(Number(formValue.idEstatus ?? 1)));
    fd.append('fechaInicio', this.formatearFechaSwagger(formValue.fechaInicio) || '');
    fd.append('fechaFinal', this.formatearFechaSwagger(formValue.fechaFinal) || '');
    fd.append('idTaller', String(Number(formValue.idTaller)));
    fd.append('costo', String(this.parseCosto(formValue.costo)));
    fd.append('encargado', formValue.encargado);

    this.manteVeh.agregarMatVehicular(fd).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: `Se agregó un nuevo registro de mantenimiento vehicular.`,
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

    if (this.manVehicularForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        idInstalacion: 'Instalación',
        idReferencia: 'Referencia',
        servicioDescripcion: 'Descripción del servicio',
        notaServicio: 'Nota del servicio',
        fechaInicio: 'Fecha inicio',
        fechaFinal: 'Fecha final',
        idTaller: 'Taller',
        costo: 'Costo',
        encargado: 'Encargado',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.manVehicularForm.controls).forEach((key) => {
        const control = this.manVehicularForm.get(key);
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

    const formValue = this.manVehicularForm.value;

    const payload = {
      idInstalacion: Number(formValue.idInstalacion),
      idReferencia: Number(formValue.idReferencia),
      servicioDescripcion: formValue.servicioDescripcion,
      notaServicio: formValue.notaServicio,
      idEstatus: Number(formValue.idEstatus ?? 1),
      fechaInicio: this.formatearFechaSwagger(formValue.fechaInicio),
      fechaFinal: this.formatearFechaSwagger(formValue.fechaFinal),
      idTaller: Number(formValue.idTaller),
      costo: this.parseCosto(formValue.costo),
      encargado: formValue.encargado,
    };

    this.manteVeh
      .actualizarMatVehicular(this.idManVehicular, payload)
      .subscribe(
        (response) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            background: '#002136',
            text: `Los datos del registro de mantenimiento vehicular se actualizaron de manera correcta.`,
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
    this.route.navigateByUrl('/mantenimientos');
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
      this.manVehicularForm.get('notaServicio')?.setErrors({ required: true });
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
    this.manVehicularForm.patchValue({ notaServicio: null });
    this.manVehicularForm.get('notaServicio')?.setErrors({ required: true });
  }

  private handleNotaFile(file: File) {
    if (!this.isAllowed(file)) {
      this.manVehicularForm.get('notaServicio')?.setErrors({ invalid: true });
      return;
    }
    this.loadPreview(file, (url) => (this.notaPreviewUrl = url));
    this.notaFile = file;
    this.manVehicularForm.patchValue({ notaServicio: file.name });
    this.manVehicularForm.get('notaServicio')?.setErrors(null);
  }

}
