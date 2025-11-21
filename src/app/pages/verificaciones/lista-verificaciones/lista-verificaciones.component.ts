import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import { VerificacionesService } from 'src/app/shared/services/verificaciones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-usuarios',
  templateUrl: './lista-verificaciones.component.html',
  styleUrl: './lista-verificaciones.component.scss',
  animations: [fadeInUpAnimation]
})
export class ListaVerificacionesComponent implements OnInit {

  isLoading: boolean = false;
  listaVerificaciones: any;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna";
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  public registros: any[] = [];
  public showCliente: any

  constructor(private verService: VerificacionesService, private route: Router, private permissionsService: NgxPermissionsService,
    private users: AuthenticationService,
  ) {
    const user = this.users.getUser();
    this.showFilterRow = true;
    this.showHeaderFilter = true;

    // true solo cuando el nombre del rol sea 'SA'
    this.showCliente = user?.rol?.nombre === 'SA';
  }

  ngOnInit(): void {
    this.setupDataSource()
  }

  agregarVerificacion() {
    this.route.navigateByUrl('/verificaciones/agregar-verificacion')
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  onGridOptionChanged(e: any) {
    if (e.fullName !== 'searchPanel.text') return;

    const grid = this.dataGrid?.instance;
    const qRaw = (e.value ?? '').toString().trim();
    if (!qRaw) {
      this.filtroActivo = '';
      grid?.option('dataSource', this.listaVerificaciones);
      return;
    }
    this.filtroActivo = qRaw;

    const norm = (v: any) =>
      (v == null ? '' : String(v))
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();

    const q = norm(qRaw);

    let columnas: any[] = [];
    try {
      const colsOpt = grid?.option('columns');
      if (Array.isArray(colsOpt) && colsOpt.length) columnas = colsOpt;
    } catch { }
    if (!columnas.length && grid?.getVisibleColumns) {
      columnas = grid.getVisibleColumns();
    }

    const dataFields: string[] = columnas
      .map((c: any) => c?.dataField)
      .filter((df: any) => typeof df === 'string' && df.trim().length > 0);

    const getByPath = (obj: any, path: string) =>
      !obj || !path ? undefined : path.split('.').reduce((acc, k) => acc?.[k], obj);

    let qStatusNum: number | null = null;
    if (q === '1' || q === 'Activo') qStatusNum = 1;
    else if (q === '0' || q === 'Inactivo') qStatusNum = 0;

    const dataFiltrada = (this.paginaActualData || []).filter((row: any) => {
      const hitCols = dataFields.some((df) => norm(getByPath(row, df)).includes(q));

      const estNum = Number(row?.Estatus ?? row?.estatus);
      const estHit =
        Number.isFinite(estNum) &&
        (qStatusNum !== null ? estNum === qStatusNum : String(estNum).toLowerCase().includes(q));

      const hitExtras = [
        norm(row?.Id),
        norm(row?.id),
        norm(row?.NombreCompleto),
        norm(row?.UserName),
        norm(row?.Telefono),
        norm(row?.RolNombre)
      ].some((s) => s.includes(q));

      return hitCols || estHit || hitExtras;
    });

    grid?.option('dataSource', dataFiltrada);
  }

  setupDataSource() {
    this.loading = true;
    this.listaVerificaciones = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skipValue = Number(loadOptions?.skip) || 0;
        const takeValue = Number(loadOptions?.take) || this.pageSize;
        const page = Math.floor(skipValue / takeValue) + 1;
        try {
          const response: any = await lastValueFrom(
            this.verService.obtenerVerificacionesData(page, takeValue)
          );
          this.loading = false;
          const totalPaginas = Number(response?.paginated?.limit) || 0;
          const totalRegistros = Number(response?.paginated?.total) || 0;
          const paginaActual = Number(response?.paginated?.page) || page;

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;

          const dataTransformada = (Array.isArray(response?.data) ? response.data : []).map((item: any) => {
            const nombreCliente = [
              item?.cliente?.nombre || '',
              item?.cliente?.apellidoPaterno || '',
              item?.cliente?.apellidoMaterno || ''
            ].filter(Boolean).join(' ');

            return {
              ...item,
              id: item.id,
              clienteNombre: nombreCliente
            };
          });

          dataTransformada.sort((a, b) => b.id - a.id);
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (error) {
          this.loading = false;
          return { data: [], totalCount: 0 };
        }
      }
    });
  }


  toNum(v: any): number {
    const n = Number((v ?? '').toString().trim());
    return Number.isFinite(n) ? n : 0;
  }

  actualizarVerificacion(idVerificacion: number) {
    console.log(idVerificacion)
    this.route.navigateByUrl('/verificaciones/editar-verificacion/' + idVerificacion);
  };


  eliminarUsuario(usuario: any) {
    Swal.fire({
      title: '¡Eliminar Usuario!',
      background: '#002136',
      html: `¿Está seguro que requiere eliminar el usuario: <br> ${usuario.NombreCompleto}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.verService.eliminarVerificacion(usuario.Id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Eliminado!',
              background: '#002136',
              html: `El usuario ha sido eliminado de forma exitosa.`,
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
              background: '#002136',
              html: `Error al intentar eliminar el usuario.`,
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
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar este servicio vehicular?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.verService.activarVerificacion(rowData.id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El servicio de verificación ha sido activada.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            this.dataGrid.instance.refresh();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: `${error}`,
              icon: 'error',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        );
      }
    });
  }

  desactivar(rowData: any) {
    Swal.fire({
      title: '¡Desactivar!',
      html: `¿Está seguro que requiere desactivar este servicio vehicular?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.verService.desactivarVerificacion(rowData.id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El servicio vehicular ha sido desactivada.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            this.dataGrid.instance.refresh();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: `${error}`,
              icon: 'error',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        );
      }
    });
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }
}