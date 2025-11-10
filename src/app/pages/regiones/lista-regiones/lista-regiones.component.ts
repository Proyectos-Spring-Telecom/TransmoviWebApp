import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { RegionesService } from 'src/app/shared/services/regiones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-regiones',
  templateUrl: './lista-regiones.component.html',
  styleUrl: './lista-regiones.component.scss',
  animations: [fadeInUpAnimation]
})
export class ListaRegionesComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public listaRegiones: any;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public showExportGrid: boolean;
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  public autoExpandAllGroups: boolean = true;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  public listaDipositivos: any;
  public listaBlueVox: any;
  public listaVehiculos: any;
  public listaClientes: any;
  isGrouped: boolean = false;
  public selectedRegionId: number | null = null;
  public selectedRegionNombre: string | null = null;
  public showRegionMap = false;


  constructor(
    private router: Router,
    private regiServices: RegionesService,
    private permissionsService: NgxPermissionsService,
    private modalService: NgbModal
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit() {
    this.setupDataSource();
    // this.obtenerListaModulos();
  }

  openGeocercaModal(exlargeModalRegion: any, row: any) {
    this.selectedRegionId = row?.id ?? null;
    this.selectedRegionNombre = row?.nombre ?? null;

    const coords = this.extractPolygonCoords(row?.geocerca);
    this.showRegionMap = coords.length >= 3;

    this.modalService.open(exlargeModalRegion, { size: 'xl', windowClass: 'modal-holder', centered: true });

    if (!this.showRegionMap || this.selectedRegionId == null) return;

    const mapId = `map-region-${this.selectedRegionId}`;
    setTimeout(() => {
      this.drawPolygonOnMap(mapId, coords);
    }, 250);
  }

  private extractPolygonCoords(geo: any): Array<{ lat: number; lng: number }> {
    if (!geo) return [];

    if (geo.type === 'FeatureCollection' && Array.isArray(geo.features) && geo.features.length) {
      return this.extractPolygonCoords(geo.features[0]);
    }

    if (geo.type === 'Feature' && geo.geometry) {
      return this.extractPolygonCoords(geo.geometry);
    }

    if (geo.type?.toLowerCase() === 'polygon' && Array.isArray(geo.coordinates)) {
      const ring = geo.coordinates[0] || [];
      return ring
        .map((p: any) => Array.isArray(p) && p.length >= 2 ? { lat: Number(p[1]), lng: Number(p[0]) } : null)
        .filter(Boolean) as Array<{ lat: number; lng: number }>;
    }

    if (Array.isArray(geo)) {
      return geo
        .map((p: any) => ({ lat: Number(p?.lat), lng: Number(p?.lng) }))
        .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    }

    return [];
  }

  private drawPolygonOnMap(mapId: string, path: Array<{ lat: number; lng: number }>) {
    const el = document.getElementById(mapId) as HTMLElement | null;
    if (!el || path.length < 3) return;

    const center = path[0];
    const map = new google.maps.Map(el, {
      center,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
    });

    const polygon = new google.maps.Polygon({
      paths: path,
      fillColor: '#1E88E5',
      fillOpacity: 0.15,
      strokeColor: '#1E88E5',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      editable: false,
      draggable: false,
      map,
      zIndex: 10,
    });

    const bounds = new google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
  }


  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  agregarRegion() {
    this.router.navigateByUrl('/regiones/agregar-region');
  }

  actualizarRegion(idRegion: number) {
    this.router.navigateByUrl('/regiones/editar-region/' + idRegion);
  }

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar está región?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.regiServices.updateEstatus(rowData.id, 1).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `La región ha sido activada.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })

            this.setupDataSource();
            this.dataGrid.instance.refresh();
            // this.obtenerListaModulos();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: `${error}`,
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
      html: `¿Está seguro que requiere desactivar está región?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.regiServices.updateEstatus(rowData.id, 0).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `La región ha sido desactivada.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.setupDataSource();
            this.dataGrid.instance.refresh();
            // this.obtenerListaModulos();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: `${error}`,
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

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  setupDataSource() {
    this.loading = true;
    this.listaRegiones = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.regiServices.obtenerRegionesData(page, take)
          );
          this.loading = false;
          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};
          const totalRegistros =
            toNum(meta.total) ??
            toNum(resp?.total) ??
            rows.length;

          const paginaActual =
            toNum(meta.page) ??
            toNum(resp?.page) ??
            page;

          const totalPaginas =
            toNum(meta.lastPage) ??
            toNum(resp?.pages) ??
            Math.max(1, Math.ceil(totalRegistros / take));
          const dataTransformada = rows.map((item: any) => ({
            ...item,
            estatusTexto:
              item?.estatus === 1 ? 'Activo' :
                item?.estatus === 0 ? 'Inactivo' : null
          }));
          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;
          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
          return { data: [], totalCount: 0 };
        }
      }
    });
    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  }

  onGridOptionChanged(e: any) {
    if (e.fullName === "searchPanel.text") {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaRegiones);
        return;
      }
      const search = this.filtroActivo.toString().toLowerCase();
      const dataFiltrada = this.paginaActualData.filter((item: any) => {
        const idStr = item.id ? item.id.toString().toLowerCase() : '';
        const nombreStr = item.nombre ? item.nombre.toString().toLowerCase() : '';
        const descripcionStr = item.descripcion ? item.descripcion.toString().toLowerCase() : '';
        const moduloStr = item.estatusTexto ? item.estatusTexto.toString().toLowerCase() : '';
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

}