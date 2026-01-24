import { Component, OnInit, ViewChild } from '@angular/core';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { FormBuilder, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';

declare var google: any;

@Component({
  selector: 'app-lista-transacciones',
  templateUrl: './lista-transacciones.component.html',
  styleUrls: ['./lista-transacciones.component.scss'],
  animations: [fadeInUpAnimation]
})
export class ListaTransaccionesComponent implements OnInit {

  listaTransacciones: any;
  isLoading: boolean = false;
  public selectedTransactionId: number | null = null;
  public latSelect: string | null = null;
  public lngSelect: string | null = null;
  public selectedTransactionDate: string | null = null;
  public selectedTransactionAmount: number | null = null;
  public selectedTipoTransaccion: any | null = null;
  public viajeType: 'inicio' | 'fin' | null = null;
  public grid: boolean = false;
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
  public data: string;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';
  public showMap: boolean = false;
  
  // Propiedades para el modal unificado
  public selectedTransactionData: any = null;
  public hasInicioLocation: boolean = false;
  public hasFinLocation: boolean = false;
  public hasRecargaLocation: boolean = false;
  public direccionInicio: string = '';
  public direccionFin: string = '';
  public direccionRecarga: string = '';

  filtrosForm!: FormGroup;
  fechaInicioFiltro: string | null = null;
  fechaFinFiltro: string | null = null;

  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;

  constructor(
    private tranService: TransaccionesService,
    private modalService: NgbModal,
    private route: Router,
    private permissionsService: NgxPermissionsService,
    private fb: FormBuilder
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.filtrosForm = this.fb.group({
      fechaInicio: [null],
      fechaFin: [null]
    });

    this.setupDataSource();
  }

  hasPermission(permission: string): boolean {
    return this.permissionsService.getPermission(permission) !== undefined;
  }

  setupDataSource() {
    this.loading = true;

    this.listaTransacciones = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        this.loading = true;

        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        const body = {
          page,
          limit: take,
          fechaInicio: this.fechaInicioFiltro,
          fechaFin: this.fechaFinFiltro
        };

        try {
          const resp: any = await lastValueFrom(
            this.tranService.obtenerTransaccionesData(body)
          );
          this.loading = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated ?? {};
          const totalRegistros = toNum(meta.total) ?? rows.length;
          const paginaActual = toNum(meta.page) ?? page;
          const totalPaginas =
            toNum(meta.lastPage) ?? Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((x: any) => {
            const pasajero = [x?.nombrePasajero, x?.apellidoPaternoPasajero, x?.apellidoMaternoPasajero]
              .filter(v => !!(v && String(v).trim()))
              .join(' ')
              .trim();

            return {
              id: x?.id ?? null,
              Id: x?.id ?? null,
              tipoTransaccion: x?.tipoTransaccion ?? null,
              monto: toMoney(x?.monto),
              latitudInicial: x?.latitudInicial ?? null,
              longitudInicial: x?.longitudInicial ?? null,
              fechaHoraInicio: x?.fechaHoraInicio ?? null,
              latitudFinal: x?.latitudFinal ?? null,
              longitudFinal: x?.longitudFinal ?? null,
              fechaHoraFinal: x?.fechaHoraFinal ?? null,
              fhRegistro: x?.fhRegistro ?? null,
              numeroSerieMonedero: x?.numeroSerieMonedero ?? null,
              numeroSerieDispositivo: x?.numeroSerieDispositivo ?? null,
              pasajero: pasajero || 'Sin registro',
              nombreCliente: x?.nombreCliente ?? null,
              apellidoPaternoCliente: x?.apellidoPaternoCliente ?? null,
              apellidoMaternoCliente: x?.apellidoMaternoCliente ?? null
            };
          });

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (error) {
          this.loading = false;
          console.error('[TRANSACCIONES] Error:', error);
          return { data: [], totalCount: 0 };
        }
      }
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }

    function toMoney(v: any): number | null {
      if (v === null || v === undefined) return null;
      const s = String(v).replace(',', '.').replace(/[^0-9.-]/g, '');
      const n = Number(s);
      return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
    }
  }

  private formatDateForApi(value: any): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  aplicarFiltros() {
    const { fechaInicio, fechaFin } = this.filtrosForm.value;

    this.fechaInicioFiltro = this.formatDateForApi(fechaInicio);
    this.fechaFinFiltro = this.formatDateForApi(fechaFin);

    this.paginaActual = 1;
    if (this.dataGrid) {
      this.dataGrid.instance.pageIndex(0);
      this.dataGrid.instance.refresh();
    }
  }

  limpiarFiltros() {
    this.filtrosForm.reset();
    this.fechaInicioFiltro = null;
    this.fechaFinFiltro = null;

    this.paginaActual = 1;
    if (this.dataGrid) {
      this.dataGrid.instance.pageIndex(0);
      this.dataGrid.instance.refresh();
    }
  }

  onGridOptionChanged(e: any) {
    if (e.fullName === "searchPanel.text") {
      this.filtroActivo = e.value || '';
      if (!this.filtroActivo) {
        this.dataGrid.instance.option('dataSource', this.listaTransacciones);
        return;
      }
      const search = this.filtroActivo.toLowerCase();
      const dataFiltrada = this.paginaActualData.filter((item: any) =>
        (item.nombre && item.nombre.toLowerCase().includes(search)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(search)) ||
        (item.modulo?.nombre && item.modulo.nombre.toLowerCase().includes(search))
      );
      this.dataGrid.instance.option('dataSource', dataFiltrada);
    }
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  showInfo(id: any): void {
    console.log('Mostrar información de la transacción con ID:', id);
  }

  centerModal(centerDataModal: any, id: number, latitudFinal: string, longitudFinal: string, fechaHoraFinal: string, monto: number, tipoTransaccion: any) {
    // Solo establecer viajeType como 'fin' si es DEBITO, no para RECARGA
    const tipoUpper = (tipoTransaccion || '').toUpperCase();
    this.viajeType = tipoUpper === 'DEBITO' ? 'fin' : null;
    this.selectedTransactionId = id;
    this.latSelect = latitudFinal;
    this.lngSelect = longitudFinal;
    this.selectedTransactionDate = fechaHoraFinal;
    this.selectedTransactionAmount = monto;
    this.selectedTipoTransaccion = tipoTransaccion;
    if (this.latSelect == null || this.latSelect == '') {
      this.showMap = true;
    } else {
      this.showMap = false;
    }
    this.modalService.open(centerDataModal, {
      centered: true, windowClass: 'modal-holder',
      backdrop: 'static',
      keyboard: false,
    });

    setTimeout(() => {
      this.initializeMap(latitudFinal, longitudFinal);
    }, 500);
  }

  centerModalInicial(centerDataModal: any, id: number, latitudInicial: string, longitudInicial: string, fechaHoraInicio: string, monto: number, tipoTransaccion: any) {
    this.viajeType = 'inicio';
    this.selectedTransactionId = id;
    this.latSelect = latitudInicial;
    this.lngSelect = longitudInicial;
    this.selectedTransactionDate = fechaHoraInicio;
    this.selectedTransactionAmount = monto;
    this.selectedTipoTransaccion = tipoTransaccion;
    if (this.latSelect == null || this.latSelect == '') {
      this.showMap = true;
    } else {
      this.showMap = false;
    }
    this.modalService.open(centerDataModal, {
      centered: true, windowClass: 'modal-holder',
      backdrop: 'static',
      keyboard: false,
    });

    setTimeout(() => {
      this.initializeMap(latitudInicial, longitudInicial);
    }, 500);
  }

  private readonly markerIcon: google.maps.Icon = {
    url: new URL('assets/images/icons8-marker-48.png', document.baseURI).toString(),
    scaledSize: new google.maps.Size(42, 42),
    anchor: new google.maps.Point(21, 42),
  };

  initializeMap(lat: string, lng: string) {
    const mapElement = document.getElementById('map') as HTMLElement | null;
    if (!mapElement) return;
    if (!lat || !lng) return;

    const position = { lat: Number(lat), lng: Number(lng) };

    const map = new google.maps.Map(mapElement, {
      center: position,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
      scrollwheel: true,
      gestureHandling: 'auto',
      zoomControl: true
    });

    new google.maps.Marker({
      position,
      map,
      icon: this.markerIcon,
      title: `Ubicación`,
    });
  }

  cerrarModal(modal: any) {
    modal.close('Modal cerrado por nuevo método');
  }

  agregarTransaccion() {
    this.route.navigateByUrl('/transacciones/agregar-transaccion')
  }

  onFechaFinChange(value: any) {
    if (!value) return;

    const seleccionada = new Date(value);
    const hoy = new Date();

    seleccionada.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    if (seleccionada > hoy) {
      Swal.fire({
        background: '#002136',
        icon: 'warning',
        title: '¡Ops!',
        text: 'La fecha fin no puede ser mayor a la fecha actual.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.filtrosForm.patchValue({ fechaFin: today });
      });
    }
  }

  onFechaInicioChange(value: any) {
    if (!value) return;

    const seleccionada = new Date(value);
    const hoy = new Date();

    seleccionada.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    if (seleccionada > hoy) {
      Swal.fire({
        background: '#002136',
        icon: 'warning',
        title: '¡Ops!',
        text: 'La fecha inicio no puede ser mayor a la fecha actual.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.filtrosForm.patchValue({ fechaInicio: today });
      });
    }
  }

  // Método para abrir el modal unificado
  openUnifiedModal(modalTemplate: any, transactionData: any) {
    this.selectedTransactionData = transactionData;
    
    // Resetear direcciones
    this.direccionInicio = '';
    this.direccionFin = '';
    this.direccionRecarga = '';
    
    // Validar ubicaciones disponibles
    const tipoUpper = (transactionData?.tipoTransaccion || '').toUpperCase();
    
    if (tipoUpper === 'DEBITO') {
      this.hasInicioLocation = !!(transactionData?.latitudInicial && transactionData?.longitudInicial);
      this.hasFinLocation = !!(transactionData?.latitudFinal && transactionData?.longitudFinal);
      
      // Obtener direcciones para DEBITO
      if (this.hasInicioLocation) {
        this.getAddressFromCoordinates(
          transactionData.latitudInicial,
          transactionData.longitudInicial,
          'inicio'
        );
      }
      if (this.hasFinLocation) {
        this.getAddressFromCoordinates(
          transactionData.latitudFinal,
          transactionData.longitudFinal,
          'fin'
        );
      }
    } else if (tipoUpper === 'RECARGA') {
      this.hasRecargaLocation = !!(transactionData?.latitudFinal && transactionData?.longitudFinal);
      
      // Obtener dirección para RECARGA
      if (this.hasRecargaLocation) {
        this.getAddressFromCoordinates(
          transactionData.latitudFinal,
          transactionData.longitudFinal,
          'recarga'
        );
      }
    }

    this.modalService.open(modalTemplate, {
      centered: true,
      windowClass: 'unified-modal-holder',
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    // Inicializar todos los mapas después de un delay para asegurar que el DOM esté listo
    setTimeout(() => {
      if (tipoUpper === 'DEBITO') {
        // Inicializar un solo mapa con ambas ubicaciones
        if (this.hasInicioLocation || this.hasFinLocation) {
          this.initializeDualMap(transactionData);
        }
      } else if (tipoUpper === 'RECARGA' && this.hasRecargaLocation) {
        this.initializeUnifiedMap('map-recarga', transactionData.latitudFinal, transactionData.longitudFinal);
      }
    }, 500);
  }

  // Método para obtener dirección desde coordenadas usando Geocoding
  getAddressFromCoordinates(lat: string, lng: string, type: 'inicio' | 'fin' | 'recarga') {
    if (!lat || !lng) {
      this.setAddressForType(type, 'Sin coordenadas válidas');
      return;
    }

    const geocoder = new google.maps.Geocoder();
    const latlng = {
      lat: Number(lat),
      lng: Number(lng)
    };

    geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
      if (status === 'OK' && results && results.length > 0) {
        const address = results[0].formatted_address || results[0].formattedAddress || 'Dirección no disponible';
        this.setAddressForType(type, address);
      } else {
        this.setAddressForType(type, 'No se pudo obtener la dirección');
      }
    });
  }

  setAddressForType(type: 'inicio' | 'fin' | 'recarga', address: string) {
    switch (type) {
      case 'inicio':
        this.direccionInicio = address;
        break;
      case 'fin':
        this.direccionFin = address;
        break;
      case 'recarga':
        this.direccionRecarga = address;
        break;
    }
  }

  initializeUnifiedMap(mapId: string, lat: string, lng: string) {
    const mapElement = document.getElementById(mapId) as HTMLElement | null;
    if (!mapElement) return;
    if (!lat || !lng) return;

    // Limpiar el contenedor del mapa
    mapElement.innerHTML = '';

    const position = { lat: Number(lat), lng: Number(lng) };

    const map = new google.maps.Map(mapElement, {
      center: position,
      zoom: 16,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      scrollwheel: true,
      gestureHandling: 'auto',
      zoomControl: true
    });

    const marker = new google.maps.Marker({
      position,
      map,
      icon: this.markerIcon,
      title: `Ubicación de Recarga`,
      animation: google.maps.Animation.DROP
    });

    // Crear tooltip para RECARGA
    const direccion = this.direccionRecarga || 'Obteniendo dirección...';
    const fecha = this.selectedTransactionData?.fechaHoraFinal 
      ? this.formatUTCDate(this.selectedTransactionData.fechaHoraFinal)
      : 'Sin fecha';

    const infoWindow = new google.maps.InfoWindow({
      content: this.buildTooltipHTML('Ubicación de Recarga', direccion, fecha, '#0f9d58')
    });

    // Ocultar botón de cerrar y div vacío cuando el InfoWindow esté listo
    infoWindow.addListener('domready', () => {
      const iwOuter = document.querySelector('.gm-style-iw-d')?.parentElement?.parentElement;
      if (iwOuter) {
        const iwCloseBtn = iwOuter.querySelector('.gm-ui-hover-effect');
        const iwCh = iwOuter.querySelector('.gm-style-iw-ch');
        if (iwCloseBtn) {
          (iwCloseBtn as HTMLElement).style.display = 'none';
        }
        if (iwCh) {
          (iwCh as HTMLElement).style.display = 'none';
        }
      }
    });

    // Abrir tooltip automáticamente al cargar
    google.maps.event.addListenerOnce(map, 'idle', () => {
      infoWindow.open(map, marker);
    });

    // Mantener abierto al hacer click en el marcador
    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    // Abrir al pasar el mouse
    marker.addListener('mouseover', () => {
      infoWindow.open(map, marker);
    });
  }

  initializeDualMap(transactionData: any) {
    const mapElement = document.getElementById('map-dual') as HTMLElement | null;
    if (!mapElement) return;

    // Limpiar el contenedor del mapa
    mapElement.innerHTML = '';

    const positions: { lat: number; lng: number; type: 'inicio' | 'fin' }[] = [];
    let bounds = new google.maps.LatLngBounds();

    // Agregar posición de inicio si existe
    if (this.hasInicioLocation && transactionData?.latitudInicial && transactionData?.longitudInicial) {
      const inicioPos = { 
        lat: Number(transactionData.latitudInicial), 
        lng: Number(transactionData.longitudInicial),
        type: 'inicio' as const
      };
      positions.push(inicioPos);
      bounds.extend(new google.maps.LatLng(inicioPos.lat, inicioPos.lng));
    }

    // Agregar posición de fin si existe
    if (this.hasFinLocation && transactionData?.latitudFinal && transactionData?.longitudFinal) {
      const finPos = { 
        lat: Number(transactionData.latitudFinal), 
        lng: Number(transactionData.longitudFinal),
        type: 'fin' as const
      };
      positions.push(finPos);
      bounds.extend(new google.maps.LatLng(finPos.lat, finPos.lng));
    }

    if (positions.length === 0) return;

    // Calcular el centro para el mapa
    const center = positions.length === 1 
      ? { lat: positions[0].lat, lng: positions[0].lng }
      : bounds.getCenter().toJSON();

    const map = new google.maps.Map(mapElement, {
      center: center,
      zoom: positions.length === 1 ? 16 : undefined,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      scrollwheel: true,
      gestureHandling: 'auto',
      zoomControl: true
    });

    // Si hay múltiples posiciones, ajustar el zoom para mostrar ambas
    if (positions.length > 1) {
      map.fitBounds(bounds);
      // Ajustar el padding para que no quede muy pegado
      map.setOptions({ padding: { top: 50, right: 50, bottom: 50, left: 50 } });
    }

    // Crear marcadores más notorios con colores estándar de Google Maps y tooltips
    positions.forEach((pos) => {
      // Usar los iconos estándar de Google Maps con colores
      const markerIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 18, // Más grande y notorio
        fillColor: pos.type === 'inicio' ? '#4285F4' : '#EA4335', // Azul y rojo estándar de Google
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 4, // Borde más grueso para mayor visibilidad
      };

      const marker = new google.maps.Marker({
        position: { lat: pos.lat, lng: pos.lng },
        map,
        icon: markerIcon,
        title: pos.type === 'inicio' ? 'Punto de Inicio' : 'Punto de Fin',
        animation: google.maps.Animation.DROP,
        label: {
          text: pos.type === 'inicio' ? 'I' : 'F',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 'bold'
        },
        optimized: false // Para mejor renderizado
      });

      // Obtener datos para el tooltip
      const titulo = pos.type === 'inicio' ? 'Punto de Inicio' : 'Punto de Fin';
      const direccion = pos.type === 'inicio' ? (this.direccionInicio || 'Obteniendo dirección...') : (this.direccionFin || 'Obteniendo dirección...');
      const fecha = pos.type === 'inicio' 
        ? (transactionData?.fechaHoraInicio ? this.formatUTCDate(transactionData.fechaHoraInicio) : 'Sin fecha')
        : (transactionData?.fechaHoraFinal ? this.formatUTCDate(transactionData.fechaHoraFinal) : 'Sin fecha');
      const color = pos.type === 'inicio' ? '#4285F4' : '#EA4335';

      // Crear InfoWindow con tooltip
      const infoWindow = new google.maps.InfoWindow({
        content: this.buildTooltipHTML(titulo, direccion, fecha, color)
      });

      // Ocultar botón de cerrar y div vacío cuando el InfoWindow esté listo
      infoWindow.addListener('domready', () => {
        const iwOuter = document.querySelector('.gm-style-iw-d')?.parentElement?.parentElement;
        if (iwOuter) {
          const iwCloseBtn = iwOuter.querySelector('.gm-ui-hover-effect');
          const iwCh = iwOuter.querySelector('.gm-style-iw-ch');
          if (iwCloseBtn) {
            (iwCloseBtn as HTMLElement).style.display = 'none';
          }
          if (iwCh) {
            (iwCh as HTMLElement).style.display = 'none';
          }
        }
      });

      // Abrir tooltip automáticamente al cargar
      google.maps.event.addListenerOnce(map, 'idle', () => {
        infoWindow.open(map, marker);
      });

      // Mantener abierto al hacer click en el marcador
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Abrir al pasar el mouse
      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker);
      });
    });
  }

  private buildTooltipHTML(titulo: string, direccion: string, fecha: string, color: string): string {
    const safeTitulo = this.escapeHTML(titulo);
    const safeDireccion = this.escapeHTML(direccion);
    const safeFecha = this.escapeHTML(fecha);
    
    return `
      <div style="font-family:'Segoe UI',sans-serif;display:inline-block;background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.12);padding:12px 10px;line-height:1.3;max-width:240px;white-space:normal;overflow-wrap:break-word;word-wrap:break-word;margin:0;">
        <div style="font-size:12px;color:#2f2f2f;margin:0;">
          <span style="display:block;color:${color};font-weight:600;margin-bottom:4px;font-size:13px;">${safeTitulo}</span>
          <span style="display:block;margin-bottom:3px;font-size:11px;color:#333;">${safeDireccion}</span>
          <span style="display:block;margin-top:4px;padding-top:4px;border-top:1px solid #eee;font-size:11px;color:#666;">Fecha: ${safeFecha}</span>
        </div>
      </div>
    `;
  }

  private formatUTCDate(fechaInput: string | Date): string {
    const fecha = new Date(fechaInput);
    if (isNaN(fecha.getTime())) return 'Sin fecha';
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    const dd = pad(fecha.getUTCDate());
    const MM = pad(fecha.getUTCMonth() + 1);
    const yyyy = fecha.getUTCFullYear();
    const hh = pad(fecha.getUTCHours());
    const mm = pad(fecha.getUTCMinutes());
    
    return `${dd}/${MM}/${yyyy}, ${hh}:${mm} hrs`;
  }

  private escapeHTML(text: any): string {
    if (!text) return '';
    const str = String(text);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

}
