import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DxDataGridComponent } from 'devextreme-angular';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import { VehiculosService } from 'src/app/shared/services/vehiculos.service';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import { DerroterosService } from 'src/app/shared/services/derroteros.service';
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
  public derroterosOptions: any[] = [];

  public clienteValueExpr: string = 'id';
  public rutaValueExpr: string = 'id';
  public operadorValueExpr: string = 'id';
  public vehiculoValueExpr: string = 'id';
  public dispositivoValueExpr: string = 'id';
  public derroteroValueExpr: string = 'id';

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

  public operadorDisplayExpr = (o: any) => {
    if (!o) return '';
    // Concatenar nombreUsuario + apellidoPaternoUsuario + apellidoMaternoUsuario
    const nombreCompleto = [
      o.nombreUsuario || '',
      o.apellidoPaternoUsuario || '',
      o.apellidoMaternoUsuario || ''
    ].filter(Boolean).join(' ');
    return nombreCompleto || o.nombreCompleto || o.nombre || o.operador || o.fullName || '';
  };

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

  public derroteroDisplayExpr = (d: any) =>
    d
      ? d.nombre ??
        d.nombreDerrotero ??
        d.descripcion ??
        d.name ??
        ''
      : '';

  public rutaDisabled: boolean = true;
  public operadorDisabled: boolean = true;
  public vehiculoDisabled: boolean = true;
  public dispositivoDisabled: boolean = true;
  public derroteroDisabled: boolean = true;

  constructor(
    private fb: FormBuilder,
    private clientesService: ClientesService,
    private rutasService: RutasService,
    private operadoresService: OperadoresService,
    private vehiculosService: VehiculosService,
    private dispositivosService: DispositivosService,
    private derroterosService: DerroterosService
  ) {
    this.filtroForm = this.fb.group({
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date(), Validators.required],
      idCliente: [null],
      idRuta: [{value: null, disabled: true}],
      idDerrotero: [{value: null, disabled: true}],
      idOperador: [{value: null, disabled: true}],
      idVehiculo: [{value: null, disabled: true}],
      idDispositivo: [{value: null, disabled: true}],
    });
    this.getCambioCliente();
    this.getCambioRuta();
  }

  ngOnInit(): void {
    this.cargarClientes();
  }

  private getCambioCliente(): void {
    this.filtroForm.get('idCliente')?.valueChanges.subscribe((idCliente) => {
      if (idCliente) {
        this.rutaDisabled = true;
        this.operadorDisabled = true;
        this.vehiculoDisabled = true;
        this.dispositivoDisabled = true;
        this.derroteroDisabled = true;
        this.filtroForm.get('idRuta')?.disable();
        this.filtroForm.get('idOperador')?.disable();
        this.filtroForm.get('idVehiculo')?.disable();
        this.filtroForm.get('idDispositivo')?.disable();
        this.filtroForm.get('idDerrotero')?.disable();
        this.cargarDatosByCliente(Number(idCliente));
      } else {
        this.limpiarDatosDependientes();
      }
    });
  }

  private getCambioRuta(): void {
    this.filtroForm.get('idRuta')?.valueChanges.subscribe((idRuta) => {
      if (idRuta) {
        this.derroteroDisabled = true;
        this.filtroForm.get('idDerrotero')?.disable();
        this.cargarDerroterosByRuta(Number(idRuta));
      } else {
        this.derroterosOptions = [];
        this.filtroForm.patchValue({ idDerrotero: null }, { emitEvent: false });
        this.derroteroDisabled = true;
        this.filtroForm.get('idDerrotero')?.disable();
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
        this.rutaDisabled = this.rutasOptions.length === 0;
        if (this.rutasOptions.length > 0) {
          this.filtroForm.get('idRuta')?.enable();
        } else {
          this.filtroForm.get('idRuta')?.disable();
        }
      },
      error: (error) => {
        console.error('Error al cargar rutas', error);
        this.rutasOptions = [];
        this.rutaDisabled = true;
        this.filtroForm.get('idRuta')?.disable();
      }
    });

    // Cargar operadores/by-cliente
    this.operadoresService.obtenerOperadoresByCliente(idCliente).subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.operadoresOptions = Array.isArray(raw) ? raw.map((o: any) => ({
          ...o,
          id: Number(o?.id ?? o?.Id ?? o?.idOperador ?? o?.ID),
          nombreCompleto: [
            o?.nombreUsuario || '',
            o?.apellidoPaternoUsuario || '',
            o?.apellidoMaternoUsuario || ''
          ].filter(Boolean).join(' ') || o?.nombreCompleto || `${o?.nombre ?? ''} ${o?.apellidoPaterno ?? ''} ${o?.apellidoMaterno ?? ''}`.trim(),
        })) : [];
        this.operadorDisabled = this.operadoresOptions.length === 0;
        if (this.operadoresOptions.length > 0) {
          this.filtroForm.get('idOperador')?.enable();
        } else {
          this.filtroForm.get('idOperador')?.disable();
        }
      },
      error: (error) => {
        console.error('Error al cargar operadores por cliente', error);
        this.operadoresOptions = [];
        this.operadorDisabled = true;
        this.filtroForm.get('idOperador')?.disable();
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

    // Cargar dispositivos/by-cliente
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

  private cargarDerroterosByRuta(idRuta: number): void {
    this.derroterosService.obtenerDerroterosByRuta(idRuta).subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.derroterosOptions = Array.isArray(raw) ? raw.map((d: any) => ({
          ...d,
          id: Number(d?.id ?? d?.Id ?? d?.idDerrotero ?? d?.ID),
        })) : [];
        this.derroteroDisabled = this.derroterosOptions.length === 0;
        if (this.derroterosOptions.length > 0) {
          this.filtroForm.get('idDerrotero')?.enable();
        } else {
          this.filtroForm.get('idDerrotero')?.disable();
        }
      },
      error: (error) => {
        console.error('Error al cargar derroteros por ruta', error);
        this.derroterosOptions = [];
        this.derroteroDisabled = true;
        this.filtroForm.get('idDerrotero')?.disable();
      }
    });
  }

  private limpiarDatosDependientes(): void {
    this.rutasOptions = [];
    this.operadoresOptions = [];
    this.vehiculosOptions = [];
    this.dispositivosOptions = [];
    this.derroterosOptions = [];
    this.rutaDisabled = true;
    this.operadorDisabled = true;
    this.vehiculoDisabled = true;
    this.dispositivoDisabled = true;
    this.derroteroDisabled = true;
    this.filtroForm.get('idRuta')?.disable();
    this.filtroForm.get('idOperador')?.disable();
    this.filtroForm.get('idVehiculo')?.disable();
    this.filtroForm.get('idDispositivo')?.disable();
    this.filtroForm.get('idDerrotero')?.disable();
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
