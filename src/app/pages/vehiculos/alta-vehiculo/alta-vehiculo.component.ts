import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import { VehiculosService } from 'src/app/shared/services/vehiculos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-alta-vehiculo',
  templateUrl: './alta-vehiculo.component.html',
  styleUrl: './alta-vehiculo.component.scss',
  animations: [fadeInUpAnimation],
})
export class AltaVehiculoComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public vehiculosForm: FormGroup;
  public idVehiculo: number;
  public title = 'Agregar Vehículo';
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;
  public listaOperadores: any;
  listaDispositivos: any;
  public listaClientes: any;
  public anios: number[] = [];

  constructor(
    private route: Router,
    private fb: FormBuilder,
    private opService: OperadoresService,
    private vehiService: VehiculosService,
    private activatedRouted: ActivatedRoute,
    private disposService: DispositivosService,
    private usuaService: UsuariosService,
    private clieService: ClientesService
  ) {}

  ngOnInit(): void {
    const anioActual = new Date().getFullYear();
    const anioMinimo = 1980;
    for (let y = anioActual; y >= anioMinimo; y--) {
      this.anios.push(y);
    }
    this.obtenerOperadores();
    this.obtenerDispositivos();
    this.obtenerClientes()
    this.initForm();
    this.activatedRouted.params.subscribe((params) => {
      this.idVehiculo = params['idVehiculo'];
      if (this.idVehiculo) {
        this.title = 'Actualizar Vehículo';
        this.obtenerVehiculoID();
      }
    });
  }

  obtenerClientes(){
  this.clieService.obtenerClientes().subscribe((response) => {
    this.listaClientes = (response.data || []).map((c: any) => ({
      ...c,
      id: Number(c?.id ?? c?.Id ?? c?.ID),
    }));
  });
}


  obtenerDispositivos() {
    this.loading = true;
    this.disposService.obtenerDispositivos().subscribe(
      (res: any) => {
        setTimeout(() => {
          this.loading = false;
        }, 2000);
        if (Array.isArray(res.dispositivos)) {
          this.listaDispositivos = res.dispositivos.sort((a, b) => b.Id - a.Id);
        } else {
          console.error('El formato de datos recibido no es el esperado.');
        }
      },
      (error) => {
        this.loading = false;
        console.error('Error al obtener dispositivos:', error);
      }
    );
  }

  obtenerOperadores() {
    this.loading = true;
    this.opService.obtenerOperadores().subscribe(
      (res: any) => {
        setTimeout(() => {
          this.loading = false;
        }, 2000);
        this.listaOperadores = res.operadores
          .map((op) => ({
            ...op,
            FechaNacimiento: op.FechaNacimiento
              ? op.FechaNacimiento.split('T')[0]
              : '',
          }))
          .sort((a, b) => b.Id - a.Id);
      },
      (error) => {
        console.error('Error al obtener operadores:', error);
        this.loading = false;
      }
    );
  }

  obtenerVehiculoID() {
    this.vehiService
      .obtenerVehiculo(this.idVehiculo)
      .subscribe((response: any) => {
        this.vehiculosForm.patchValue({
          marca: response.data.marca,
          modelo: response.data.modelo,
          ano: response.data.ano,
          placa: response.data.placa,
          numeroEconomico: response.data.numeroEconomico,
          tarjetaCirculacion: response.data.tarjetaCirculacion,
          polizaSeguro: response.data.polizaSeguro,
          permisoConcesion: response.data.permisoConcesion,
          inspeccionMecanica: response.data.inspeccionMecanica,
          foto: response.data.foto,
          estatus: response.data.estatus,
          idCliente: Number(response.data.idCliente),
          // IdOperador: response.data.idOperador,
          // IdDispositivo: response.data.idDispositivo,
        });
      });
  }

  initForm() {
    this.vehiculosForm = this.fb.group({
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      ano: [null, Validators.required],
      placa: ['', Validators.required],
      numeroEconomico: ['', Validators.required],
      tarjetaCirculacion: ['', Validators.required],
      polizaSeguro: ['', Validators.required],
      permisoConcesion: ['', Validators.required],
      inspeccionMecanica: ['', Validators.required],
      foto: ['', Validators.required],
      estatus: [1, Validators.required],
      idCliente: [null, Validators.required],
      // idOperador: ['', Validators.required],
      // idDispositivo: ['', Validators.required],
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idVehiculo) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.vehiculosForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        Marca: 'Marca',
        Modelo: 'Modelo',
        Ano: 'Año',
        Placa: 'Placa',
        NumeroEconomico: 'Número Económico',
        IdOperador: 'Operador',
        idVehiculo: 'Dispositivo',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.vehiculosForm.controls).forEach((key) => {
        const control = this.vehiculosForm.get(key);
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
        background: '#22252f',
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
    this.vehiculosForm.removeControl('id');
    this.vehiService.agregarVehiculo(this.vehiculosForm.value).subscribe(
      (response) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#22252f',
          text: `Se agregó un nuevo vehículo de manera exitosa.`,
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
          background: '#22252f',
          text: `Ocurrió un error al agregar el vehículo.`,
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
    if (this.vehiculosForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        Marca: 'Marca',
        Modelo: 'Modelo',
        Ano: 'Año',
        Placa: 'Placa',
        NumeroEconomico: 'Número Económico',
        IdOperador: 'Operador',
        idVehiculo: 'Dispositivo',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.vehiculosForm.controls).forEach((key) => {
        const control = this.vehiculosForm.get(key);
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
        background: '#22252f',
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
    }
    this.vehiService
      .actualizarVehiculo(this.idVehiculo, this.vehiculosForm.value)
      .subscribe(
        (response) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Operación Exitosa!',
            background: '#22252f',
            text: `Los datos del vehículo se actualizaron correctamente.`,
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
          this.regresar();
        },
        (error) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            title: '¡Ops!',
            background: '#22252f',
            text: `Ocurrió un error al actualizar el vehículo.`,
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        }
      );
  }

  regresar() {
    this.route.navigateByUrl('/vehiculos');
  }

  @ViewChild('tcFileInput') tcFileInput!: ElementRef<HTMLInputElement>;
@ViewChild('polizaFileInput') polizaFileInput!: ElementRef<HTMLInputElement>;
@ViewChild('permisoFileInput') permisoFileInput!: ElementRef<HTMLInputElement>;
@ViewChild('inspeccionFileInput') inspeccionFileInput!: ElementRef<HTMLInputElement>;

tcDragging = false;        polizaDragging = false;        permisoDragging = false;        inspeccionDragging = false;
tcFileName: string | null = null; polizaFileName: string | null = null; permisoFileName: string | null = null; inspeccionFileName: string | null = null;
tcPreviewUrl: null = null; polizaPreviewUrl: null = null; permisoPreviewUrl: null = null; inspeccionPreviewUrl: null = null; // PDFs: sin preview
private readonly MAX_MB = 3;
uploadingTc = false; uploadingPoliza = false; uploadingPermiso = false; uploadingInspeccion = false;

private extractFileUrl(res: any): string {
  return res?.url ?? res?.Location ?? res?.data?.url ?? res?.data?.Location ?? res?.key ?? res?.Key ?? res?.path ?? res?.filePath ?? '';
}

private isAllowed(file: File) {
    const okImg = this.isImage(file);
    const okDoc = /(pdf|msword|officedocument|excel)/i.test(file.type);
    return (okImg || okDoc) && file.size <= this.MAX_MB * 1024 * 1024;
  }
  
    private isImage(file: File) {
    return /^image\/(png|jpe?g|webp)$/i.test(file.type);
  }

// tarjeta circulación
openTcFilePicker() { this.tcFileInput.nativeElement.click(); }
onTcDragOver(e: DragEvent) { e.preventDefault(); this.tcDragging = true; }
onTcDragLeave(_e: DragEvent) { this.tcDragging = false; }
onTcDrop(e: DragEvent) { e.preventDefault(); this.tcDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handleTcFile(f); }
onTcFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handleTcFile(f); }
clearTcFile(e: Event) {
  e.stopPropagation();
  this.tcPreviewUrl = null;
  this.tcFileName = null;
  this.tcFileInput.nativeElement.value = '';
  this.vehiculosForm.patchValue({ tarjetaCirculacion: null });
  this.vehiculosForm.get('tarjetaCirculacion')?.setErrors({ required: true });
}
private handleTcFile(file: File) {
  if (!this.isAllowed(file)) { this.vehiculosForm.get('tarjetaCirculacion')?.setErrors({ invalid: true }); return; }
  this.tcFileName = file.name;
  this.vehiculosForm.patchValue({ tarjetaCirculacion: file });
  this.vehiculosForm.get('tarjetaCirculacion')?.setErrors(null);
  this.uploadTarjeta(file);
}
private uploadTarjeta(file: File): void {
  if (this.uploadingTc) return;
  this.uploadingTc = true;
  const fd = new FormData();
  fd.append('file', file, file.name);
  fd.append('folder', 'vehiculos');
  fd.append('idModule', '10');
  this.usuaService.uploadFile(fd).subscribe({
    next: (res: any) => {
      const url = this.extractFileUrl(res);
      if (url) {
        this.vehiculosForm.patchValue({ tarjetaCirculacion: url });
        this.tcPreviewUrl = null;
        this.tcFileName = file.name;
      }
    },
    error: (err) => console.error('[UPLOAD][tarjetaCirculacion]', err),
    complete: () => (this.uploadingTc = false),
  });
}


// póliza seguro
openPolizaFilePicker() { this.polizaFileInput.nativeElement.click(); }
onPolizaDragOver(e: DragEvent) { e.preventDefault(); this.polizaDragging = true; }
onPolizaDragLeave(_e: DragEvent) { this.polizaDragging = false; }
onPolizaDrop(e: DragEvent) { e.preventDefault(); this.polizaDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handlePolizaFile(f); }
onPolizaFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handlePolizaFile(f); }
clearPolizaFile(e: Event) {
  e.stopPropagation();
  this.polizaPreviewUrl = null;
  this.polizaFileName = null;
  this.polizaFileInput.nativeElement.value = '';
  this.vehiculosForm.patchValue({ polizaSeguro: null });
  this.vehiculosForm.get('polizaSeguro')?.setErrors({ required: true });
}
private handlePolizaFile(file: File) {
  if (!this.isAllowed(file)) { this.vehiculosForm.get('polizaSeguro')?.setErrors({ invalid: true }); return; }
  this.polizaFileName = file.name;
  this.vehiculosForm.patchValue({ polizaSeguro: file });
  this.vehiculosForm.get('polizaSeguro')?.setErrors(null);
  this.uploadPoliza(file);
}
private uploadPoliza(file: File): void {
  if (this.uploadingPoliza) return;
  this.uploadingPoliza = true;
  const fd = new FormData();
  fd.append('file', file, file.name);
  fd.append('folder', 'vehiculos');
  fd.append('idModule', '10');
  this.usuaService.uploadFile(fd).subscribe({
    next: (res: any) => {
      const url = this.extractFileUrl(res);
      if (url) {
        this.vehiculosForm.patchValue({ polizaSeguro: url });
        this.polizaPreviewUrl = null;
        this.polizaFileName = file.name;
      }
    },
    error: (err) => console.error('[UPLOAD][polizaSeguro]', err),
    complete: () => (this.uploadingPoliza = false),
  });
}


// permiso concesión
openPermisoFilePicker() { this.permisoFileInput.nativeElement.click(); }
onPermisoDragOver(e: DragEvent) { e.preventDefault(); this.permisoDragging = true; }
onPermisoDragLeave(_e: DragEvent) { this.permisoDragging = false; }
onPermisoDrop(e: DragEvent) { e.preventDefault(); this.permisoDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handlePermisoFile(f); }
onPermisoFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handlePermisoFile(f); }
clearPermisoFile(e: Event) {
  e.stopPropagation();
  this.permisoPreviewUrl = null;
  this.permisoFileName = null;
  this.permisoFileInput.nativeElement.value = '';
  this.vehiculosForm.patchValue({ permisoConcesion: null });
  this.vehiculosForm.get('permisoConcesion')?.setErrors({ required: true });
}
private handlePermisoFile(file: File) {
  if (!this.isAllowed(file)) { this.vehiculosForm.get('permisoConcesion')?.setErrors({ invalid: true }); return; }
  this.permisoFileName = file.name;
  this.vehiculosForm.patchValue({ permisoConcesion: file });
  this.vehiculosForm.get('permisoConcesion')?.setErrors(null);
  this.uploadPermiso(file);
}
private uploadPermiso(file: File): void {
  if (this.uploadingPermiso) return;
  this.uploadingPermiso = true;
  const fd = new FormData();
  fd.append('file', file, file.name);
  fd.append('folder', 'vehiculos');
  fd.append('idModule', '10');
  this.usuaService.uploadFile(fd).subscribe({
    next: (res: any) => {
      const url = this.extractFileUrl(res);
      if (url) {
        this.vehiculosForm.patchValue({ permisoConcesion: url });
        this.permisoPreviewUrl = null;
        this.permisoFileName = file.name;
      }
    },
    error: (err) => console.error('[UPLOAD][permisoConcesion]', err),
    complete: () => (this.uploadingPermiso = false),
  });
}


// inspección mecánica
openInspeccionFilePicker() { this.inspeccionFileInput.nativeElement.click(); }
onInspeccionDragOver(e: DragEvent) { e.preventDefault(); this.inspeccionDragging = true; }
onInspeccionDragLeave(_e: DragEvent) { this.inspeccionDragging = false; }
onInspeccionDrop(e: DragEvent) { e.preventDefault(); this.inspeccionDragging = false; const f = e.dataTransfer?.files?.[0]; if (f) this.handleInspeccionFile(f); }
onInspeccionFileSelected(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.handleInspeccionFile(f); }
clearInspeccionFile(e: Event) {
  e.stopPropagation();
  this.inspeccionPreviewUrl = null;
  this.inspeccionFileName = null;
  this.inspeccionFileInput.nativeElement.value = '';
  this.vehiculosForm.patchValue({ inspeccionMecanica: null });
  this.vehiculosForm.get('inspeccionMecanica')?.setErrors({ required: true });
}
private handleInspeccionFile(file: File) {
  if (!this.isAllowed(file)) { this.vehiculosForm.get('inspeccionMecanica')?.setErrors({ invalid: true }); return; }
  this.inspeccionFileName = file.name;
  this.vehiculosForm.patchValue({ inspeccionMecanica: file });
  this.vehiculosForm.get('inspeccionMecanica')?.setErrors(null);
  this.uploadInspeccion(file);
}
private uploadInspeccion(file: File): void {
  if (this.uploadingInspeccion) return;
  this.uploadingInspeccion = true;
  const fd = new FormData();
  fd.append('file', file, file.name);
  fd.append('folder', 'vehiculos');
  fd.append('idModule', '10');
  this.usuaService.uploadFile(fd).subscribe({
    next: (res: any) => {
      const url = this.extractFileUrl(res);
      if (url) {
        this.vehiculosForm.patchValue({ inspeccionMecanica: url });
        this.inspeccionPreviewUrl = null;
        this.inspeccionFileName = file.name;
      }
    },
    error: (err) => console.error('[UPLOAD][inspeccionMecanica]', err),
    complete: () => (this.uploadingInspeccion = false),
  });
}

// === ViewChild y estado ===
@ViewChild('fotoFileInput') fotoFileInput!: ElementRef<HTMLInputElement>;

fotoPreviewUrl: string | ArrayBuffer | null = null;
fotoFileName: string | null = null;
fotoDragging = false;
uploadingFoto = false;

// Si ya tienes MAX_MB definido, reutilízalo; si no, define uno:
// private readonly MAX_MB = 3;

// === Validación solo IMAGEN ===

private isAllowedImage(file: File) {
  return this.isImage(file) && file.size <= this.MAX_MB * 1024 * 1024;
}

// === Preview con FileReader ===
private loadImagePreview(file: File, setter: (url: string | ArrayBuffer | null) => void) {
  if (!this.isImage(file)) { setter(null); return; }
  const reader = new FileReader();
  reader.onload = () => setter(reader.result);
  reader.readAsDataURL(file);
}

// === Handlers de UI (foto) ===
openFotoFilePicker() { this.fotoFileInput.nativeElement.click(); }

onFotoDragOver(e: DragEvent) { e.preventDefault(); this.fotoDragging = true; }
onFotoDragLeave(_e: DragEvent) { this.fotoDragging = false; }
onFotoDrop(e: DragEvent) {
  e.preventDefault();
  this.fotoDragging = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) this.handleFotoFile(f);
}

onFotoFileSelected(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) this.handleFotoFile(f);
}

clearFotoFile(e: Event) {
  e.stopPropagation();
  this.fotoPreviewUrl = null;
  this.fotoFileName = null;
  this.fotoFileInput.nativeElement.value = '';
  this.vehiculosForm.patchValue({ foto: null });
  this.vehiculosForm.get('foto')?.setErrors({ required: true });
}

// === Handler principal ===
private handleFotoFile(file: File) {
  if (!this.isAllowedImage(file)) {
    this.vehiculosForm.get('foto')?.setErrors({ invalid: true });
    return;
  }

  this.fotoFileName = file.name;
  this.loadImagePreview(file, (url) => this.fotoPreviewUrl = url);

  // Primero colocamos el File mientras sube
  this.vehiculosForm.patchValue({ foto: file });
  this.vehiculosForm.get('foto')?.setErrors(null);

  // Subir al backend y reemplazar por URL final
  this.uploadFoto(file);
}

// === Subida (mismo servicio), folder 'vehiculos', idModule '10' ===
private uploadFoto(file: File): void {
  if (this.uploadingFoto) return;
  this.uploadingFoto = true;

  const fd = new FormData();
  fd.append('file', file, file.name);
  fd.append('folder', 'vehiculos');
  fd.append('idModule', '10');

  this.usuaService.uploadFile(fd).subscribe({
    next: (res: any) => {
      const url = this.extractFileUrl(res);
      if (url) {
        // Reemplaza el File por la URL en el form
        this.vehiculosForm.patchValue({ foto: url });
        // Mantenemos el preview con la imagen ya cargada
        this.fotoPreviewUrl = this.fotoPreviewUrl; // ya seteada por FileReader
        this.fotoFileName = file.name;
      }
    },
    error: (err) => {
      console.error('[UPLOAD][foto]', err);
      // Si quieres, puedes dejar el File o limpiar:
      // this.vehiculosForm.patchValue({ foto: null });
      // this.fotoPreviewUrl = null;
      // this.fotoFileName = null;
      // this.vehiculosForm.get('foto')?.setErrors({ uploadFailed: true });
    },
    complete: () => { this.uploadingFoto = false; },
  });
}




}
