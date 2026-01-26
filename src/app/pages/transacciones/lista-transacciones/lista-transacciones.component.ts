import { Component, OnInit, ViewChild } from '@angular/core';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { FormBuilder, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';

declare var google: any;

@Component({
  selector: 'app-lista-transacciones',
  templateUrl: './lista-transacciones.component.html',
  styleUrls: ['./lista-transacciones.component.scss'],
  animations: [fadeInUpAnimation]
})
export class ListaTransaccionesComponent implements OnInit {

  listaTransacciones: any;
  isLoading: boolean = false;
  public selectedTransactionId: number | null = null;
  public latSelect: string | null = null;
  public lngSelect: string | null = null;
  public selectedTransactionDate: string | null = null;
  public selectedTransactionAmount: number | null = null;
  public selectedTipoTransaccion: any | null = null;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna"
  public loading: boolean = false;
  public loadingMessage: string = 'Cargando...';
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  public data: string;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  public showMap: boolean = false;

  filtrosForm!: FormGroup;
  fechaInicioFiltro: string | null = null;
  fechaFinFiltro: string | null = null;

  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

  constructor(
    private tranService: TransaccionesService,
    private modalService: NgbModal,
    private route: Router,
    private permissionsService: NgxPermissionsService,
    private fb: FormBuilder
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.filtrosForm = this.fb.group({
      fechaInicio: [null],
      fechaFin: [null]
    });

    this.setupDataSource();
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  setupDataSource() {
    this.loading = true;

    this.listaTransacciones = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        this.loading = true;

        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        const body = {
          page,
          limit: take,
          fechaInicio: this.fechaInicioFiltro,
          fechaFin: this.fechaFinFiltro
        };

        try {
          const resp: any = await lastValueFrom(
            this.tranService.obtenerTransaccionesData(body)
          );
          this.loading = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated ?? {};
          const totalRegistros = toNum(meta.total) ?? rows.length;
          const paginaActual = toNum(meta.page) ?? page;
          const totalPaginas =
            toNum(meta.lastPage) ?? Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((x: any) => {
            const pasajero = [x?.nombrePasajero, x?.apellidoPaternoPasajero, x?.apellidoMaternoPasajero]
              .filter(v => !!(v && String(v).trim()))
              .join(' ')
              .trim();

            return {
              id: x?.id ?? null,
              Id: x?.id ?? null,
              tipoTransaccion: x?.tipoTransaccion ?? null,
              monto: toMoney(x?.monto),
              latitudFinal: x?.latitudFinal ?? null,
              longitudFinal: x?.longitudFinal ?? null,
              fechaHoraFinal: x?.fechaHoraFinal ?? null,
              fhRegistro: x?.fhRegistro ?? null,
              numeroSerieMonedero: x?.numeroSerieMonedero ?? null,
              numeroSerieDispositivo: x?.numeroSerieDispositivo ?? null,
              pasajero: pasajero || 'Sin registro',
              nombreCliente: x?.nombreCliente ?? null,
              apellidoPaternoCliente: x?.apellidoPaternoCliente ?? null,
              apellidoMaternoCliente: x?.apellidoMaternoCliente ?? null
            };
          });

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (error) {
          this.loading = false;
          console.error('[TRANSACCIONES] Error:', error);
          return { data: [], totalCount: 0 };
        }
      }
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }

    function toMoney(v: any): number | null {
      if (v === null || v === undefined) return null;
      const s = String(v).replace(',', '.').replace(/[^0-9.-]/g, '');
      const n = Number(s);
      return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
    }
  }

  private formatDateForApi(value: any): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  aplicarFiltros() {
    const { fechaInicio, fechaFin } = this.filtrosForm.value;

    this.fechaInicioFiltro = this.formatDateForApi(fechaInicio);
    this.fechaFinFiltro = this.formatDateForApi(fechaFin);

    this.paginaActual = 1;
    if (this.dataGrid) {
      this.dataGrid.instance.pageIndex(0);
      this.dataGrid.instance.refresh();
    }
  }

  limpiarFiltros() {
    this.filtrosForm.reset();
    this.fechaInicioFiltro = null;
    this.fechaFinFiltro = null;

    this.paginaActual = 1;
    if (this.dataGrid) {
      this.dataGrid.instance.pageIndex(0);
      this.dataGrid.instance.refresh();
    }
  }

  onGridOptionChanged(e: any) {
    if (e.fullName === "searchPanel.text") {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaTransacciones);
        return;
      }
      const search = this.filtroActivo.toLowerCase();
      const dataFiltrada = this.paginaActualData.filter((item: any) =>
        (item.nombre && item.nombre.toLowerCase().includes(search)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(search)) ||
        (item.modulo?.nombre && item.modulo.nombre.toLowerCase().includes(search))
      );
      this.dataGrid.instance.option('dataSource', dataFiltrada);
    }
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  showInfo(id: any): void {
    console.log('Mostrar información de la transacción con ID:', id);
  }

  centerModal(centerDataModal: any, id: number, latitudFinal: string, longitudFinal: string, fechaHoraFinal: string, monto: number, tipoTransaccion: any) {
    this.selectedTransactionId = id;
    this.latSelect = latitudFinal;
    this.lngSelect = longitudFinal;
    this.selectedTransactionDate = fechaHoraFinal;
    this.selectedTransactionAmount = monto;
    this.selectedTipoTransaccion = tipoTransaccion;
    if (this.latSelect == null || this.latSelect == '') {
      this.showMap = true;
    } else {
      this.showMap = false;
    }
    this.modalService.open(centerDataModal, {
      centered: true, windowClass: 'modal-holder',
      backdrop: 'static',
      keyboard: false,
    });

    setTimeout(() => {
      this.initializeMap(latitudFinal, longitudFinal);
    }, 500);
  }

  private readonly markerIcon: google.maps.Icon = {
    url: new URL('assets/images/icons8-marker-48.png', document.baseURI).toString(),
    scaledSize: new google.maps.Size(42, 42),
    anchor: new google.maps.Point(21, 42),
  };

  initializeMap(lat: string, lng: string) {
    const mapElement = document.getElementById('map') as HTMLElement | null;
    if (!mapElement) return;

    const position = { lat: Number(lat), lng: Number(lng) };

    const map = new google.maps.Map(mapElement, {
      center: position,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
    });

    new google.maps.Marker({
      position,
      map,
      icon: this.markerIcon,
      title: `Ubicación`,
    });
  }

  cerrarModal(modal: any) {
    modal.close('Modal cerrado por nuevo método');
  }

  agregarTransaccion() {
    this.route.navigateByUrl('/transacciones/agregar-transaccion')
  }

  onFechaFinChange(value: any) {
    if (!value) return;

    const seleccionada = new Date(value);
    const hoy = new Date();

    seleccionada.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    if (seleccionada > hoy) {
      Swal.fire({
        background: '#002136',
        icon: 'warning',
        title: '¡Ops!',
        text: 'La fecha fin no puede ser mayor a la fecha actual.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.filtrosForm.patchValue({ fechaFin: today });
      });
    }
  }

  onFechaInicioChange(value: any) {
    if (!value) return;

    const seleccionada = new Date(value);
    const hoy = new Date();

    seleccionada.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    if (seleccionada > hoy) {
      Swal.fire({
        background: '#002136',
        icon: 'warning',
        title: '¡Ops!',
        text: 'La fecha inicio no puede ser mayor a la fecha actual.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.filtrosForm.patchValue({ fechaInicio: today });
      });
    }
  }


}