import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  listaVehiculos: any[] = [];
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';

  constructor(private vehiService: VehiculosService, private route: Router) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerVehiculos();
  }

  obtenerVehiculos() {
    this.loading = true;
    this.vehiService.obtenerVehiculos().subscribe(
      (res: any) => {
        if (Array.isArray(res.vehiculos)) {
          this.listaVehiculos = res.vehiculos.sort((a, b) => b.Id - a.Id);;
        } else {
          console.error('El formato de datos recibido no es el esperado.');
        }
        setTimeout(() => {
          this.loading = false;
        }, 2000)
      },
      (error) => {
        console.error('Error al obtener vehículos:', error);
        this.loading = false;
      }
    );
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

  eliminarVehiculo(vehiculo: any) {
    Swal.fire({
      title: '¡Eliminar Vehículo!',
      background: '#22252f',
      html: `¿Está seguro que desea eliminar el vehículo: <br> ${vehiculo.Marca + ' ' + vehiculo.Modelo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.vehiService.eliminarVehiculo(vehiculo.Id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Eliminado!',
              background: '#22252f',
              html: `El vehículo ha sido eliminado de forma exitosa.`,
              icon: 'success',
              showCancelButton: false,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.obtenerVehiculos();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              background: '#22252f',
              html: `Error al intentar eliminar el vehículo.`,
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
      text: `¿Desea activar el vehículo: ${rowData.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.vehiService.updateEstatus(rowData.id).subscribe(
          (response) => {
            Swal.fire('¡Actualizado!', 'El vehículo se ha activado correctamente.', 'success');
            this.obtenerVehiculos();
          },
          (error) => {
            Swal.fire('¡Ops!', 'Error al intentar activar este vehículo.', 'error');
          }
        );
      }
    });
  }

  desactivar(rowData: any) {
    Swal.fire({
      title: 'Confirmar desactivación',
      text: `¿Desea desactivar el vehículo: ${rowData.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.vehiService.updateEstatus(rowData.id).subscribe(
          (response) => {
            Swal.fire('¡Actualizado!', 'El vehículo se ha desactivado correctamente.', 'success');
            this.obtenerVehiculos();
          },
          (error) => {
            Swal.fire('¡Ops!', 'Error al intentar desactivar este vehículo.', 'error');
          }
        );
      }
    });
    // console.log('Desactivar:', rowData);
  }
}
