import { Component, OnInit, ViewChild } from '@angular/core';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { Router } from '@angular/router';

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
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

  constructor(
    private tranService: TransaccionesService,
    private modalService: NgbModal,
    private route: Router
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerTransacciones();
  }

  obtenerTransacciones() {
    this.loading = true;
    this.listaTransacciones = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = Number(loadOptions?.skip) || 0;
        const take = Number(loadOptions?.take) || this.pageSize;
        const page = Math.floor(skip / take) + 1;

        try {
          const response: any = await lastValueFrom(
            this.tranService.obtenerTransaccionesData(page, take)
          );
          this.loading = false;
          const totalRegistros = Number(response?.paginated?.total) || 0;
          const paginaActual = Number(response?.paginated?.page) || page;
          const totalPaginas = take > 0 ? Math.ceil(totalRegistros / take) : 0;

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;

          const dataTransformada = (Array.isArray(response?.data) ? response.data : [])
            .map((item: any) => {
              const idNum = Number(item?.id ?? item?.Id ?? item?.ID);
              return {
                ...item,
                id: Number.isFinite(idNum) ? idNum : 0,
              };
            })
            .sort((a: any, b: any) => b.id - a.id);

          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };

        } catch (error) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', error);
          return { data: [], totalCount: 0 };
        }
      }
    });
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

  centerModal(centerDataModal: any, id: number, latitud: string, longitud: string, fechaHora: string, monto: number, tipoTransaccion: any) {
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
      centered: true, windowClass: 'modal-holder',
      backdrop: 'static',
      keyboard: false,
    });

    setTimeout(() => {
      this.initializeMap(latitud, longitud);
    }, 500);
  }

  initializeMap(lat: string, lng: string) {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
      const map = new google.maps.Map(mapElement, {
        center: location,
        zoom: 15
      });

      new google.maps.Marker({
        position: location,
        map: map
      });
    }
  }

  cerrarModal(modal: any) {
    modal.close('Modal cerrado por nuevo método');
  }

  agregarTransaccion() {
    this.route.navigateByUrl('/transacciones/agregar-transaccion')
  }
}