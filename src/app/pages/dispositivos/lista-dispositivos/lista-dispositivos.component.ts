import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-dispositivos',
  templateUrl: './lista-dispositivos.component.html',
  styleUrls: ['./lista-dispositivos.component.scss'],
  animations: [fadeInUpAnimation]
})
export class ListaDispositivosComponent implements OnInit {
  
  isLoading: boolean = false;
  listaDispositivos: any[] = [];
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna";
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';

  constructor(private disposService: DispositivosService, private route: Router) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerDispositivos();
  }

  obtenerDispositivos() {
    this.loading = true;
    this.disposService.obtenerDispositivos().subscribe(
      (res: any) => {
        setTimeout(()=> {
          this.loading = false;
        },2000)
        if (Array.isArray(res.dispositivos)) {
          this.listaDispositivos = res.dispositivos.sort((a, b) => b.Id - a.Id);
        } else {
          console.error('El formato de datos recibido no es el esperado.');
        }
      },
      (error) => {
        this.loading = false;
        console.error('Error al obtener dispositivos:', error);
      }
    );
  }

  showInfo(id: any): void {
    console.log('Mostrar información del dispositivo con ID:', id);
  }

  agregarDispositivo(){
    this.route.navigateByUrl('/dispositivos/agregar-dispositivo')
  }

  actualizarDispositivo(idDispositivo: number) {
      this.route.navigateByUrl( '/dispositivos/editar-dispositivo/' + idDispositivo);
    };
  
    eliminarDispositivo(dispositivo: any) {
      Swal.fire({
        title: '¡Eliminar Dispositivo!',
        background: '#22252f',
        html: `¿Está seguro que desea eliminar el dispositivo: <br> ${dispositivo.Marca + ' ' + dispositivo.Modelo}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.value) {
          this.disposService.eliminarDispositivo(dispositivo.Id).subscribe(
            (response) => {
              Swal.fire({
                title: '¡Eliminado!',
                background: '#22252f',
                html: `El dispositivo ha sido eliminado de forma exitosa.`,
                icon: 'success',
                showCancelButton: false,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Confirmar',
              })
              this.obtenerDispositivos();
            },
            (error) => {
              Swal.fire({
                title: '¡Ops!',
                background: '#22252f',
                html: `Error al intentar eliminar el dispositivo.`,
                icon: 'error',
                showCancelButton: false,
              })
            }
          );
        }
      });
    }
}