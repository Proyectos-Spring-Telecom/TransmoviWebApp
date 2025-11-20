import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DxDataGridComponent } from 'devextreme-angular';
import { ReportesService, RecaudacionDiariaRutaRequest } from '../reportes.service';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';

@Component({
  selector: 'app-recaudacion-diaria-ruta',
  templateUrl: './recaudacion-diaria-ruta.component.html',
  styleUrl: './recaudacion-diaria-ruta.component.scss',
  animations: [fadeInUpAnimation]
})
export class RecaudacionDiariaRutaComponent implements OnInit {

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
  public clienteValueExpr: string = 'id';
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

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
    private clientesService: ClientesService
  ) {
    this.filtroForm = this.fb.group({
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date(), Validators.required],
      idCliente: [null],
      idRegion: [null],
      idRuta: [null],
      idDerrotero: [null]
    });
  }

  ngOnInit(): void {
    this.cargarClientes();
  }

  aplicarFiltros(): void {
    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      return;
    }

    const payload = this.construirPayload();
    this.loading = true;
    this.reportesService.obtenerRecaudacionDiariaPorRuta(payload).subscribe({
      next: (data) => {
        const respuesta = Array.isArray(data) ? data : (data?.data ?? data ?? []);
        this.informacion = this.mapearRespuesta(respuesta);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al obtener recaudación diaria por ruta', error);
        this.informacion = [];
        this.loading = false;
      }
    });
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
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      fechaInicio: new Date(),
      fechaFin: new Date(),
      idCliente: null,
      idRegion: null,
      idRuta: null,
      idDerrotero: null
    });
    this.informacion = [];
  }

  private construirPayload(): RecaudacionDiariaRutaRequest {
    const raw = this.filtroForm.value;
    return {
      fechaInicio: this.formatearFecha(raw.fechaInicio),
      fechaFin: this.formatearFecha(raw.fechaFin),
      idCliente: raw.idCliente,
      idRegion: raw.idRegion,
      idRuta: raw.idRuta,
      idDerrotero: raw.idDerrotero
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
      fecha: item?.fecha ? new Date(item.fecha) : null,
      region: item?.nombreRegion ?? 'Sin información',
      ruta: item?.nombreRuta ?? 'Sin información',
      derrotero: item?.nombreDerrotero ?? 'Sin información',
      viajes: item?.viajes ?? 0,
      validaciones: item?.validaciones ?? 0,
      ingresos: item?.ingresos ?? 0,
      ticketPromedio: item?.ticketPromedio ?? 0,
      porcentajeElectronico: this.normalizarPorcentaje(item?.porcentajeElectronico),
      evasionesAbs: item?.evasionAbsoluta ?? 0,
      evasionesPorcentaje: this.normalizarPorcentaje(item?.evasionPorcentual),
    }));
  }

  private generarIdTemporal(item: any, index: number): string {
    const base =
      item?.fecha ??
      item?.nombreRegion ??
      item?.nombreRuta ??
      item?.nombreDerrotero ??
      'row';
    return `${base}-${index}`;
  }

  private normalizarPorcentaje(valor: number | null | undefined): number {
    if (valor == null || isNaN(valor)) {
      return 0;
    }
    return valor > 1 ? valor / 100 : valor;
  }

}
