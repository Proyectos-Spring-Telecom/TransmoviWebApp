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

  public instalacionDisplayExpr = (i: any) =>
    i
      ? i.nombre ??
        i.descripcion ??
        i.codigo ??
        ''
      : '';

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
      idDispositivo: [null],
      idInstalacion: [null],
    });
  }

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarDispositivos();
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

  limpiarFiltros(): void {
    this.filtroForm.reset({
      fechaInicio: new Date(),
      fechaFin: new Date(),
      idCliente: null,
      idDispositivo: null,
      idInstalacion: null,
    });
    this.informacion = [];
  }

  private construirPayload(): RecaudacionDispositivoRequest {
    const raw = this.filtroForm.value;
    return {
      fechaInicio: this.formatearFecha(raw.fechaInicio),
      fechaFin: this.formatearFecha(raw.fechaFin),
      idCliente: raw.idCliente,
      idDispositivo: raw.idDispositivo,
      idInstalacion: raw.idInstalacion,
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

    return data.map((item, index) => ({
      id: item?.id ?? this.generarIdTemporal(item, index),
      serieDispositivo: item?.serieDispositivo ?? item?.serie ?? 'Sin información',
      serieBluevox: item?.serieBlueVox ?? item?.serieBluevox ?? 'Sin información',
      vehiculo: item?.vehiculo ?? item?.numeroEconomico ?? item?.placa ?? 'Sin información',
      validaciones: item?.validaciones ?? 0,
      ingresos: item?.ingresos ?? 0,
      ultimaPosicion: item?.ultimaPosicion
        ? new Date(item.ultimaPosicion).toLocaleString('es-MX')
        : 'Sin información',
      estado: item?.estadoDispositivo ?? item?.estado ?? 'Sin información',
    }));
  }

  private generarIdTemporal(item: any, index: number): string {
    const base =
      item?.idInstalacion ??
      item?.serieDispositivo ??
      item?.serieBlueVox ??
      item?.vehiculo ??
      'row';
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

  private cargarDispositivos(): void {
    this.dispositivosService.obtenerDispositivos().subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.dispositivosOptions = raw.map((d: any) => ({
          ...d,
          id: Number(d?.id ?? d?.Id ?? d?.idDispositivo ?? d?.ID),
          numeroSerie: d?.numeroSerie ?? d?.serie ?? d?.serieDispositivo ?? '',
        }));
      },
      error: (error) => {
        console.error('Error al cargar dispositivos', error);
        this.dispositivosOptions = [];
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
