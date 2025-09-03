import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.component.html',
  styleUrl: './lista-clientes.component.scss',
  animations: [fadeInUpAnimation],
})
export class ListaClientesComponent implements OnInit {

  isLoading: boolean = false;
  listaClientes: any[] = [];
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna";
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';

  constructor(private cliService: ClientesService, private route: Router) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerClientes()
  }

  agregarCliente() {
    this.route.navigateByUrl('/clientes/agregar-cliente')
  }

  obtenerClientes() {
    this.cliService.obtenerClientes().subscribe((response: any) => {
      this.listaClientes = response.map((cliente: any) => {
        return {
          ...cliente,
          NombreCompleto: `${cliente.Nombre || ''} ${cliente.ApellidoPaterno || ''} ${cliente.ApellidoMaterno || ''}`.trim(),
          DireccionCompleta: `${cliente.Estado || ''}, ${cliente.Municipio || ''}, ${cliente.Colonia || ''}, ${cliente.Calle || ''}${cliente.EntreCalles ? ' (Entre ' + cliente.EntreCalles + ')' : ''}, CP: ${cliente.CP || ''}`.replace(/, ,/g, ',').trim(),
          TipoPersona: cliente.TipoPersona === 1 ? 'Física' : 'Moral'
        };
      });
    });
  }

  actualizarCliente(idCliente: number) {
    this.route.navigateByUrl( '/clientes/editar-cliente/' + idCliente);
  };

  eliminarCliente(cliente: any) {
    Swal.fire({
      title: '¡Eliminar Cliente!',
      background: '#22252f',
      html: `¿Está seguro que desea eliminar el cliente: <br> ${cliente.NombreCompleto}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.cliService.eliminarCliente(cliente.Id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Eliminado!',
              background: '#22252f',
              html: `El cliente ha sido eliminado de forma exitosa.`,
              icon: 'success',
              showCancelButton: false,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.obtenerClientes();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              background: '#22252f',
              html: `Error al intentar eliminar el cliente.`,
              icon: 'error',
              showCancelButton: false,
            })
          }
        );
      }
    });
  }

}