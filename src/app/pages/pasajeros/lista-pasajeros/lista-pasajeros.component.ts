import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { PasajerosService } from 'src/app/shared/services/pasajeros.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-pasajeros',
  templateUrl: './lista-pasajeros.component.html',
  styleUrls: ['./lista-pasajeros.component.scss'],
  animations: [fadeInUpAnimation]
})
export class ListaPasajerosComponent implements OnInit {

  listaPasajeros: any[] = [];
  filteredPasajeros: any[] = [];
  paginatedPasajeros: any[] = [];
  searchTerm: string = '';
  startDate: string = '';
  endDate: string = '';
  pageSizeOptions: number[] = [10, 20, 50, 100];
  pageSize: number = 10;
  currentPage: number = 0;
  totalRecords: number = 0;
  totalPages: number = 0;
  isLoading: boolean = false;

  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna"
  public loading: boolean = false;
  public loadingMessage: string = 'Cargando...';

  constructor(private pasaService: PasajerosService, private route: Router) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerListaPasajeros();
  }

  obtenerListaPasajeros() {
    this.loading = true;
    this.pasaService.obtenerPasajeros().subscribe(
      (res: any) => {
        setTimeout(() => {
          this.loading = false;
        }, 2000)
        this.listaPasajeros = res.pasajeros.sort((a, b) => b.Id - a.Id);;
      },
      (error) => {
        console.error('Error al obtener pasajeros:', error);
        this.loading = false;
      }
    );
  }

  agregarPasajero() {
    this.route.navigateByUrl('/pasajeros/agregar-pasajero')
  }

  actualizarPasajero(idPasajero: number) {
    this.route.navigateByUrl('/pasajeros/editar-pasajero/' + idPasajero);
  };

  eliminarPasajero(pasajero: any) {
    Swal.fire({
      title: '¡Eliminar Pasajero!',
      background: '#22252f',
      html: `¿Está seguro que desea eliminar el pasajero: <br> ${pasajero.Nombre + ' ' + pasajero.ApellidoPaterno + ' ' + pasajero.ApellidoMaterno}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.pasaService.eliminarPasajero(pasajero.Id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Eliminado!',
              background: '#22252f',
              html: `El pasajero ha sido eliminado de forma exitosa.`,
              icon: 'success',
              showCancelButton: false,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.obtenerListaPasajeros();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              background: '#22252f',
              html: `Error al intentar eliminar el pasajero.`,
              icon: 'error',
              showCancelButton: false,
            })
          }
        );
      }
    });
  }


}
