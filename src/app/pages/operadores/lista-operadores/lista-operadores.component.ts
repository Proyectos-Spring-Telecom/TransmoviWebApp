import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-operadores',
  templateUrl: './lista-operadores.component.html',
  styleUrls: ['./lista-operadores.component.scss'],
  animations: [fadeInUpAnimation]
})

export class ListaOperadoresComponent implements OnInit {

  listaOperadores: any[] = [];
  isLoading: boolean = false;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna";
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';

  constructor(
    private opService: OperadoresService,
    private route: Router
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerOperadores();
  }

  agregarOperador() {
    this.route.navigateByUrl('/operadores/agregar-operador')
  }

  obtenerOperadores() {
    this.loading = true;
    this.opService.obtenerOperadores().subscribe(
      (res: any) => {
        setTimeout(() => {
          this.loading = false;
        }, 2000)
        this.listaOperadores = res.operadores
        .map(op => ({
          ...op,
          FechaNacimiento: op.FechaNacimiento 
            ? op.FechaNacimiento.split('T')[0] 
            : ''
        }))
        .sort((a, b) => b.Id - a.Id);
      },
      (error) => {
        console.error('Error al obtener operadores:', error);
        this.loading = false;
      }
    );
  }

  actualizarOperador(idOperador: number) {
    this.route.navigateByUrl('/operadores/editar-operador/' + idOperador);
  };

  eliminarOperador(operador: any) {
    Swal.fire({
      title: '¡Eliminar Operador!',
      background: '#22252f',
      html: `¿Está seguro que desea eliminar el operador: <br> ${operador.Nombre + ' ' + operador.ApellidoPaterno + ' ' + operador.ApellidoMaterno}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.opService.eliminarOperador(operador.Id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Eliminado!',
              background: '#22252f',
              html: `El operador ha sido eliminado de forma exitosa.`,
              icon: 'success',
              showCancelButton: false,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.obtenerOperadores();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              background: '#22252f',
              html: `Error al intentar eliminar el operador.`,
              icon: 'error',
              showCancelButton: false,
            })
          }
        );
      }
    });
  }
}