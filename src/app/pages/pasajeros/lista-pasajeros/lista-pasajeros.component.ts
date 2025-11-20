import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { NgxPermissionsService } from 'ngx-permissions';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { PasajerosService } from 'src/app/shared/services/pasajeros.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-pasajeros',
  templateUrl: './lista-pasajeros.component.html',
  styleUrls: ['./lista-pasajeros.component.scss'],
  animations: [fadeInUpAnimation]
})
export class ListaPasajerosComponent implements OnInit {
  // 0 no solicitado
  // 1 solicitado
  // 2 aceptado
  // 3 rechazado

  listaPasajeros: any;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna"
  public loading: boolean = false;
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
  public listaTipoPasajero: any;
  idClienteUser!: number;

  constructor(private pasaService: PasajerosService,
    private route: Router,
    private sanitizer: DomSanitizer,
    private permissionsService: NgxPermissionsService,
    private users: AuthenticationService,
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
    const user = this.users.getUser();
    this.idClienteUser = Number(user?.idCliente);
  }

  ngOnInit(): void {
    this.obtenerTipoPasajero()
    this.obtenerListaPasajeros();
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  obtenerTipoPasajero() {
    this.pasaService.obtenerPasajeroClienteId(this.idClienteUser).subscribe((response) => {
      this.listaTipoPasajero = response.data
    })
  }

onCambiarTipoPasajero(rowData: any) {
  const opcionesTipoHtml = (this.listaTipoPasajero || [])
    .map((item: any) =>
      `<option value="${item.id}" style="background-color:#002136;color:#ffffff;">
        ${item.nombre}
      </option>`
    )
    .join('');

  const opcionesEstadoHtml = `
    <option value="" disabled selected style="background-color:#002136;color:#ffffff;">
      selecciona una opción
    </option>
    <option value="0" style="background-color:#002136;color:#ffffff;">No Solicitado</option>
    <option value="1" style="background-color:#002136;color:#ffffff;">Solicitado</option>
    <option value="2" style="background-color:#002136;color:#ffffff;">Aprobado</option>
    <option value="3" style="background-color:#002136;color:#ffffff;">Rechazado</option>
  `;

  Swal.fire({
    title: '¿Cambio de Tipo Pasajero?',
    html: `
      <label for="estadoSolicitudSelect"
             style="
               display:block;
               margin-top:4px;
               margin-bottom:8px;
               color:#ffffff;
               font-weight:500;
               text-align:left;
             ">
        selecciona el estado de la solicitud
      </label>
      <select id="estadoSolicitudSelect"
              style="
                width:100%;
                padding:0.625em;
                border-radius:0.25em;
                background-color:#002136;
                color:#ffffff;
                border:1px solid #4b647a;
                outline:none;
                margin-top:6px;
                margin-bottom:14px;
              ">
        ${opcionesEstadoHtml}
      </select>

      <label for="tipoPasajeroSelect"
             style="
               display:block;
               margin-top:4px;
               margin-bottom:8px;
               color:#ffffff;
               font-weight:500;
               text-align:left;
             ">
        selecciona el tipo de pasajero
      </label>
      <select id="tipoPasajeroSelect"
              style="
                width:100%;
                padding:0.625em;
                border-radius:0.25em;
                background-color:#002136;
                color:#ffffff;
                border:1px solid #4b647a;
                outline:none;
                margin-top:6px;
              ">
        <option value="" disabled selected
                style="background-color:#002136;color:#ffffff;">
          selecciona una opción
        </option>
        ${opcionesTipoHtml}
      </select>
    `,
    icon: 'info',
    background: '#002136',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    preConfirm: () => {
      const popup = Swal.getPopup();
      const selectEstado = popup?.querySelector('#estadoSolicitudSelect') as HTMLSelectElement | null;
      const selectTipo = popup?.querySelector('#tipoPasajeroSelect') as HTMLSelectElement | null;

      if (!selectEstado || !selectEstado.value) {
        Swal.showValidationMessage('debes seleccionar el estado de la solicitud');
        return;
      }

      if (!selectTipo || !selectTipo.value) {
        Swal.showValidationMessage('debes seleccionar el tipo de pasajero');
        return;
      }

      return {
        estadoSolicitud: Number(selectEstado.value),
        idTipoPasajero: Number(selectTipo.value)
      };
    }
  }).then(result => {
    if (!result.isConfirmed) {
      return;
    }

    const estadoSolicitud = result.value.estadoSolicitud;
    const idTipoPasajero = result.value.idTipoPasajero;

    const tipoSeleccionado =
      (this.listaTipoPasajero || []).find((x: any) => x.id === idTipoPasajero)?.nombre || '';

    this.pasaService.updateEstadoSolicitud(rowData.id, estadoSolicitud, idTipoPasajero).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          html: `El pasajero ahora tiene el tipo pasajero <strong>${tipoSeleccionado}</strong>.`,
          icon: 'success',
          background: '#002136',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Aceptar',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      },
      error: (error) => {
        const msg = error?.error || 'No se pudo actualizar el tipo de pasajero.';
        Swal.fire({
          title: '¡Ops!',
          html: msg,
          icon: 'error',
          background: '#002136',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Aceptar',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      }
    });
  });
}




  obtenerListaPasajeros() {
    this.loading = true;
    this.listaPasajeros = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = Number(loadOptions?.skip) || 0;
        const take = Number(loadOptions?.take) || this.pageSize;
        const page = Math.floor(skip / take) + 1;
        try {
          const response: any = await lastValueFrom(
            this.pasaService.obtenerPasajerosData(page, take)
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
                nombreCompleto: item.nombre + ' ' + item.apellidoPaterno + ' ' + item.apellidoMaterno,
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

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  onGridOptionChanged(e: any) {
    if (e.fullName === "searchPanel.text") {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaPasajeros);
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

  agregarPasajero() {
    this.route.navigateByUrl('/pasajeros/agregar-pasajero')
  }

  actualizarPasajero(idPasajero: number) {
    this.route.navigateByUrl('/pasajeros/editar-pasajero/' + idPasajero);
  };

  eliminarPasajero(pasajero: any) {
    Swal.fire({
      title: '¡Eliminar Pasajero!',
      background: '#002136',
      html: `¿Está seguro que requiere eliminar el pasajero: <br> ${pasajero.Nombre + ' ' + pasajero.ApellidoPaterno + ' ' + pasajero.ApellidoMaterno}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.pasaService.eliminarPasajero(pasajero.Id).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Eliminado!',
              background: '#002136',
              html: `El pasajero ha sido eliminado de forma exitosa.`,
              icon: 'success',
              showCancelButton: false,
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.obtenerListaPasajeros();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              background: '#002136',
              html: `Error al intentar eliminar el pasajero.`,
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
      html: `¿Está seguro que requiere activar al pasajero(a): <br> <strong>${rowData.nombreCompleto}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.pasaService.updateEstatus(rowData.id, 1).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El pasajero ha sido activado.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })

            this.obtenerListaPasajeros();
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
      html: `¿Está seguro que requiere desactivar al pasajero(a): <br> <strong>${rowData.nombreCompleto}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#002136',
    }).then((result) => {
      if (result.value) {
        this.pasaService.updateEstatus(rowData.id, 0).subscribe(
          (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El pasajero ha sido desactivado.`,
              icon: 'success',
              background: '#002136',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            })
            this.obtenerListaPasajeros();
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
