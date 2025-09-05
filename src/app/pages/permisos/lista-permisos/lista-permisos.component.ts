import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { Permiso } from 'src/app/entities/Enums/permiso.enum';
import { PermisosService } from 'src/app/shared/services/permisos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-permisos',
  templateUrl: './lista-permisos.component.html',
  styleUrl: './lista-permisos.component.scss',
  animations: [fadeInUpAnimation]
})
export class ListaPermisosComponent implements OnInit {
  isLoading: boolean = false;
  public listaPermisos: any;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public permisoAgregarPermiso: string;

  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 10;
  public totalPaginas: number = 0;
  public data: string;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

  constructor(private permService:PermisosService, private route: Router, private permissionsService: NgxPermissionsService,) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit() {
    this.setupDataSource();
    // this.obtenerListaPermisos();
    this.obtenerPermmisos();
  }

  public get Permiso() {
    return Permiso;
  }

  obtenerPermmisos() {
    this.permisoAgregarPermiso = Permiso.CrearMonedero;
    const permisos = [
      this.permisoAgregarPermiso,
    ];
    this.permissionsService.loadPermissions(permisos);
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  setupDataSource() {
  this.loading = true;
  this.listaPermisos = new CustomStore({
    key: "id",
    load: async (loadOptions: any) => {
      const skipValue = Number(loadOptions?.skip) || 0;
      const takeValue = Number(loadOptions?.take) || this.pageSize; // Dx envía 'take'
      const page = Math.floor(skipValue / takeValue) + 1;

      try {
        const response: any = await lastValueFrom(
          this.permService.obtenerPermisos(page, takeValue)
        );

        this.loading = false;

        // === Mapeo según tu backend ===
        const totalPaginas   = Number(response?.paginated?.total) || 0; // total de páginas
        const totalRegistros = Number(response?.paginated?.limit) || 0; // total de registros
        const paginaActual   = Number(response?.paginated?.page)  || page;

        this.totalRegistros = totalRegistros;      // total de registros (para tu UI)
        this.paginaActual   = paginaActual;        // página actual
        this.totalPaginas   = totalPaginas;        // total de páginas (si lo muestras en tu UI)

        const dataTransformada = (Array.isArray(response?.data) ? response.data : []).map((item: any) => {
          return {
            ...item,
            // En tu respuesta viene 'Estatus' con mayúscula
            estatusTexto: Number(item?.Estatus) === 1 ? 'Activo' : 'Inactivo'
          };
        });

        this.paginaActualData = dataTransformada;

        // Importante: DevExtreme espera totalCount = TOTAL DE REGISTROS
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
        this.dataGrid.instance.option('dataSource', this.listaPermisos);
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
    console.log('Mostrar información del permiso con ID:', id);
  }

  agregarPermiso() {
    this.route.navigateByUrl('/permisos/agregar-permiso')
  }

  actualizarPermiso(idPermiso: number) {
    this.route.navigateByUrl('/permisos/editar-permiso/' + idPermiso);
  };

  eliminarPermiso(permiso: any) {
    Swal.fire({
      title: '¡Eliminar Permiso!',
      background: '#22252f',
      html: `¿Está seguro que desea eliminar el permiso: <br> ${permiso.Marca + ' ' + permiso.Modelo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.permService.eliminarPermiso(permiso.Id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Eliminado!',
              background: '#22252f',
              html: `El permiso ha sido eliminado de forma exitosa.`,
              icon: 'success',
              showCancelButton: false,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.setupDataSource();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              background: '#22252f',
              html: `Error al intentar eliminar el permiso.`,
              icon: 'error',
              showCancelButton: false,
            })
          }
        );
      }
    });
  }

  activar(rowData: any) {
    Swal.fire({
      title: 'Confirmar activación',
      text: `¿Desea activar el permiso: ${rowData.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.permService.updateEstatus(rowData.id).subscribe(
          (response) => {
            Swal.fire('¡Actualizado!', 'El permiso se ha activado correctamente.', 'success');
            this.setupDataSource();
          },
          (error) => {
            Swal.fire('¡Ops!', 'Error al intentar activar este permiso.', 'error');
          }
        );
      }
    });
  }

  desactivar(rowData: any) {
    Swal.fire({
      title: 'Confirmar desactivación',
      text: `¿Desea desactivar el permiso: ${rowData.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.permService.updateEstatus(rowData.id).subscribe(
          (response) => {
            Swal.fire('¡Actualizado!', 'El permiso se ha desactivado correctamente.', 'success');
            this.setupDataSource();
          },
          (error) => {
            Swal.fire('¡Ops!', 'Error al intentar desactivar este permiso.', 'error');
          }
        );
      }
    });
    // console.log('Desactivar:', rowData);
  }
}
