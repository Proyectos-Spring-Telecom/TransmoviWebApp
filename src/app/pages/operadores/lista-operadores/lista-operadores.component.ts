import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
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

  listaOperadores: any;
  isLoading: boolean = false;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna";
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';

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
    this.listaOperadores = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = Number(loadOptions?.skip) || 0;
        const take = Number(loadOptions?.take) || this.pageSize;
        const page = Math.floor(skip / take) + 1;

        try {
          const response: any = await lastValueFrom(
            this.opService.obtenerOperadoresData(page, take)
          );

          this.loading = false;

          const totalRegistros = Number(response?.paginated?.total) || 0;
          const paginaActual = Number(response?.paginated?.page) || page;
          // Si "limit" es pageSize, usa "take" para calcular total de páginas
          const totalPaginas = take > 0 ? Math.ceil(totalRegistros / take) : 0;

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;

          const dataTransformada = (Array.isArray(response?.data) ? response.data : [])
            .map((item: any) => {
              // ⬇️ Forzamos id a number, contemplando variantes de nombre
              const idNum = Number(item?.id ?? item?.Id ?? item?.ID);
              return {
                ...item,
                id: Number.isFinite(idNum) ? idNum : 0, // asegura número válido
              };
            })
            // ⬇️ Ahora sí ordena de mayor a menor por id numérico
            .sort((a: any, b: any) => b.id - a.id);

          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };

        } catch (error) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', error);
          return { data: [], totalCount: 0 };
        }
      }
    });
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