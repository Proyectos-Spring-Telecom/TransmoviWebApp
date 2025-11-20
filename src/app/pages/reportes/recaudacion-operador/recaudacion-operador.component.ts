import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DxDataGridComponent } from 'devextreme-angular';
import { ReportesService, RecaudacionOperadorRequest } from '../reportes.service';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

@Component({
  selector: 'app-recaudacion-operador',
  templateUrl: './recaudacion-operador.component.html',
  styleUrl: './recaudacion-operador.component.scss',
  animations: [fadeInUpAnimation]
})
export class RecaudacionOperadorComponent implements OnInit {

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
  public operadoresOptions: any[] = [];
  public clienteValueExpr: string = 'id';
  public operadorValueExpr: string = 'id';

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

  public operadorDisplayExpr = (o: any) =>
    o ? o.nombreCompleto ?? o.nombre ?? o.operador ?? o.fullName ?? '' : '';

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
    private clientesService: ClientesService,
    private operadoresService: OperadoresService
  ) {
    this.filtroForm = this.fb.group({
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date(), Validators.required],
      idCliente: [null],
      idOperador: [null],
    });
  }

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarOperadores();
  }

  aplicarFiltros(): void {
    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      return;
    }

    const payload = this.construirPayload();
    this.loading = true;
    this.reportesService.obtenerRecaudacionPorOperador(payload).subscribe({
      next: (data) => {
        const respuesta = Array.isArray(data) ? data : (data?.data ?? data ?? []);
        this.informacion = this.mapearRespuesta(respuesta);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al obtener recaudación por operador', error);
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
      idOperador: null,
    });
    this.informacion = [];
  }

  private construirPayload(): RecaudacionOperadorRequest {
    const raw = this.filtroForm.value;
    return {
      fechaInicio: this.formatearFecha(raw.fechaInicio),
      fechaFin: this.formatearFecha(raw.fechaFin),
      idCliente: raw.idCliente,
      idOperador: raw.idOperador,
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
      operador:
        item?.operador ??
        item?.nombreOperador ??
        item?.nombre ??
        item?.operadorNombre ??
        item?.operadorDescripcion ??
        'Sin información',
      licencia:
        item?.licencia ??
        item?.numeroLicencia ??
        item?.licenciaNumero ??
        item?.licenciaDescripcion ??
        'Sin información',
      turnos: item?.turnos ?? item?.cantidadTurnos ?? 0,
      viajes: item?.viajes ?? item?.cantidadViajes ?? 0,
      validaciones: item?.validaciones ?? item?.cantidadValidaciones ?? 0,
      ingresos: item?.ingresos ?? item?.monto ?? 0,
      ticketPromedio: item?.ticketPromedio ?? item?.ticket ?? 0,
      evasionPorcentaje: this.normalizarPorcentaje(
        item?.evasionPorcentaje ?? item?.evasionPorcentual ?? item?.evasionesPorcentaje
      ),
      ultimoTurno: item?.ultimoTurno
        ? new Date(item.ultimoTurno).toLocaleDateString('es-MX')
        : 'Sin información',
    }));
  }

  private normalizarPorcentaje(valor: number | null | undefined): number {
    if (valor == null || isNaN(valor)) {
      return 0;
    }
    return valor > 1 ? valor / 100 : valor;
  }

  private generarIdTemporal(item: any, index: number): string {
    const base =
      item?.idOperador ??
      item?.operador ??
      item?.nombreOperador ??
      item?.licencia ??
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

  private cargarOperadores(): void {
    this.operadoresService.obtenerOperadores().subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.operadoresOptions = raw.map((o: any) => ({
          ...o,
          id: Number(o?.id ?? o?.Id ?? o?.idOperador ?? o?.ID),
          nombreCompleto:
            o?.nombreCompleto ??
            `${o?.nombre ?? ''} ${o?.apellidoPaterno ?? ''} ${o?.apellidoMaterno ?? ''}`.trim(),
        }));
      },
      error: (error) => {
        console.error('Error al cargar operadores', error);
        this.operadoresOptions = [];
      },
    });
  }

}
