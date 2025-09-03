import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  listaUsuarios: any[] = [];
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna";
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';

  constructor(private usuService: UsuariosService, private route: Router) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerUsuarioss()
  }

  agregarUsuario() {
    this.route.navigateByUrl('/usuarios/agregar-usuario')
  }

  obtenerUsuarioss() {
    this.usuService.obtenerUsuarios().subscribe((response: any) => {
      this.listaUsuarios = response.users.map((usuario: any) => {
        return {
          ...usuario,
          NombreCompleto: `${usuario.Nombre || ''} ${usuario.ApellidoPaterno || ''} ${usuario.ApellidoMaterno || ''}`.trim(),
        };
      });
    });
  }

  actualizarUsuario(idUsuario: number) {
    this.route.navigateByUrl('/usuarios/editar-usuario/' + idUsuario);
  };

  eliminarUsuario(usuario: any) {
    Swal.fire({
      title: '¡Eliminar Usuario!',
      background: '#22252f',
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
              background: '#22252f',
              html: `El usuario ha sido eliminado de forma exitosa.`,
              icon: 'success',
              showCancelButton: false,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.obtenerUsuarioss();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              background: '#22252f',
              html: `Error al intentar eliminar el usuario.`,
              icon: 'error',
              showCancelButton: false,
            })
          }
        );
      }
    });
  }
}