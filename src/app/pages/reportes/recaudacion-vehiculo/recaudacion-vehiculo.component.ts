import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DxDataGridComponent } from 'devextreme-angular';
import { ReportesService, RecaudacionVehiculoRequest } from '../reportes.service';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { VehiculosService } from 'src/app/shared/services/vehiculos.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

@Component({
  selector: 'app-recaudacion-vehiculo',
  templateUrl: './recaudacion-vehiculo.component.html',
  styleUrl: './recaudacion-vehiculo.component.scss',
  animations: [fadeInUpAnimation]
})
export class RecaudacionVehiculoComponent implements OnInit {

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
  public vehiculosOptions: any[] = [];
  public rutasOptions: any[] = [];

  public clienteValueExpr: string = 'id';
  public vehiculoValueExpr: string = 'id';
  public rutaValueExpr: string = 'id';

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

  public vehiculoDisplayExpr = (v: any) =>
    v
      ? v.numeroEconomico ??
        v.numero ??
        v.placa ??
        v.nombre ??
        v.descripcion ??
        ''
      : '';

  public rutaDisplayExpr = (r: any) =>
    r
      ? r.nombre ??
        r.descripcion ??
        r.derrotero ??
        r.route ??
        ''
      : '';
  public vehiculoDisabled: boolean = true;

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
    private clientesService: ClientesService,
    private vehiculosService: VehiculosService,
    private rutasService: RutasService
  ) {
    this.filtroForm = this.fb.group({
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date(), Validators.required],
      idCliente: [null],
      idVehiculo: [{value: null, disabled: true}],
      idRuta: [null],
    });
    this.getCambioCliente();
  }

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarRutas();
  }

  aplicarFiltros(): void {
    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      return;
    }

    const payload = this.construirPayload();
    this.loading = true;
    this.reportesService.obtenerRecaudacionPorVehiculo(payload).subscribe({
      next: (data) => {
        const respuesta = Array.isArray(data) ? data : (data?.data ?? data ?? []);
        this.informacion = this.mapearRespuesta(respuesta);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al obtener recaudación por vehículo', error);
        this.informacion = [];
        this.loading = false;
      },
    });
  }

  private getCambioCliente(): void {
    this.filtroForm.get('idCliente')?.valueChanges.subscribe((idCliente) => {
      if (idCliente) {
        this.vehiculoDisabled = true;
        this.filtroForm.get('idVehiculo')?.disable();
        this.cargarVehiculosByCliente(Number(idCliente));
      } else {
        this.vehiculosOptions = [];
        this.filtroForm.patchValue({ idVehiculo: null }, { emitEvent: false });
        this.vehiculoDisabled = true;
        this.filtroForm.get('idVehiculo')?.disable();
      }
    });
  }

  private cargarVehiculosByCliente(idCliente: number): void {
    this.vehiculosService.obtenerVehiculosByCliente(idCliente).subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.vehiculosOptions = Array.isArray(raw) ? raw.map((v: any) => ({
          ...v,
          id: Number(v?.id ?? v?.Id ?? v?.idVehiculo ?? v?.ID),
          numeroEconomico: v?.numeroEconomico ?? v?.numero ?? v?.placa ?? '',
        })) : [];
        this.vehiculoDisabled = this.vehiculosOptions.length === 0;
        if (this.vehiculosOptions.length > 0) {
          this.filtroForm.get('idVehiculo')?.enable();
        } else {
          this.filtroForm.get('idVehiculo')?.disable();
        }
      },
      error: (error) => {
        console.error('Error al cargar vehículos por cliente', error);
        this.vehiculosOptions = [];
        this.vehiculoDisabled = true;
        this.filtroForm.get('idVehiculo')?.disable();
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      fechaInicio: new Date(),
      fechaFin: new Date(),
      idCliente: null,
      idVehiculo: null,
      idRuta: null,
    });
    this.vehiculosOptions = [];
    this.vehiculoDisabled = true;
    this.filtroForm.get('idVehiculo')?.disable();
    this.informacion = [];
  }

  private construirPayload(): RecaudacionVehiculoRequest {
    const raw = this.filtroForm.value;
    return {
      fechaInicio: this.formatearFecha(raw.fechaInicio),
      fechaFin: this.formatearFecha(raw.fechaFin),
      idCliente: raw.idCliente ? Number(raw.idCliente) : null,
      idVehiculo: raw.idVehiculo ? Number(raw.idVehiculo) : null,
      idRuta: raw.idRuta ? Number(raw.idRuta) : null,
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
      numeroEconomico: item?.numeroEconomico ?? 'Sin información',
      placa: item?.placa ?? 'Sin información',
      marcaModeloAno:
        item?.marcaModeloAno ??
        item?.marcaModelo ??
        item?.descripcion ??
        this.inferirMarcaModelo(item) ??
        'Sin información',
      turnos: item?.turnos ?? 0,
      viajes: item?.viajes ?? 0,
      validaciones: item?.validaciones ?? 0,
      ingresos: item?.ingresos ?? 0,
      ticketPromedio: item?.ticketPromedio ?? 0,
      horasServicio: item?.horasServicio ?? 0,
    }));
  }

  private inferirMarcaModelo(item: any): string | null {
    if (!item) {
      return null;
    }
    const parts = [
      item?.marca,
      item?.modelo,
      item?.ano ?? item?.anio,
    ].filter(Boolean);
    return parts.length ? parts.join(' / ') : null;
  }

  private generarIdTemporal(item: any, index: number): string {
    const base =
      item?.idVehiculo ??
      item?.numeroEconomico ??
      item?.placa ??
      item?.marcaModeloAno ??
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


  private cargarRutas(): void {
    this.rutasService.obtenerRutas().subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.rutasOptions = raw.map((r: any) => ({
          ...r,
          id: Number(r?.id ?? r?.Id ?? r?.idRuta ?? r?.ID),
          nombre: r?.nombre ?? r?.descripcion ?? r?.route ?? '',
        }));
      },
      error: (error) => {
        console.error('Error al cargar rutas', error);
        this.rutasOptions = [];
      },
    });
  }

}
