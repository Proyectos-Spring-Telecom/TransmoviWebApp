import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DxDataGridComponent } from 'devextreme-angular';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import { VehiculosService } from 'src/app/shared/services/vehiculos.service';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

@Component({
  selector: 'app-recaudacion-detalladas',
  templateUrl: './recaudacion-detalladas.component.html',
  styleUrl: './recaudacion-detalladas.component.scss',
  animations: [fadeInUpAnimation]
})
export class RecaudacionDetalladasComponent implements OnInit {

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
  public rutasOptions: any[] = [];
  public operadoresOptions: any[] = [];
  public vehiculosOptions: any[] = [];
  public dispositivosOptions: any[] = [];

  public clienteValueExpr: string = 'id';
  public rutaValueExpr: string = 'id';
  public operadorValueExpr: string = 'id';
  public vehiculoValueExpr: string = 'id';
  public dispositivoValueExpr: string = 'id';

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

  public rutaDisplayExpr = (r: any) =>
    r
      ? r.nombre ??
        r.nombreRuta ??
        r.descripcion ??
        r.name ??
        ''
      : '';

  public operadorDisplayExpr = (o: any) =>
    o
      ? o.nombreCompleto ??
        o.nombre ??
        o.operador ??
        o.fullName ??
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

  public dispositivoDisplayExpr = (d: any) =>
    d
      ? d.numeroSerie ??
        d.serie ??
        d.serieDispositivo ??
        d.nombre ??
        d.descripcion ??
        ''
      : '';

  constructor(
    private fb: FormBuilder,
    private clientesService: ClientesService,
    private rutasService: RutasService,
    private operadoresService: OperadoresService,
    private vehiculosService: VehiculosService,
    private dispositivosService: DispositivosService
  ) {
    this.filtroForm = this.fb.group({
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date(), Validators.required],
      idCliente: [null],
      idRuta: [null],
      idDerrotero: [null],
      idOperador: [null],
      idVehiculo: [null],
      idDispositivo: [null],
    });
    this.getCambioCliente();
  }

  ngOnInit(): void {
    this.cargarClientes();
  }

  private getCambioCliente(): void {
    this.filtroForm.get('idCliente')?.valueChanges.subscribe((idCliente) => {
      if (idCliente) {
        this.cargarDatosByCliente(Number(idCliente));
      } else {
        this.limpiarDatosDependientes();
      }
    });
  }

  private cargarDatosByCliente(idCliente: number): void {
    // Cargar rutas/list
    this.rutasService.obtenerRutas().subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.rutasOptions = Array.isArray(raw) ? raw.map((r: any) => ({
          ...r,
          id: Number(r?.id ?? r?.Id ?? r?.idRuta ?? r?.ID),
        })) : [];
      },
      error: (error) => {
        console.error('Error al cargar rutas', error);
        this.rutasOptions = [];
      }
    });

    // Cargar operadores/by-cliente
    this.operadoresService.obtenerOperadoresByCliente(idCliente).subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.operadoresOptions = Array.isArray(raw) ? raw.map((o: any) => ({
          ...o,
          id: Number(o?.id ?? o?.Id ?? o?.idOperador ?? o?.ID),
          nombreCompleto:
            o?.nombreCompleto ??
            `${o?.nombre ?? ''} ${o?.apellidoPaterno ?? ''} ${o?.apellidoMaterno ?? ''}`.trim(),
        })) : [];
      },
      error: (error) => {
        console.error('Error al cargar operadores por cliente', error);
        this.operadoresOptions = [];
      }
    });

    // Cargar vehiculos/by-cliente
    this.vehiculosService.obtenerVehiculosByCliente(idCliente).subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.vehiculosOptions = Array.isArray(raw) ? raw.map((v: any) => ({
          ...v,
          id: Number(v?.id ?? v?.Id ?? v?.idVehiculo ?? v?.ID),
          numeroEconomico: v?.numeroEconomico ?? v?.numero ?? v?.placa ?? '',
        })) : [];
      },
      error: (error) => {
        console.error('Error al cargar vehículos por cliente', error);
        this.vehiculosOptions = [];
      }
    });

    // Cargar dispositivos/by-cliente
    this.dispositivosService.obtenerDispositivosByCliente(idCliente).subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.dispositivosOptions = Array.isArray(raw) ? raw.map((d: any) => ({
          ...d,
          id: Number(d?.id ?? d?.Id ?? d?.idDispositivo ?? d?.ID),
          numeroSerie: d?.numeroSerie ?? d?.serie ?? d?.serieDispositivo ?? '',
        })) : [];
      },
      error: (error) => {
        console.error('Error al cargar dispositivos por cliente', error);
        this.dispositivosOptions = [];
      }
    });
  }

  private limpiarDatosDependientes(): void {
    this.rutasOptions = [];
    this.operadoresOptions = [];
    this.vehiculosOptions = [];
    this.dispositivosOptions = [];
    this.filtroForm.patchValue({
      idRuta: null,
      idDerrotero: null,
      idOperador: null,
      idVehiculo: null,
      idDispositivo: null,
    }, { emitEvent: false });
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

  limpiarFiltros(): void {
    this.filtroForm.reset({
      fechaInicio: new Date(),
      fechaFin: new Date(),
      idCliente: null,
      idRuta: null,
      idDerrotero: null,
      idOperador: null,
      idVehiculo: null,
      idDispositivo: null,
    });
    this.limpiarDatosDependientes();
    this.informacion = [];
  }

  aplicarFiltros(): void {
    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      return;
    }
    // Aquí se implementaría la lógica para obtener los datos del reporte
    console.log('Aplicar filtros:', this.filtroForm.value);
  }

}
