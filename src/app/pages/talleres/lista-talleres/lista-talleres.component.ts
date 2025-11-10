import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { TallereService } from 'src/app/shared/services/talleres.service';

@Component({
  selector: 'app-lista-talleres',
  templateUrl: './lista-talleres.component.html',
  styleUrl: './lista-talleres.component.scss',
  animations: [fadeInUpAnimation],
})
export class ListaTalleresComponent implements OnInit {
  listaTalleres: any;
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
  public mensajeAgrupar: string =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';
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
  public selectedTallerId: number | string | null = null;
  public selectedTallerNombre: string | null = null;
  public selectedTallerDireccion: string | null = null;
  public hasLocation = false;
  @ViewChild(DxDataGridComponent, { static: false })
  dataGrid: DxDataGridComponent;

  constructor(
    private tallService: TallereService,
    private modalService: NgbModal,
    private route: Router,
    private permissionsService: NgxPermissionsService
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerTalleres();
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  obtenerTalleres(): void {
    this.tallService.obtenerTalleres().subscribe((response: any) => {
      this.listaTalleres = response;
    });
  }

  setupDataSource() {
    this.loading = true;

    this.listaTalleres = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.tallService.obtenerTalleresData(page, take)
          );
          this.loading = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated ?? {};
          const totalRegistros = toNum(meta.total) ?? rows.length;
          const paginaActual = toNum(meta.page) ?? page;
          const totalPaginas =
            toNum(meta.lastPage) ??
            Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((x: any) => {
            const pasajero = [
              x?.nombrePasajero,
              x?.apellidoPaternoPasajero,
              x?.apellidoMaternoPasajero,
            ]
              .filter((v) => !!(v && String(v).trim()))
              .join(' ')
              .trim();

            return {
              id: x?.id ?? null,
              tipoTransaccion: x?.tipoTransaccion ?? null,
              monto: toMoney(x?.monto),
              latitud: x?.latitud ?? null,
              longitud: x?.longitud ?? null,
              fechaHora: x?.fechaHora ?? null,
              fhRegistro: x?.fhRegistro ?? null,
              numeroSerieMonedero: x?.numeroSerieMonedero ?? null,
              numeroSerieDispositivo: x?.numeroSerieDispositivo ?? null,
              pasajero: pasajero || 'sin registro',
            };
          });

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros,
          };
        } catch (error) {
          this.loading = false;
          console.error('[TRANSACCIONES] Error:', error);
          return { data: [], totalCount: 0 };
        }
      },
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }

    function toMoney(v: any): number | null {
      if (v === null || v === undefined) return null;
      const s = String(v)
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '');
      const n = Number(s);
      return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
    }
  }

  openTallerMapa(templateRef: any, row: any) {
    const lat = Number(row?.Lat ?? row?.lat ?? row?.LAT);
    const lng = Number(row?.Lng ?? row?.lng ?? row?.LNG);

    this.selectedTallerId = row?.Id ?? row?.id ?? null;
    this.selectedTallerNombre = row?.Nombre ?? row?.nombre ?? null;
    this.selectedTallerDireccion = row?.Direccion ?? row?.direccion ?? null;

    this.hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

    this.modalService.open(templateRef, {
      size: 'xl',
      windowClass: 'modal-holder',
      centered: true,
    });

    if (!this.hasLocation) return;

    const mapId = `map-${this.selectedTallerId}`;
    setTimeout(
      () =>
        this.initTallerMap(lat, lng, mapId, this.selectedTallerDireccion || ''),
      250
    );
  }

  private initTallerMap(
    lat: number,
    lng: number,
    mapId: string,
    direccion: string
  ) {
    const el = document.getElementById(mapId) as HTMLElement | null;
    if (!el) return;

    const center = { lat: Number(lat), lng: Number(lng) };
    const map = new google.maps.Map(el, {
      center,
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
    });

    const marker = new google.maps.Marker({
      position: center,
      map,
      title: 'Taller',
    });

    // MISMO ESTILO QUE RUTAS, título en AZUL y texto = dirección
    const info = new google.maps.InfoWindow({
      disableAutoPan: true,
      maxWidth: 280,
      content: `
      <div style="
        font-family:'Segoe UI',sans-serif;
        display:inline-block;
        background:#fff;
        border-radius:12px;
        box-shadow:0 4px 12px rgba(0,0,0,.12);
        padding:8px 12px 6px 12px;
        line-height:1.3;
        margin-top:-45px;
        max-width:240px;
        white-space:normal;
        overflow-wrap:break-word;
        word-wrap:break-word;
      ">
        <div style="font-size:14px;color:#2f2f2f;margin:0;">
          <span style="display:block;color:#1E88E5;font-weight:600;margin-bottom:4px;">
            Dirección del Taller
          </span>
          <span style="display:block;margin:0 0 2px 0;">
            ${direccion ? direccion : 'Sin dirección disponible'}
          </span>
        </div>
      </div>
    `,
    });

    google.maps.event.addListenerOnce(map, 'idle', () => {
      info.open({ map, anchor: marker });

      // Si el usuario cierra, volvemos a abrir para mantener el comportamiento de Rutas
      google.maps.event.addListener(info, 'closeclick', () => {
        info.open({ map, anchor: marker });
      });
    });
  }

  onGridOptionChanged(e: any) {
    if (e.fullName === 'searchPanel.text') {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaTalleres);
        return;
      }
      const search = this.filtroActivo.toLowerCase();
      const dataFiltrada = this.paginaActualData.filter(
        (item: any) =>
          (item.nombre && item.nombre.toLowerCase().includes(search)) ||
          (item.descripcion &&
            item.descripcion.toLowerCase().includes(search)) ||
          (item.modulo?.nombre &&
            item.modulo.nombre.toLowerCase().includes(search))
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

  centerModal(
    centerDataModal: any,
    id: number,
    latitud: string,
    longitud: string,
    fechaHora: string,
    monto: number,
    tipoTransaccion: any
  ) {
    this.selectedTransactionId = id;
    this.latSelect = latitud;
    this.lngSelect = longitud;
    this.selectedTransactionDate = fechaHora;
    this.selectedTransactionAmount = monto;
    this.selectedTipoTransaccion = tipoTransaccion;
    if (this.latSelect == null || this.latSelect == '') {
      this.showMap = true;
    } else {
      this.showMap = false;
    }
    this.modalService.open(centerDataModal, {
      centered: true,
      windowClass: 'modal-holder',
      backdrop: 'static',
      keyboard: false,
    });

    setTimeout(() => {
      this.initializeMap(latitud, longitud);
    }, 500);
  }

  private readonly markerIcon: google.maps.Icon = {
    url: new URL(
      'assets/images/icons8-marker-48.png',
      document.baseURI
    ).toString(),
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

  agregarTaller() {
    this.route.navigateByUrl('/talleres/agregar-taller');
  }
}
