import { Component, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';

@Component({
  selector: 'app-recaudacion-operador',
  templateUrl: './recaudacion-operador.component.html',
  styleUrl: './recaudacion-operador.component.scss'
})
export class RecaudacionOperadorComponent {

  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public informacion: any;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public showExportGrid: boolean;
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';

}
