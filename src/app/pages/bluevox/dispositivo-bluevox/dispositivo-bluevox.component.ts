import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { DispositivoBluevoxService } from 'src/app/shared/services/dispositivobluevox.service';
import { DispositivosService } from 'src/app/shared/services/dispositivos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dispositivo-bluevox',
  templateUrl: './dispositivo-bluevox.component.html',
  styleUrl: './dispositivo-bluevox.component.scss',
  animations: [fadeInUpAnimation]
})
export class DispositivoBluevoxComponent implements OnInit {

  isLoading: boolean = false;
  listaDispositivos: any;
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

  constructor(private disBlueService: DispositivoBluevoxService,
    private route: Router,
    private permissionsService: NgxPermissionsService) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerDispositivos();
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  obtenerDispositivos() {
    this.loading = true;
    this.listaDispositivos = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = Number(loadOptions?.skip) || 0;
        const take = Number(loadOptions?.take) || this.pageSize;
        const page = Math.floor(skip / take) + 1;
        try {
          const response: any = await lastValueFrom(
            this.disBlueService.obtenerDispositivosBlueData(page, take)
          );
          this.loading = false;
          const totalRegistros = Number(response?.paginated?.total) || 0;
          const paginaActual = Number(response?.paginated?.page) || page;
          const totalPaginas = take > 0 ? Math.ceil(totalRegistros / take) : 0;
          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          const dataTransformada = (Array.isArray(response?.data) ? response.data : [])
            .map((item: any) => {
              const idNum = Number(item?.id ?? item?.Id ?? item?.ID);
              return {
                ...item,
                id: Number.isFinite(idNum) ? idNum : 0,
              };
            })
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

  onGridOptionChanged(e: any) {
    if (e.fullName !== 'searchPanel.text') return;

    const grid = this.dataGrid?.instance;
    const qRaw = (e.value ?? '').toString().trim();
    if (!qRaw) {
      this.filtroActivo = '';
      grid?.option('dataSource', this.listaDispositivos);
      return;
    }
    this.filtroActivo = qRaw;

    const norm = (v: any) =>
      (v == null ? '' : String(v))
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
    const q = norm(qRaw);

    let columnas: any[] = [];
    try {
      const colsOpt = grid?.option('columns');
      if (Array.isArray(colsOpt) && colsOpt.length) columnas = colsOpt;
    } catch { }
    if (!columnas.length && grid?.getVisibleColumns) columnas = grid.getVisibleColumns();

    const dataFields: string[] = columnas
      .map((c: any) => c?.dataField)
      .filter((df: any) => typeof df === 'string' && df.trim().length > 0);

    const getByPath = (obj: any, path: string) =>
      !obj || !path ? undefined : path.split('.').reduce((acc, k) => acc?.[k], obj);

    const dataFiltrada = (this.paginaActualData || []).filter((row: any) => {
      const hitCols = dataFields.some((df) => norm(getByPath(row, df)).includes(q));

      const estNum = Number(row?.estatus);
      const estText = Number.isFinite(estNum) ? (estNum === 1 ? 'activo' : 'inactivo') : '';

      const estHits =
        estText.includes(q) ||
        ('activo'.startsWith(q) && estNum === 1) ||
        ('inactivo'.startsWith(q) && estNum === 0) ||
        (q === '1' && estNum === 1) ||
        (q === '0' && estNum === 0) ||
        String(estNum).includes(q);

      const hitExtras = [
        norm(row?.id),
        norm(row?.marca),
        norm(row?.modelo),
        norm(row?.numeroSerie)
      ].some((s) => s.includes(q));

      return hitCols || estHits || hitExtras;
    });

    grid?.option('dataSource', dataFiltrada);
  }


  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  showInfo(id: any): void {
    console.log('Mostrar información del dispositivo con ID:', id);
  }

  agregarDispositivo() {
    this.route.navigateByUrl('/bluevox/agregar-bluevox')
  }

  actualizarDispositivo(idBluevox: number) {
    this.route.navigateByUrl('/bluevox/editar-bluevox/' + idBluevox);
  };

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar el dispositivo: <strong>${rowData.marca}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.disBlueService.updateEstatus(rowData.id, 1).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El dispositivo ha sido activado.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })

            this.obtenerDispositivos();
            this.dataGrid.instance.refresh();
            // this.obtenerListaModulos();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: error.error,
              icon: 'error',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
          }
        );
      }
    });
  }

  desactivar(rowData: any) {
    Swal.fire({
      title: '¡Desactivar!',
      html: `¿Está seguro que requiere desactivar el dispositivo: <strong>${rowData.marca}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.disBlueService.updateEstatus(rowData.id, 0).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El dispositivo ha sido desactivado.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.obtenerDispositivos();
            this.dataGrid.instance.refresh();
            // this.obtenerListaModulos();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: error.error,
              icon: 'error',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
          }
        );
      }
    });
    // console.log('Desactivar:', rowData);
  }

  async abrirModalCambioEstado(dispositivo: any) {
      const { value: estadoSeleccionado } = await Swal.fire({
        title: `Cambiar estado del dispositivo: ${dispositivo?.numeroSerie ?? ''}`,
        icon: 'question',
        html: `
        <div style="text-align:left">
          <label style="
            display:block;
            margin:12px 0 6px;
            font-size:12.5px;
            font-weight:600;
            color:#9fb0c3;">
            Selecciona el nuevo estado
          </label>
          <select id="estado-select" class="swal2-input" style="height:auto">
            <option value="" selected disabled>Selecciona el estado del componente</option>
            <option value="0">Inactivo</option>
            <option value="1">Disponible</option>
            <option value="3">En Mantenimiento</option>
            <option value="4">Dañado</option>
            <option value="5">Retirado</option>
          </select>
        </div>
      `,
        background: '#0e1621',
        color: '#e9eef5',
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCloseButton: false,
  
        focusConfirm: false,
        didOpen: () => {
          const popup = Swal.getPopup();
          if (!popup) return;
  
          popup.style.border = '1px solid #213041';
          popup.style.borderRadius = '14px';
          popup.style.padding = '22px';
          popup.style.width = 'min(520px,92vw)';
          popup.style.boxShadow = '0 18px 50px rgba(0,0,0,.45)';
  
          const selectEl = document.getElementById('estado-select') as HTMLSelectElement | null;
          if (selectEl) {
            selectEl.style.width = '100%';
            selectEl.style.background = '#0b121b';
            selectEl.style.color = '#e9eef5';
            selectEl.style.borderRadius = '10px';
            selectEl.style.padding = '10px 12px';
            selectEl.style.height = '44px';
            selectEl.style.transition =
              'border-color .15s ease, box-shadow .15s ease, background .15s ease';
            selectEl.style.border = '1px solid transparent';
            selectEl.style.outline = 'none';
            selectEl.style.boxShadow = 'none';
          }
        },
        preConfirm: () => {
          const estadoEl = document.getElementById('estado-select') as HTMLSelectElement | null;
          const estadoStr = estadoEl?.value ?? '';
          if (!estadoStr) {
            Swal.showValidationMessage('Selecciona un estado');
            return false as any;
          }
  
          return Number(estadoStr);
        }
      });
      if (estadoSeleccionado == null) return;
      this.disBlueService.actualizarEstadoDispositivo(dispositivo.id, estadoSeleccionado)
        .subscribe(
          () => {
            Swal.fire({
              title: '¡Cambio realizado!',
              html: `El estado del bluevox ha sido actualizado.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
  
            this.obtenerDispositivos();
            this.dataGrid.instance.refresh();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: error.error,
              icon: 'error',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        );
    }
}