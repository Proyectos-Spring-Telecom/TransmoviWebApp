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

type VehiculoPayload = {
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  numeroEconomico: string;
  tarjetaCirculacion: string;
  polizaSeguro: string;
  permisoConcesion: string;
  inspeccionMecanica: string;
  foto: string;
  pasajerosSentados: number;
  pasajerosParados: number;
  estatus: number;
  idCliente: number;
  km: number;
  idCombustible: number;
  capacidadLitros: number;
};

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
  displayCliente = (c: any) => c ? `${c.nombre} ${c.apellidoPaterno ?? ''}`.trim() : '';

  constructor(
    private route: Router,
    private fb: FormBuilder,
    private opService: OperadoresService,
    private vehiService: VehiculosService,
    private activatedRouted: ActivatedRoute,
    private disposService: DispositivosService,
    private usuaService: UsuariosService,
    private clieService: ClientesService
  ) { }

  ngOnInit(): void {
    const anioActual = new Date().getFullYear();
    const anioMinimo = 1980;
    for (let y = anioActual; y >= anioMinimo; y--) {
      this.anios.push(y);
    }
    this.obtenerOperadores();
    this.obtenerClientes()
    this.initForm();
    this.obtenerTipoCombustible()
    this.activatedRouted.params.subscribe((params) => {
      this.idVehiculo = params['idVehiculo'];
      if (this.idVehiculo) {
        this.title = 'Actualizar Vehículo';
        this.obtenerVehiculoID();
      }
    });
  }

  obtenerClientes() {
    this.clieService.obtenerClientes().subscribe((response) => {
      this.listaClientes = (response.data || []).map((c: any) => ({
        ...c,
        id: Number(c?.id ?? c?.Id ?? c?.ID),
      }));
    });
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

  // propiedades
  listaCombustibles: Array<{ id: number; nombre: string }> = [];
  private combustibleNombreTmp: string | null = null;

  // util
  private findCombustibleIdByName(n: string | null): number | null {
    if (!n) return null;
    const hit = this.listaCombustibles.find(c => c.nombre?.toString().trim().localeCompare(n.toString().trim(), undefined, { sensitivity: 'base' }) === 0);
    return hit ? Number(hit.id) : null;
  }

  obtenerTipoCombustible() {
    this.vehiService.obtenerCombustibles().subscribe((response) => {
      this.listaCombustibles = (response?.data || []).map((c: any) => ({
        id: Number(c?.id ?? c?.Id ?? c?.ID),
        nombre: c?.nombre ?? c?.Nombre ?? ''
      }));

      if (!this.vehiculosForm?.get('idCombustible')?.value) {
        const mapped = this.findCombustibleIdByName(this.combustibleNombreTmp);
        if (mapped != null) this.vehiculosForm.patchValue({ idCombustible: mapped });
      }
    });
  }

  obtenerVehiculoID() {
    this.vehiService.obtenerVehiculo(this.idVehiculo).subscribe((response: any) => {
      const raw = Array.isArray(response?.data)
        ? response.data[0]
        : response?.vehiculo ?? response?.data ?? response ?? {};

      const get = (o: any, keys: string[]) => {
        for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
        return null;
      };

      const marca = get(raw, ['marca', 'Marca']);
      const modelo = get(raw, ['modelo', 'Modelo']);
      const ano = get(raw, ['ano', 'año', 'Ano', 'Año']);
      const placa = get(raw, ['placa', 'Placa']);
      const numeroEconomico = get(raw, ['numeroEconomico', 'NumeroEconomico']);
      const tarjetaCirculacion = get(raw, ['tarjetaCirculacion', 'TarjetaCirculacion']);
      const polizaSeguro = get(raw, ['polizaSeguro', 'PolizaSeguro']);
      const permisoConcesion = get(raw, ['permisoConcesion', 'PermisoConcesion']);
      const inspeccionMecanica = get(raw, ['inspeccionMecanica', 'InspeccionMecanica']);
      const foto = get(raw, ['foto', 'Foto']);
      const est = get(raw, ['estatus', 'Estatus']);
      const idCli = get(raw, ['idCliente', 'idcliente', 'IdCliente', 'IDCliente']);

      const pasajerosSentados = get(raw, ['pasajerosSentados', 'PasajerosSentados']);
      const pasajerosParados = get(raw, ['pasajerosParados', 'PasajerosParados']);
      const km = get(raw, ['km', 'KM', 'Km']);
      const idCombustible = get(raw, ['idCombustible', 'IdCombustible', 'idcombustible']);
      const capacidadLitros = get(raw, ['capacidadLitros', 'CapacidadLitros']);
      const combustibleNombre = get(raw, ['nombre', 'Nombre', 'tipoCombustible', 'TipoCombustible']);

      this.vehiculosForm.patchValue({
        marca: marca ?? '',
        modelo: modelo ?? '',
        ano: ano ?? '',
        placa: placa ?? '',
        numeroEconomico: numeroEconomico ?? '',
        tarjetaCirculacion: tarjetaCirculacion ?? '',
        polizaSeguro: polizaSeguro ?? '',
        permisoConcesion: permisoConcesion ?? '',
        inspeccionMecanica: inspeccionMecanica ?? '',
        foto: foto ?? '',
        pasajerosSentados: pasajerosSentados != null ? Number(pasajerosSentados) : null,
        pasajerosParados: pasajerosParados != null ? Number(pasajerosParados) : null,
        km: km != null ? Number(km) : null,
        idCombustible: idCombustible != null ? Number(idCombustible) : null,
        capacidadLitros: capacidadLitros != null ? Number(capacidadLitros) : null,
        estatus: est != null && !Number.isNaN(Number(est)) ? Number(est) : 1,
        idCliente: idCli != null && idCli !== '' ? Number(idCli) : null,
      });

      if (!idCombustible) {
        this.combustibleNombreTmp = combustibleNombre ?? null;
        const mapped = this.findCombustibleIdByName(this.combustibleNombreTmp);
        if (mapped != null) this.vehiculosForm.patchValue({ idCombustible: mapped });
      }
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
      pasajerosSentados: [null, Validators.required],
      pasajerosParados: [null, Validators.required],
      km: [null, Validators.required],
      idCombustible: [null, Validators.required],
      capacidadLitros: [null, Validators.required],
      estatus: [1, Validators.required],
      idCliente: [null, Validators.required],
    });
  }

  allowOnlyNumbersCombustible(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;
    const key = e.key;
    const editKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    if (editKeys.includes(key)) return;
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(key.toLowerCase())) return;
    if (key === '.') {
      if (input.value.includes('.')) e.preventDefault();
      return;
    }
    if (!/^\d$/.test(key)) e.preventDefault();
  }

  onPasteDecimal(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text') ?? '';
    if (!/^\d*\.?\d*$/.test(text)) e.preventDefault();
  }

  sanitizeDecimal(e: Event) {
    const input = e.target as HTMLInputElement;
    let v = (input.value || '').replace(/[^\d.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
    }
    input.value = v;
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


  private normalizeNumber(v: any): number {
    // Soporta string con decimales; si viene vacío, regresa NaN (Angular marcará invalidez si es requerido)
    return typeof v === 'number' ? v : Number(String(v ?? '').toString().replace(/,/g, ''));
  }

  private buildPayloadFromForm(): VehiculoPayload {
    const raw = this.vehiculosForm.getRawValue();

    return {
      marca: (raw.marca ?? '').trim(),
      modelo: (raw.modelo ?? '').trim(),
      ano: this.normalizeNumber(raw.ano),
      placa: (raw.placa ?? '').trim(),
      numeroEconomico: (raw.numeroEconomico ?? '').trim(),
      tarjetaCirculacion: (raw.tarjetaCirculacion ?? '').trim(),
      polizaSeguro: (raw.polizaSeguro ?? '').trim(),
      permisoConcesion: (raw.permisoConcesion ?? '').trim(),
      inspeccionMecanica: (raw.inspeccionMecanica ?? '').trim(),
      foto: (raw.foto ?? '').trim(),
      pasajerosSentados: Math.trunc(this.normalizeNumber(raw.pasajerosSentados)),
      pasajerosParados: Math.trunc(this.normalizeNumber(raw.pasajerosParados)),
      estatus: Math.trunc(this.normalizeNumber(raw.estatus ?? 1)) || 1,
      idCliente: Math.trunc(this.normalizeNumber(raw.idCliente)),
      km: this.normalizeNumber(raw.km),
      idCombustible: Math.trunc(this.normalizeNumber(raw.idCombustible)),
      capacidadLitros: this.normalizeNumber(raw.capacidadLitros),
    };
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    if (this.vehiculosForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;

      const etiquetas: any = {
        marca: 'Marca',
        modelo: 'Modelo',
        ano: 'Año',
        placa: 'Placa',
        numeroEconomico: 'Número Económico',
        tarjetaCirculacion: 'Tarjeta de Circulación',
        polizaSeguro: 'Póliza de Seguro',
        permisoConcesion: 'Permiso de Concesión',
        inspeccionMecanica: 'Inspección Mecánica',
        foto: 'Foto del Vehículo',
        pasajerosSentados: 'Pasajeros sentados',
        pasajerosParados: 'Pasajeros parados',
        estatus: 'Estatus',
        idCliente: 'Cliente',
        km: 'Kilometraje',
        idCombustible: 'Tipo de combustible',
        capacidadLitros: 'Capacidad de combustible (L)',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.vehiculosForm.controls).forEach((key) => {
        const control = this.vehiculosForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, i) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${i + 1}. ${campo}</strong>
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
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    this.vehiculosForm.removeControl('id');
    const raw = this.vehiculosForm.getRawValue();
    const payload = {
      marca: (raw.marca ?? '').trim(),
      modelo: (raw.modelo ?? '').trim(),
      ano: Number(raw.ano),
      placa: (raw.placa ?? '').trim(),
      numeroEconomico: (raw.numeroEconomico ?? '').trim(),
      tarjetaCirculacion: (raw.tarjetaCirculacion ?? '').trim(),
      polizaSeguro: (raw.polizaSeguro ?? '').trim(),
      permisoConcesion: (raw.permisoConcesion ?? '').trim(),
      inspeccionMecanica: (raw.inspeccionMecanica ?? '').trim(),
      foto: (raw.foto ?? '').trim(),
      pasajerosSentados: parseInt(raw.pasajerosSentados, 10),
      pasajerosParados: parseInt(raw.pasajerosParados, 10),
      estatus: parseInt(raw.estatus ?? 1, 10),
      idCliente: parseInt(raw.idCliente, 10),
      km: Number(raw.km),
      idCombustible: parseInt(raw.idCombustible, 10),
      capacidadLitros: Number(raw.capacidadLitros),
    };

    this.vehiService.agregarVehiculo(payload).subscribe(
      () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: 'Se agregó un nuevo vehículo de manera exitosa.',
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
          text: 'Ocurrió un error al agregar el vehículo.',
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
      this.submitButton = 'Actualizar';
      this.loading = false;

      const etiquetas: any = {
        marca: 'Marca',
        modelo: 'Modelo',
        ano: 'Año',
        placa: 'Placa',
        numeroEconomico: 'Número Económico',
        tarjetaCirculacion: 'Tarjeta de Circulación',
        polizaSeguro: 'Póliza de Seguro',
        permisoConcesion: 'Permiso de Concesión',
        inspeccionMecanica: 'Inspección Mecánica',
        foto: 'Foto del Vehículo',
        pasajerosSentados: 'Pasajeros sentados',
        pasajerosParados: 'Pasajeros parados',
        estatus: 'Estatus',
        idCliente: 'Cliente',
        km: 'Kilometraje',
        idCombustible: 'Tipo de combustible',
        capacidadLitros: 'Capacidad de combustible (L)',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.vehiculosForm.controls).forEach((key) => {
        const control = this.vehiculosForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes.map((campo, i) => `
      <div style="padding:8px 12px;border-left:4px solid #d9534f;background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
        <strong style="color:#b02a37;">${i + 1}. ${campo}</strong>
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
        customClass: { popup: 'swal2-padding swal2-border' },
      });
      return;
    }

    const raw = this.vehiculosForm.getRawValue();
    const payload = {
      marca: (raw.marca ?? '').trim(),
      modelo: (raw.modelo ?? '').trim(),
      ano: Number(raw.ano),
      placa: (raw.placa ?? '').trim(),
      numeroEconomico: (raw.numeroEconomico ?? '').trim(),
      tarjetaCirculacion: (raw.tarjetaCirculacion ?? '').trim(),
      polizaSeguro: (raw.polizaSeguro ?? '').trim(),
      permisoConcesion: (raw.permisoConcesion ?? '').trim(),
      inspeccionMecanica: (raw.inspeccionMecanica ?? '').trim(),
      foto: (raw.foto ?? '').trim(),
      pasajerosSentados: parseInt(raw.pasajerosSentados, 10),
      pasajerosParados: parseInt(raw.pasajerosParados, 10),
      estatus: parseInt(raw.estatus ?? 1, 10),
      idCliente: parseInt(raw.idCliente, 10),
      km: Number(raw.km),
      idCombustible: parseInt(raw.idCombustible, 10),
      capacidadLitros: Number(raw.capacidadLitros),
    };

    this.vehiService.actualizarVehiculo(this.idVehiculo, payload).subscribe(
      () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          background: '#002136',
          text: 'Los datos del vehículo se actualizaron correctamente.',
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
          text: 'Ocurrió un error al actualizar el vehículo.',
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

  tcDragging = false; polizaDragging = false; permisoDragging = false; inspeccionDragging = false;
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

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  private isAllowedImage(file: File) {
    return this.isImage(file) && file.size <= this.MAX_MB * 1024 * 1024;
  }

  private loadImagePreview(file: File, setter: (url: string | ArrayBuffer | null) => void) {
    if (!this.isImage(file)) { setter(null); return; }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.readAsDataURL(file);
  }

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

  private handleFotoFile(file: File) {
    if (!this.isAllowedImage(file)) {
      this.vehiculosForm.get('foto')?.setErrors({ invalid: true });
      return;
    }
    this.fotoFileName = file.name;
    this.loadImagePreview(file, (url) => this.fotoPreviewUrl = url);
    this.vehiculosForm.patchValue({ foto: file });
    this.vehiculosForm.get('foto')?.setErrors(null);
    this.uploadFoto(file);
  }

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
          this.vehiculosForm.patchValue({ foto: url });
          this.fotoPreviewUrl = this.fotoPreviewUrl;
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