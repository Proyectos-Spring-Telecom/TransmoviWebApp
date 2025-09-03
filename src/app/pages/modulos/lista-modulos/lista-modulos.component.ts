import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
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
  isLoading: boolean = false;
  listaModulos: any[] = [];
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public permisoAgregarModulo: string;

  constructor(
    private moduService: ModulosService,
    private route: Router,
    private permissionsService: NgxPermissionsService
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit() {
    this.obtenerModulo();
    this.obtenerPermmisos();
  }

  public get Permiso() {
    return Permiso;
  }

  obtenerPermmisos() {
    this.permisoAgregarModulo = Permiso.CrearMonedero;
    const permisos = [this.permisoAgregarModulo];
    this.permissionsService.loadPermissions(permisos);
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  obtenerModulo() {
    this.loading = true;
    this.moduService.obtenerModulos().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res)
          ? res
          : Array.isArray(res?.modulos)
          ? res.modulos
          : [];
        this.listaModulos = data
          .map((m: any) => ({
            id: Number(m.id ?? m.Id ?? 0),
            nombre: m.nombre ?? m.Nombre ?? '',
            descripcion: m.descripcion ?? m.Descripcion ?? '',
            estatus: m.estatus ?? m.Estatus ?? null,
            permisos: m.permisos ?? m.Permisos ?? [],
          }))
          .sort((a, b) => b.id - a.id);

        this.loading = false;
      },
      error: (error) => {
        console.error('Error al obtener modulos:', error);
        this.loading = false;
      },
    });
  }

  showInfo(id: any): void {
    console.log('Mostrar información del modulo con ID:', id);
  }

  agregarModulo() {
    this.route.navigateByUrl('/modulos/agregar-modulo');
  }

  actualizarModulo(idModulo: number) {
    this.route.navigateByUrl('/modulos/editar-modulo/' + idModulo);
  }

  eliminarPermiso(modulo: any) {
    Swal.fire({
      title: '¡Eliminar Módulo!',
      background: '#22252f',
      html: `¿Está seguro que desea eliminar el modulo: <br> ${
        modulo.Marca + ' ' + modulo.Modelo
      }?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.moduService.eliminarModulo(modulo.Id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Eliminado!',
              background: '#22252f',
              html: `El módulo ha sido eliminado de forma exitosa.`,
              icon: 'success',
              showCancelButton: false,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.obtenerModulo();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              background: '#22252f',
              html: `Error al intentar eliminar el módulo.`,
              icon: 'error',
              showCancelButton: false,
            });
          }
        );
      }
    });
  }

  activar(rowData: any) {
    Swal.fire({
      title: 'Confirmar activación',
      text: `¿Desea activar el módulo: ${rowData.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.moduService.updateEstatus(rowData.id).subscribe(
          (response) => {
            Swal.fire(
              '¡Actualizado!',
              'El módulo se ha activado correctamente.',
              'success'
            );
            this.obtenerModulo();
          },
          (error) => {
            Swal.fire(
              '¡Ops!',
              'Error al intentar activar este módulo.',
              'error'
            );
          }
        );
      }
    });
  }

  desactivar(rowData: any) {
    Swal.fire({
      title: 'Confirmar desactivación',
      text: `¿Desea desactivar el módulo: ${rowData.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.moduService.updateEstatus(rowData.id).subscribe(
          (response) => {
            Swal.fire(
              '¡Actualizado!',
              'El módulo se ha desactivado correctamente.',
              'success'
            );
            this.obtenerModulo();
          },
          (error) => {
            Swal.fire(
              '¡Ops!',
              'Error al intentar desactivar este módulo.',
              'error'
            );
          }
        );
      }
    });
    // console.log('Desactivar:', rowData);
  }
}
