import { Component, OnInit } from '@angular/core';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { BitacoraService } from 'src/app/shared/services/bitacora.service';

@Component({
  selector: 'app-lista-bitacora',
  templateUrl: './lista-bitacora.component.html',
  styleUrls: ['./lista-bitacora.component.scss'],
  animations: [fadeInUpAnimation],
})
export class ListaBitacoraComponent implements OnInit {
  public bitacoraList: any[] = [];
  public filteredBitacora: any[] = [];
  public paginatedBitacora: any[] = [];
  public searchTerm: string = '';
  public startDate: string = '';
  public endDate: string = '';
  public pageSizeOptions: number[] = [10, 20, 50, 100];
  public pageSize: number = 10;
  public currentPage: number = 0;
  public totalRecords: number = 0;
  public totalPages: number = 0;
  public isLoading: boolean = false;
  public grid: boolean = true;
  public showHeaderFilter: boolean;
  public showFilterRow: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean = false;
  public loadingMessage: string = 'Cargando...';

  constructor(private bitacoraService: BitacoraService) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerBitacora();
  }

  obtenerBitacora(): void {
    this.loading = true;
    this.bitacoraService.obtenerBitacora().subscribe(
      (res: any) => {
        this.bitacoraList = res.bitacora.sort((a: any, b: any) => {
          const fechaA = new Date(a.Fecha).getTime();
          const fechaB = new Date(b.Fecha).getTime();
          return fechaB - fechaA;
        });
        setTimeout(()=> {
          this.loading = false;
        },2000)
      },
      (error) => {
        console.error('Error al obtener bitácora:', error);
        this.loading = false;
      }
    );
  }

  getUserFromQuery(query: string): string {
    const match = query.match(/UserName='([^']+)'/);
    return match ? match[1] : 'Desconocido';
  }
}
