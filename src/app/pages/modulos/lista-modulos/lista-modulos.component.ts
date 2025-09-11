import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { forkJoin, lastValueFrom, map, of, switchMap } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { Permiso } from 'src/app/entities/Enums/permiso.enum';
import { ModulosService } from 'src/app/shared/services/modulos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-modulos',
  templateUrl: './lista-modulos.component.html',
  styleUrl: './lista-modulos.component.scss',
  animations: [fadeInUpAnimation],
})
export class ListaModulosComponent {
  public permisoConsultarModulo: string;
  public permisoAgregarModulo: string;
  public permisoActualizarModulo: string;
  public permisoEliminarModulo: string;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public listaModulos: any;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public showExportGrid: boolean;
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';


  constructor(
    private router: Router,
    private moduloService: ModulosService,
    private permissionsService: NgxPermissionsService,
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit() {
    this.setupDataSource();
    // this.obtenerListaModulos();
    this.obtenerPermisos();
  }

  public get Permiso() {
    return Permiso;
  }

  obtenerPermisos() {
    this.permisoAgregarModulo = Permiso.AgregarModulo;

    const permisos = [
      this.permisoAgregarModulo,
    ];

    this.permissionsService.loadPermissions(permisos);
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }
  obtenerListaModulos() {
    this.loading = true;
    this.moduloService.obtenerModulos().subscribe((response: any[]) => {
      this.loading = false;
      this.listaModulos = response;
    });
  }

  agregarModulo() {
    this.router.navigateByUrl('/modulos/agregar-modulo');
  }

  actualizarModulo(idModulo: Number) {
    this.router.navigateByUrl('/modulos/editar-modulo/' + idModulo);
  }

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que desea activar el módulo: <strong>${rowData.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.moduloService.updateEstatus(rowData.id, 1).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El módulo ha sido activado.`,
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
      html: `¿Está seguro que requiere dar de baja el módulo: <strong>${rowData.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.moduloService.updateEstatus(rowData.id, 0).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El módulo ha sido desactivado.`,
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

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  setupDataSource() {
    this.loading = true;
    this.listaModulos = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = this.pageSize;
        const skip = loadOptions?.skip ?? 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.moduloService.obtenerModuloData(page, take)
          );
          this.loading = false;

          const rows = Array.isArray(resp?.data) ? resp.data : [];

          const totalRegistros =
            Number(resp?.paginated?.limit) ?? rows.length;
          const paginaActual =
            Number(resp?.paginated?.page) ?? page;
          const totalPaginas =
            Number(resp?.paginated?.total) 
            ?? Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((item: any) => ({
            ...item,
            estatusTexto: item.estatus === 1 ? 'Activo' : 'Inactivo'
          }));

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
          return { data: [], totalCount: 0 };
        }
      }
    });
  }

  onGridOptionChanged(e: any) {
    if (e.fullName === "searchPanel.text") {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaModulos);
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

  toggleExpandGroups() {
    const groupedColumns = this.dataGrid.instance
      .getVisibleColumns()
      .filter((col) => col.groupIndex >= 0);
    if (groupedColumns.length === 0) {
      Swal.fire({
        title: '¡Ops!',
        text: 'Debes arrastar un encabezado de una columna para expandir o contraer grupos.',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
      });
    } else {
      this.autoExpandAllGroups = !this.autoExpandAllGroups;
      this.dataGrid.instance.refresh();
    }
  }

  limpiarCampos() {
    this.dataGrid.instance.clearGrouping();
    this.dataGrid.instance.pageIndex(0);
    this.dataGrid.instance.refresh();
    this.isGrouped = false;
  }
}
