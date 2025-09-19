import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { BitacoraService } from 'src/app/shared/services/bitacora.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';

@Component({
  selector: 'app-lista-bitacora',
  templateUrl: './lista-bitacora.component.html',
  styleUrls: ['./lista-bitacora.component.scss'],
  animations: [fadeInUpAnimation],
})
export class ListaBitacoraComponent implements OnInit {
  public bitacoraList: any;
  public searchTerm: string = '';
  public startDate: string = '';
  public endDate: string = '';
  public isLoading: boolean = false;
  public grid: boolean = true;
  public showHeaderFilter: boolean;
  public showFilterRow: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean = false;
  public loadingMessage: string = 'Cargando...';
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  public autoExpandAllGroups: boolean = true;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  public listaUsuarios: any;
  public mapaUsuarios: any;
  @ViewChild(DxDataGridComponent, { static: false })
  dataGrid: DxDataGridComponent;
  isGrouped: boolean = false;

  constructor(private bitacoraService: BitacoraService, private usuService: UsuariosService) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerBitacora();
    this.obtenerUsuarios()
  }

  obtenerUsuarios() {
    this.usuService.obtenerUsuarios().subscribe((response) => {
      this.listaUsuarios = response.data;
      this.mapaUsuarios = new Map(
        (this.listaUsuarios || []).map((u: any) => [String(u.id), u])
      );
    });
  }

  obtenerBitacora() {
    this.loading = true;
    this.bitacoraList = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.bitacoraService.obtenerBitacoraData(page, take)
          );
          this.loading = false;
          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};
          const totalRegistros = toNum(meta.total) ?? toNum(resp?.total) ?? rows.length;
          const paginaActual = toNum(meta.page) ?? toNum(resp?.page) ?? page;
          const totalPaginas = toNum(meta.lastPage) ?? toNum(resp?.pages) ?? Math.max(1, Math.ceil(totalRegistros / take));
          const dataTransformada = rows.map((item: any) => {
            const uid = String(item?.idUsuario ?? '');
            const u = this.mapaUsuarios?.get(uid) ?? (this.listaUsuarios || []).find((x: any) => String(x?.id) === uid);
            let accionTexto: string | null = null;
            if (item?.accion === 'CREATE') accionTexto = 'Crear';
            else if (item?.accion === 'UPDATE') accionTexto = 'Actualizar';
            else if (item?.accion === 'DELETE') accionTexto = 'Eliminar';
            const nombreCompleto = u
              ? `${u.nombre ?? ''} ${u.apellidoPaterno ?? ''}`.trim()
              : 'Desconocido';

            return {
              ...item,
              estatusTexto:
                item?.estatus === 1 ? 'Activo' :
                  item?.estatus === 0 ? 'Inactivo' : null,
              usuarioNombre: nombreCompleto,
              accionTexto
            };
          });
          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros,
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
          return { data: [], totalCount: 0 };
        }
      },
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  onGridOptionChanged(e: any) {
    if (e.fullName === 'searchPanel.text') {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.bitacoraList);
        return;
      }
      const search = this.filtroActivo.toString().toLowerCase();
      const dataFiltrada = this.paginaActualData.filter((item: any) => {
        const idStr = item.id ? item.id.toString().toLowerCase() : '';
        const nombreStr = item.nombre
          ? item.nombre.toString().toLowerCase()
          : '';
        const descripcionStr = item.descripcion
          ? item.descripcion.toString().toLowerCase()
          : '';
        const moduloStr = item.estatusTexto
          ? item.estatusTexto.toString().toLowerCase()
          : '';
        return (
          nombreStr.includes(search) ||
          descripcionStr.includes(search) ||
          moduloStr.includes(search) ||
          idStr.includes(search)
        );
      });
      this.dataGrid.instance.option('dataSource', dataFiltrada);
    }
  }

  getUserFromQuery(query: string): string {
    const match = query.match(/UserName='([^']+)'/);
    return match ? match[1] : 'Desconocido';
  }
}