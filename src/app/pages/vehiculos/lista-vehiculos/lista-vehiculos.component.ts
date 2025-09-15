import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { VehiculosService } from 'src/app/shared/services/vehiculos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-vehiculos',
  templateUrl: './lista-vehiculos.component.html',
  styleUrls: ['./lista-vehiculos.component.scss'],
  animations: [fadeInUpAnimation],
})

export class ListaVehiculosComponent implements OnInit {
  isLoading: boolean = false;
  listaVehiculos: any;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public paginaActual: number = 1;
    public totalRegistros: number = 0;
    public pageSize: number = 20;
    public totalPaginas: number = 0;
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
    public autoExpandAllGroups: boolean = true;
    isGrouped: boolean = false;
    public paginaActualData: any[] = [];
    public filtroActivo: string = '';

  constructor(private vehiService: VehiculosService, private route: Router) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.setupDataSource();
  }

  setupDataSource() {
    this.loading = true;
  
    this.listaVehiculos = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        // DevExtreme manda estos valores cuando usas remote paging
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;
  
        try {
          const resp: any = await lastValueFrom(
            this.vehiService.obtenerVehiculosData(page, take)
          );
  
          this.loading = false;
  
          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
  
          // ---- Manejo robusto de la meta de paginación ----
          const meta = resp?.paginated || {};
          const totalRegistros =
            toNum(meta.total) ??
            toNum(resp?.total) ??
            rows.length;
  
          const paginaActual =
            toNum(meta.page) ??
            toNum(resp?.page) ??
            page;
  
          const totalPaginas =
            toNum(meta.lastPage) ??
            toNum(resp?.pages) ??
            Math.max(1, Math.ceil(totalRegistros / take));
          // --------------------------------------------------
  
          const dataTransformada = rows.map((item: any) => ({
            ...item,
            estatusTexto:
              item?.estatus === 1 ? 'Activo' :
              item?.estatus === 0 ? 'Inactivo' : null
          }));
  
          // Si llevas estos contadores en el componente:
          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;
  
          return {
            data: dataTransformada,
            totalCount: totalRegistros // <- IMPORTANTE para que el grid pagine bien
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
          return { data: [], totalCount: 0 };
        }
      }
    });
  
    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  }
  
  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }
  
    onGridOptionChanged(e: any) {
      if (e.fullName === "searchPanel.text") {
        this.filtroActivo = e.value || '';
        if (!this.filtroActivo) {
          this.dataGrid.instance.option('dataSource', this.listaVehiculos);
          return;
        }
        const search = this.filtroActivo.toString().toLowerCase();
        const dataFiltrada = this.paginaActualData.filter((item: any) => {
          const idStr = item.id ? item.id.toString().toLowerCase() : '';
          const nombreStr = item.nombre ? item.nombre.toString().toLowerCase() : '';
          const descripcionStr = item.descripcion ? item.descripcion.toString().toLowerCase() : '';
          const moduloStr = item.estatusTexto ? item.estatusTexto.toString().toLowerCase() : '';
          return (
            nombreStr.includes(search) ||
            descripcionStr.includes(search) ||
            moduloStr.includes(search) ||
            idStr.includes(search)
          );
        });
        this.dataGrid.instance.option('dataSource', dataFiltrada);
      }
    }

  showInfo(id: any): void {
    console.log('Mostrar información del vehículo con ID:', id);
  }

  agregarVehiculo() {
    this.route.navigateByUrl('/vehiculos/agregar-vehiculo')
  }

  actualizarVehiculo(idVehiculo: number) {
    this.route.navigateByUrl('/vehiculos/editar-vehiculo/' + idVehiculo);
  };

  
    activar(rowData: any) {
      Swal.fire({
        title: '¡Activar!',
        html: `¿Está seguro que desea activar el vehículo: <strong>${rowData.marca} ${rowData.modelo}</strong>?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        background: '#002136',
      }).then((result) => {
        if (result.value) {
          this.vehiService.updateEstatus(rowData.id, 1).subscribe(
            (response) => {
              Swal.fire({
                title: '¡Confirmación Realizada!',
                html: `El vehículo ha sido activado.`,
                icon: 'success',
                background: '#002136',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Confirmar',
              })
  
              this.setupDataSource();
              this.dataGrid.instance.refresh();
              // this.obtenerListaModulos();
            },
            (error) => {
              Swal.fire({
                title: '¡Ops!',
                html: `${error}`,
                icon: 'error',
                background: '#002136',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Confirmar',
              })
            }
          );
        }
      });
    }
  
    desactivar(rowData: any) {
      Swal.fire({
        title: '¡Desactivar!',
        html: `¿Está seguro que requiere dar de baja el vehículo: <strong>${rowData.marca} ${rowData.modelo}</strong>?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        background: '#002136',
      }).then((result) => {
        if (result.value) {
          this.vehiService.updateEstatus(rowData.id, 0).subscribe(
            (response) => {
              Swal.fire({
                title: '¡Confirmación Realizada!',
                html: `El vehículo ha sido desactivado.`,
                icon: 'success',
                background: '#002136',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Confirmar',
              })
              this.setupDataSource();
              this.dataGrid.instance.refresh();
              // this.obtenerListaModulos();
            },
            (error) => {
              Swal.fire({
                title: '¡Ops!',
                html: `${error}`,
                icon: 'error',
                background: '#002136',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Confirmar',
              })
            }
          );
        }
      });
      // console.log('Desactivar:', rowData);
    }

}
