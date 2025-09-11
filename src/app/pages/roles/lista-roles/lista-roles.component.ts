import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { forkJoin, lastValueFrom, map, of, switchMap } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { Permiso } from 'src/app/entities/Enums/permiso.enum';
import { RolesService } from 'src/app/shared/services/roles.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-roles',
  templateUrl: './lista-roles.component.html',
  styleUrl: './lista-roles.component.scss',
  animations: [fadeInUpAnimation],
})
export class ListaRolesComponent implements OnInit {
  public permisoConsultarRol: string;
  public permisoAgregarRol: string;
  public permisoActualizarRol: string;
  public permisoEliminarRol: string;
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public listaRoles: any;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public showExportGrid: boolean;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';


  constructor(
    private router: Router,
    private permissionsService: NgxPermissionsService,
    private rolService: RolesService
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit() {
    this.setupDataSource();
    // this.obtenerlistaRoles();
    this.obtenerPermisos();
  }

  public get Permiso() {
    return Permiso;
  }

  obtenerPermisos() {
    this.permisoAgregarRol = Permiso.AgregarModulo;

    const permisos = [
      this.permisoAgregarRol,
    ];

    this.permissionsService.loadPermissions(permisos);
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }
  obtenerlistaRoles() {
    this.loading = true;
    this.rolService.obtenerRoles().subscribe((response: any[]) => {
      this.loading = false;
      this.listaRoles = response;
    });
  }

  agregarRol() {
    this.router.navigateByUrl('/roles/agregar-rol');
  }

  actualizarRol(idRol: Number) {
    this.router.navigateByUrl('/roles/editar-rol/' + idRol);
  }

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que desea activar el rol: <strong>${rowData.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.rolService.updateEstatus(rowData.id, 1).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El rol ha sido activado.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })

            this.setupDataSource();
            this.dataGrid.instance.refresh();
            // this.obtenerlistaRoles();
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
      html: `¿Está seguro que requiere dar de baja el rol: <strong>${rowData.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.rolService.updateEstatus(rowData.id, 0).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El rol ha sido desactivado.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.setupDataSource();
            this.dataGrid.instance.refresh();
            // this.obtenerlistaRoles();
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

    this.listaRoles = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = this.pageSize;
        const skip = loadOptions?.skip ?? 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.rolService.obtenerRolesData(page, take)
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
        this.dataGrid.instance.option('dataSource', this.listaRoles);
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
