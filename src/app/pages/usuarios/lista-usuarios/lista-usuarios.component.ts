import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.component.html',
  styleUrl: './lista-usuarios.component.scss',
  animations: [fadeInUpAnimation]
})
export class ListaUsuariosComponent implements OnInit {

  isLoading: boolean = false;
  listaUsuarios: any;
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

  constructor(private usuService: UsuariosService, private route: Router, private permissionsService: NgxPermissionsService,) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.setupDataSource()
  }

  agregarUsuario() {
    this.route.navigateByUrl('/usuarios/agregar-usuario')
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
        this.dataGrid.instance.option('dataSource', this.listaUsuarios);
        return;
      }
      const search = this.filtroActivo.toString().toLowerCase();

      const dataFiltrada = this.registros.filter((item: any) => {
        let fullName = '';
        fullName = fullName.toLowerCase();
        const userNameStr = item.userName ? item.userName.toString().toLowerCase() : '';
        const telefonoStr = item.telefono ? item.telefono.toString().toLowerCase() : '';
        const rolStr = item.rol && item.rol.nombre ? item.rol.nombre.toString().toLowerCase() : '';
        let estatusStr = '';
        if (item.estatus === 1) estatusStr = 'activo';
        else if (item.estatus === 0) estatusStr = 'inactivo';
        else estatusStr = 'root';
        const cadenaStr = (item.cadena && item.cadena.nombre) ?
          item.cadena.nombre.toString().toLowerCase() :
          'sin asignación';
        const idStr = item.id ? item.id.toString().toLowerCase() : '';
        return (
          fullName.includes(search) ||
          userNameStr.includes(search) ||
          telefonoStr.includes(search) ||
          rolStr.includes(search) ||
          estatusStr.includes(search) ||
          cadenaStr.includes(search) ||
          idStr.includes(search)
        );
      });
      this.dataGrid.instance.option('dataSource', dataFiltrada);
    }
  }

  setupDataSource() {
    this.loading = true;
    this.listaUsuarios = new CustomStore({
      key: "id",
      load: async (loadOptions: any) => {
        const skipValue = Number(loadOptions?.skip) || 0;
        const takeValue = Number(loadOptions?.take) || this.pageSize;
        const page = Math.floor(skipValue / takeValue) + 1;
        try {
          const response: any = await lastValueFrom(
            this.usuService.obtenerUsuariosData(page, takeValue)
          );
          this.loading = false;
          const totalPaginas = Number(response?.paginated?.limit) || 0;
          const totalRegistros = Number(response?.paginated?.total) || 0;
          const paginaActual = Number(response?.paginated?.page) || page;

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;

          let dataTransformada = (Array.isArray(response?.data) ? response.data : []).map((item: any) => {
            const nombre = item?.Nombre || '';
            const paterno = item?.ApellidoPaterno || '';
            const materno = item?.ApellidoMaterno || '';

            return {
              ...item,
              id: Number(item?.Id),
              idRol: Number(item?.IdRol),
              idCliente: Number(item?.IdCliente),


              NombreCompleto: [nombre, paterno, materno].filter(Boolean).join(' ')
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

  actualizarUsuario(idUsuario: number) {
    this.route.navigateByUrl('/usuarios/editar-usuario/' + idUsuario);
  };

  eliminarUsuario(usuario: any) {
    Swal.fire({
      title: '¡Eliminar Usuario!',
      background: '#002136',
      html: `¿Está seguro que desea eliminar el usuario: <br> ${usuario.NombreCompleto}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.usuService.eliminarUsuario(usuario.Id).subscribe(
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
      html: `¿Está seguro que desea activar el usuario: <br> <strong>${rowData.NombreCompleto}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.usuService.updateEstatus(rowData.id, 1).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El usuario ha sido activado.`,
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
      html: `¿Está seguro que requiere dar de baja el usuario:<br> <strong>${rowData.NombreCompleto}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.usuService.updateEstatus(rowData.id, 0).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El usuario ha sido desactivado.`,
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

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }
}