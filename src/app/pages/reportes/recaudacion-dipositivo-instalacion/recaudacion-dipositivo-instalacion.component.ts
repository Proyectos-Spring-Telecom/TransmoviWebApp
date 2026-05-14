import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DxDataGridComponent } from 'devextreme-angular';
import { ReportesService, RecaudacionDispositivoRequest } from '../reportes.service';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import { InstalacionesService } from 'src/app/shared/services/instalaciones.service';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

@Component({
  selector: 'app-recaudacion-dipositivo-instalacion',
  templateUrl: './recaudacion-dipositivo-instalacion.component.html',
  styleUrl: './recaudacion-dipositivo-instalacion.component.scss',
  animations: [fadeInUpAnimation]
})
export class RecaudacionDipositivoInstalacionComponent implements OnInit {

  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public informacion: any[] = [];
  public showFilterRow: boolean = false;
  public showHeaderFilter: boolean = false;
  public loading: boolean = false;
  public loadingMessage: string = 'Cargando...';
  public showExportGrid: boolean = false;
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  public filtroForm: FormGroup;

  public clientesOptions: any[] = [];
  public dispositivosOptions: any[] = [];
  public instalacionesOptions: any[] = [];

  public clienteValueExpr: string = 'id';
  public dispositivoValueExpr: string = 'id';
  public instalacionValueExpr: string = 'id';

  public clienteDisplayExpr = (c: any) =>
    c
      ? c.razonSocial ??
        c.nombre ??
        c.nombreCliente ??
        c.nombreComercial ??
        c.descripcion ??
        c.name ??
        ''
      : '';

  public dispositivoDisplayExpr = (d: any) =>
    d
      ? d.numeroSerie ??
        d.serie ??
        d.serieDispositivo ??
        d.nombre ??
        d.descripcion ??
        ''
      : '';

  public instalacionDisplayExpr = (i: any) => {
    if (!i) {
      return '';
    }
    const placa = i.placaVehiculo ?? i.placa ?? '';
    if (placa) {
      return `Placa: ${placa}`;
    }
    return i.nombre ?? i.descripcion ?? i.codigo ?? '';
  };
  public dispositivoDisabled: boolean = true;

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
    private clientesService: ClientesService,
    private dispositivosService: DispositivosService,
    private instalacionesService: InstalacionesService
  ) {
    this.filtroForm = this.fb.group({
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date(), Validators.required],
      idCliente: [null],
      idDispositivo: [{value: null, disabled: true}],
      idInstalacion: [null],
    });
    this.getCambioCliente();
  }

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarInstalaciones();
  }

  aplicarFiltros(): void {
    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      return;
    }

    const payload = this.construirPayload();
    this.loading = true;
    this.reportesService.obtenerRecaudacionPorDispositivo(payload).subscribe({
      next: (data) => {
        const respuesta = Array.isArray(data) ? data : (data?.data ?? data ?? []);
        this.informacion = this.mapearRespuesta(respuesta);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al obtener recaudación por dispositivo', error);
        this.informacion = [];
        this.loading = false;
      },
    });
  }

  private getCambioCliente(): void {
    this.filtroForm.get('idCliente')?.valueChanges.subscribe((idCliente) => {
      if (idCliente) {
        this.dispositivoDisabled = true;
        this.filtroForm.get('idDispositivo')?.disable();
        this.cargarDispositivosByCliente(Number(idCliente));
      } else {
        this.dispositivosOptions = [];
        this.filtroForm.patchValue({ idDispositivo: null }, { emitEvent: false });
        this.dispositivoDisabled = true;
        this.filtroForm.get('idDispositivo')?.disable();
      }
    });
  }

  private cargarDispositivosByCliente(idCliente: number): void {
    this.dispositivosService.obtenerDispositivosByCliente(idCliente).subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.dispositivosOptions = Array.isArray(raw) ? raw.map((d: any) => ({
          ...d,
          id: Number(d?.id ?? d?.Id ?? d?.idDispositivo ?? d?.ID),
          numeroSerie: d?.numeroSerie ?? d?.serie ?? d?.serieDispositivo ?? '',
        })) : [];
        this.dispositivoDisabled = this.dispositivosOptions.length === 0;
        if (this.dispositivosOptions.length > 0) {
          this.filtroForm.get('idDispositivo')?.enable();
        } else {
          this.filtroForm.get('idDispositivo')?.disable();
        }
      },
      error: (error) => {
        console.error('Error al cargar dispositivos por cliente', error);
        this.dispositivosOptions = [];
        this.dispositivoDisabled = true;
        this.filtroForm.get('idDispositivo')?.disable();
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      fechaInicio: new Date(),
      fechaFin: new Date(),
      idCliente: null,
      idDispositivo: null,
      idInstalacion: null,
    });
    this.dispositivosOptions = [];
    this.dispositivoDisabled = true;
    this.filtroForm.get('idDispositivo')?.disable();
    this.informacion = [];
  }

  private construirPayload(): RecaudacionDispositivoRequest {
    const raw = this.filtroForm.value;
    return {
      fechaInicio: this.formatearFecha(raw.fechaInicio),
      fechaFin: this.formatearFecha(raw.fechaFin),
      idCliente: raw.idCliente ? Number(raw.idCliente) : null,
      idDispositivo: raw.idDispositivo ? Number(raw.idDispositivo) : null,
      idInstalacion: raw.idInstalacion ? Number(raw.idInstalacion) : null,
    };
  }

  private formatearFecha(valor: Date | string | null): string {
    if (!valor) {
      return '';
    }

    if (typeof valor === 'string') {
      return valor;
    }

    const year = valor.getFullYear();
    const month = `${valor.getMonth() + 1}`.padStart(2, '0');
    const day = `${valor.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private mapearRespuesta(data: any[]): any[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item, index) => {
      const v = item?.vehiculo;
      const vehiculoEsObjeto = v != null && typeof v === 'object' && !Array.isArray(v);
      const placa = vehiculoEsObjeto
        ? (v.placa ?? '')
        : typeof v === 'string'
          ? v
          : (item?.placa ?? '');
      const economico = vehiculoEsObjeto ? (v.numeroEconomico ?? '') : (item?.numeroEconomico ?? '');

      const blueVoxs = Array.isArray(item?.blueVoxs) ? item.blueVoxs : [];

      const tieneViaje = item?.inicioViaje != null && item.inicioViaje !== '';

      return {
        id: item?.id ?? this.generarIdTemporal(item, index),
        inicioViaje: tieneViaje
          ? this.formatearFechaHoraCampo(item.inicioViaje)
          : item?.ultimaPosicion
            ? this.formatearDateLocal(new Date(item.ultimaPosicion))
            : '—',
        finViaje:
          item?.finViaje != null && item.finViaje !== ''
            ? this.formatearFechaHoraCampo(item.finViaje)
            : tieneViaje
              ? 'En curso'
              : '—',
        vehiculoPlaca: placa || '—',
        vehiculoEconomico: economico || '—',
        totalAscensos: item?.totalAscensos ?? 0,
        totalBoletos: item?.totalBoletos ?? 0,
        diferenciaAscensoBoleto: item?.diferenciaAscensoBoleto ?? 0,
        blueVoxs,
        blueVoxsCount: blueVoxs.length,
        serieDispositivo: item?.serieDispositivo ?? item?.serie ?? '—',
        serieBluevox:
          this.resumirSeriesBlueVox(blueVoxs) ||
          (item?.serieBlueVox ?? item?.serieBluevox ?? '—'),
        validaciones: item?.validaciones ?? 0,
        ingresos: item?.ingresos ?? 0,
        ultimaPosicion: item?.ultimaPosicion
          ? this.formatearDateLocal(new Date(item.ultimaPosicion))
          : '—',
        estado: item?.estadoDispositivo ?? item?.estado ?? '—',
      };
    });
  }

  /** Opciones Intl compatibles con lib "es2018" (sin dateStyle/timeStyle). */
  private static readonly opcionesFechaHora: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };

  private formatearDateLocal(d: Date): string {
    return d.toLocaleString('es-MX', RecaudacionDipositivoInstalacionComponent.opcionesFechaHora);
  }

  /** Usado en plantilla de detalle (conteos / fechas API). */
  formatearFechaHoraCampo(valor: string | Date | null | undefined): string {
    if (valor == null || valor === '') {
      return '—';
    }
    if (valor instanceof Date) {
      return this.formatearDateLocal(valor);
    }
    const s = String(valor).trim();
    const normalizado =
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s) && !s.includes('T')
        ? s.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2')
        : s;
    const d = new Date(normalizado);
    if (isNaN(d.getTime())) {
      return s;
    }
    return this.formatearDateLocal(d);
  }

  private resumirSeriesBlueVox(blueVoxs: any[]): string {
    if (!Array.isArray(blueVoxs) || blueVoxs.length === 0) {
      return '';
    }
    return blueVoxs
      .map((b) => b?.numeroSerie ?? b?.serie ?? '')
      .filter(Boolean)
      .join(', ');
  }

  private generarIdTemporal(item: any, index: number): string {
    const placa = item?.vehiculo?.placa ?? item?.placa ?? '';
    const base =
      (item?.id ??
        item?.idInstalacion ??
        item?.inicioViaje ??
        item?.serieDispositivo ??
        item?.serieBlueVox ??
        placa) || 'row';
    return `${base}-${index}`;
  }

  private cargarClientes(): void {
    this.clientesService.obtenerClientes().subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.clientesOptions = raw.map((c: any) => ({
          ...c,
          id: Number(c?.id ?? c?.Id ?? c?.idCliente ?? c?.ID),
        }));
      },
      error: (error) => {
        console.error('Error al cargar clientes', error);
        this.clientesOptions = [];
      },
    });
  }


  private cargarInstalaciones(): void {
    this.instalacionesService.obtenerInstalaciones().subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.instalacionesOptions = raw.map((i: any) => ({
          ...i,
          id: Number(i?.id ?? i?.Id ?? i?.idInstalacion ?? i?.ID),
          nombre: i?.nombre ?? i?.descripcion ?? i?.codigo ?? '',
        }));
      },
      error: (error) => {
        console.error('Error al cargar instalaciones', error);
        this.instalacionesOptions = [];
      },
    });
  }

}
