import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DxDataGridComponent } from 'devextreme-angular';
import { ReportesService, RecaudacionDiariaRutaRequest } from '../reportes.service';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { RegionesService } from 'src/app/shared/services/regiones.service';
import { RutasService } from 'src/app/shared/services/rutas.service';
import { DerroterosService } from 'src/app/shared/services/derroteros.service';

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
  public regionesOptions: any[] = [];
  public regionValueExpr: string = 'id';
  public regionDisplayExpr = (r: any) =>
    r
      ? r.nombre ?? 
        r.nombreRegion ?? 
        r.descripcion ?? 
        r.name ?? 
        ''
      : '';
  public rutasOptions: any[] = [];
  public rutaValueExpr: string = 'id';
  public rutaDisplayExpr = (r: any) =>
    r
      ? r.nombre ?? 
        r.nombreRuta ?? 
        r.descripcion ?? 
        r.name ?? 
        ''
      : '';
  public derroterosOptions: any[] = [];
  public derroteroValueExpr: string = 'id';
  public derroteroDisplayExpr = (d: any) =>
    d
      ? d.nombre ??
        d.nombreDerrotero ??
        d.descripcion ??
        d.name ??
        ''
      : '';
  public regionDisabled: boolean = true;
  public rutaDisabled: boolean = true;
  public derroteroDisabled: boolean = true;

  constructor(
    private fb: FormBuilder,
    private reportesService: ReportesService,
    private clientesService: ClientesService,
    private regionesService: RegionesService,
    private rutasService: RutasService,
    private derroterosService: DerroterosService
  ) {
    this.filtroForm = this.fb.group({
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date(), Validators.required],
      idCliente: [null],
      idRegion: [{value: null, disabled: true}],
      idRuta: [{value: null, disabled: true}],
      idDerrotero: [{value: null, disabled: true}]
    });
    this.getCambioCliente();
    this.getCambioRegion();
    this.getCambioRuta();
  }

  ngOnInit(): void {
    this.cargarClientes();
  }

  private getCambioCliente(): void {
    this.filtroForm.get('idCliente')?.valueChanges.subscribe((idCliente) => {
      if (idCliente) {
        this.regionDisabled = true;
        this.filtroForm.get('idRegion')?.disable();
        this.cargarRegionesByCliente(Number(idCliente));
      } else {
        this.regionesOptions = [];
        this.filtroForm.patchValue({ idRegion: null }, { emitEvent: false });
        this.rutasOptions = [];
        this.filtroForm.patchValue({ idRuta: null }, { emitEvent: false });
        this.derroterosOptions = [];
        this.filtroForm.patchValue({ idDerrotero: null }, { emitEvent: false });
        this.regionDisabled = true;
        this.rutaDisabled = true;
        this.derroteroDisabled = true;
        this.filtroForm.get('idRegion')?.disable();
        this.filtroForm.get('idRuta')?.disable();
        this.filtroForm.get('idDerrotero')?.disable();
      }
    });
  }

  private getCambioRegion(): void {
    this.filtroForm.get('idRegion')?.valueChanges.subscribe((idRegion) => {
      if (idRegion) {
        this.rutaDisabled = true;
        this.filtroForm.get('idRuta')?.disable();
        this.cargarRutasByRegion(Number(idRegion));
      } else {
        this.rutasOptions = [];
        this.filtroForm.patchValue({ idRuta: null }, { emitEvent: false });
        this.derroterosOptions = [];
        this.filtroForm.patchValue({ idDerrotero: null }, { emitEvent: false });
        this.rutaDisabled = true;
        this.derroteroDisabled = true;
        this.filtroForm.get('idRuta')?.disable();
        this.filtroForm.get('idDerrotero')?.disable();
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

  private cargarRegionesByCliente(idCliente: number): void {
    this.regionesService.obtenerRegionesByCliente(idCliente).subscribe({
      next: (response) => {
        const raw = (response as any)?.data ?? response ?? [];
        this.regionesOptions = Array.isArray(raw) ? raw.map((r: any) => ({
          ...r,
          id: Number(r?.id ?? r?.Id ?? r?.idRegion ?? r?.ID),
        })) : [];
        this.regionDisabled = this.regionesOptions.length === 0;
        if (this.regionesOptions.length > 0) {
          this.filtroForm.get('idRegion')?.enable();
        } else {
          this.filtroForm.get('idRegion')?.disable();
        }
      },
      error: (error) => {
        console.error('Error al cargar regiones por cliente', error);
        this.regionesOptions = [];
        this.regionDisabled = true;
        this.filtroForm.get('idRegion')?.disable();
      }
    });
  }

  private cargarRutasByRegion(idRegion: number): void {
    this.rutasService.obtenerRutasByRegion(idRegion).subscribe({
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
        console.error('Error al cargar rutas por región', error);
        this.rutasOptions = [];
        this.rutaDisabled = true;
        this.filtroForm.get('idRuta')?.disable();
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
    this.regionesOptions = [];
    this.rutasOptions = [];
    this.derroterosOptions = [];
    this.regionDisabled = true;
    this.rutaDisabled = true;
    this.derroteroDisabled = true;
    this.filtroForm.get('idRegion')?.disable();
    this.filtroForm.get('idRuta')?.disable();
    this.filtroForm.get('idDerrotero')?.disable();
    this.informacion = [];
  }

  private construirPayload(): RecaudacionDiariaRutaRequest {
    const raw = this.filtroForm.value;
    return {
      fechaInicio: this.formatearFecha(raw.fechaInicio),
      fechaFin: this.formatearFecha(raw.fechaFin),
      idCliente: raw.idCliente ? Number(raw.idCliente) : null,
      idRegion: raw.idRegion ? Number(raw.idRegion) : null,
      idRuta: raw.idRuta ? Number(raw.idRuta) : null,
      idDerrotero: raw.idDerrotero ? Number(raw.idDerrotero) : null
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
