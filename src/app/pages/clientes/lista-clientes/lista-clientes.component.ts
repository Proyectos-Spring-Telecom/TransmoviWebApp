import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
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
  listaClientes: any;
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

  constructor(private cliService: ClientesService,
    private route: Router, private sanitizer: DomSanitizer,
    private permissionsService: NgxPermissionsService,) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.setupDataSource()
  }

  agregarCliente() {
    this.route.navigateByUrl('/clientes/agregar-cliente')
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  setupDataSource() {
    this.loading = true;
    this.listaClientes = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = Number(loadOptions?.skip) || 0;
        const take = Number(loadOptions?.take) || this.pageSize;
        const page = Math.floor(skip / take) + 1;

        try {
          const response: any = await lastValueFrom(
            this.cliService.obtenerClientesData(page, take)
          );

          this.loading = false;

          const totalRegistros = Number(response?.paginated?.total) || 0;
          const paginaActual = Number(response?.paginated?.page) || page;
          const totalPaginas = Number(response?.paginated?.limit) ||
            (take > 0 ? Math.ceil(totalRegistros / take) : 0);

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;

          const dataTransformada = (Array.isArray(response?.data) ? response.data : []).map((item: any) => {
            const nombre = item?.nombre || '';
            const paterno = item?.apellidoPaterno || '';
            const materno = item?.apellidoMaterno || '';
            const direccionCompleta = [
              item?.calle ? `Calle ${item.calle}` : '',
              item?.numeroExterior ? `#${item.numeroExterior}` : '',
              item?.numeroInterior ? `Int. ${item.numeroInterior}` : '',
              item?.colonia || '',
              item?.municipio || '',
              item?.estado || '',
              item?.cp ? `CP ${item.cp}` : '',
              item?.entreCalles ? `(Entre calles: ${item.entreCalles})` : ''
            ].filter(Boolean).join(', ');

            return {
              ...item,
              id: Number(item?.id),
              tipoPersona: item?.tipoPersona == 1 ? 'Físico' : item?.tipoPersona == 2 ? 'Moral' : 'Desconocido',
              idRol: item?.idRol != null ? Number(item.idRol) : null,
              idCliente: item?.idCliente != null ? Number(item.idCliente) : null,
              NombreCompleto: [nombre, paterno, materno].filter(Boolean).join(' '),
              direccionCompleta
            };
          }).sort((a: any, b: any) => Number(b.id) - Number(a.id));

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
      grid?.option('dataSource', this.listaClientes);
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

    let qStatusNum: number | null = null;
    if (q === '1' || q === 'activo') qStatusNum = 1;
    else if (q === '0' || q === 'inactivo') qStatusNum = 0;

    const dataFiltrada = (this.paginaActualData || []).filter((row: any) => {
      const hitCols = dataFields.some((df) => norm(getByPath(row, df)).includes(q));

      const estNum = Number(row?.estatus);
      const estHit =
        Number.isFinite(estNum) &&
        (qStatusNum !== null ? estNum === qStatusNum : String(estNum).toLowerCase().includes(q));

      const hitExtras = [
        norm(row?.id),
        norm(row?.NombreCompleto),
        norm(row?.telefono),
        norm(row?.rfc),
        norm(row?.correo),
        norm(row?.tipoPersona),
        norm(row?.nombreEncargado),
        norm(row?.telefonoEncargado),
        norm(row?.correoEncargado),
        norm(row?.direccionCompleta)
      ].some((s) => s.includes(q));

      return hitCols || estHit || hitExtras;
    });

    grid?.option('dataSource', dataFiltrada);
  }


  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  actualizarCliente(idCliente: number) {
    this.route.navigateByUrl('/clientes/editar-cliente/' + idCliente);
  };

  eliminarCliente(cliente: any) {
    Swal.fire({
      title: '¡Eliminar Cliente!',
      background: '#002136',
      html: `Está seguro que requiere eliminar el cliente: <br> ${cliente.NombreCompleto}?`,
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
              background: '#002136',
              html: `El cliente ha sido eliminado de forma exitosa.`,
              icon: 'success',
              showCancelButton: false,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.setupDataSource();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              background: '#002136',
              html: `Error al intentar eliminar el cliente.`,
              icon: 'error',
              showCancelButton: false,
            })
          }
        );
      }
    });
  }

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar el cliente: <strong>${rowData.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.cliService.updateEstatus(rowData.id, 1).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El cliente ha sido activado.`,
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
      html: `¿Está seguro que requiere desactivar el cliente: <strong>${rowData.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.cliService.updateEstatus(rowData.id, 0).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El cliente ha sido desactivado.`,
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

  pdfPopupVisible = false;
  pdfTitle = 'Documento';
  pdfPopupWidth = 500;
  pdfUrlSafe: SafeResourceUrl | null = null;
  pdfRawUrl: string | null = null;
  pdfLoading = false;
  pdfLoaded = false;
  pdfError = false;
  pdfErrorMsg = '';
  async previsualizar(url?: string, titulo?: string, _row?: any) {
    this.pdfTitle = titulo || 'Documento';
    this.pdfRawUrl = (url || '').trim() || null;
    this.pdfUrlSafe = null;
    this.pdfLoading = true;
    this.pdfLoaded = false;
    this.pdfError = false;
    this.pdfErrorMsg = '';
    this.pdfPopupVisible = true;
    this.pdfPopupWidth = Math.min(Math.floor(window.innerWidth * 0.95), 900);
    if (!this.pdfRawUrl) {
      this.pdfError = true;
      this.pdfLoading = false;
      this.pdfErrorMsg = 'Este registro no tiene un PDF asignado.';
      return;
    }
    try {
      const head = await fetch(this.pdfRawUrl, { method: 'HEAD', mode: 'cors' });
      if (!head.ok) {
        this.pdfError = true;
        this.pdfErrorMsg = `No se pudo acceder al archivo (HTTP ${head.status}).`;
        this.pdfLoading = false;
        return;
      }
      const ct = head.headers.get('content-type') || '';
      if (!ct.toLowerCase().includes('pdf')) {
        this.pdfError = true;
        this.pdfErrorMsg = 'El recurso no es un archivo PDF.';
        this.pdfLoading = false;
        return;
      }
    } catch (e) {
      this.pdfError = true;
      this.pdfErrorMsg = 'El navegador bloqueó la previsualización (CORS). Intenta Abrir o Descargar.';
      this.pdfLoading = false;
      return;
    }
    const viewerParams = '#toolbar=0&navpanes=0';
    const finalUrl = this.pdfRawUrl.includes('#') ? this.pdfRawUrl : this.pdfRawUrl + viewerParams;
    this.pdfUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
    setTimeout(() => {
      if (!this.pdfLoaded && !this.pdfError) {
        this.pdfError = true;
        this.pdfLoading = false;
        this.pdfErrorMsg = 'El visor tardó demasiado en cargar.';
      }
    }, 4000);
  }

  onPdfLoaded() {
    this.pdfLoaded = true;
    this.pdfLoading = false;
  }

  abrirEnNuevaPestana() {
    if (this.pdfRawUrl) window.open(this.pdfRawUrl, '_blank');
  }

  async descargarPdfForzada() {
    if (!this.pdfRawUrl) return;
    try {
      const resp = await fetch(this.pdfRawUrl, { mode: 'cors' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const base = (this.pdfTitle || 'documento')
        .toLowerCase().replace(/\s+/g, '_').replace(/[^\w\-]+/g, '');
      a.href = url;
      a.download = base.endsWith('.pdf') ? base : base + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      try {
        const u = new URL(this.pdfRawUrl!);
        u.searchParams.set('response-content-disposition', `attachment; filename="${(this.pdfTitle || 'documento').replace(/\s+/g, '_')}.pdf"`);
        window.open(u.toString(), '_self');
      } catch {
        window.open(this.pdfRawUrl!, '_blank');
      }
    }
  }
}