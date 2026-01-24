import { Component, OnInit } from '@angular/core';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import { PasajerosService } from 'src/app/shared/services/pasajeros.service';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

declare var google: any;

@Component({
  selector: 'app-vista-pasajero',
  templateUrl: './vista-pasajero.component.html',
  styleUrls: ['./vista-pasajero.component.scss'],
  animations: [fadeInUpAnimation],
})
export class VistaPasajeroComponent implements OnInit {
  errorUsuarioOperador = false;
  loadingTx = false;
  paginaActualTx = 1;
  totalRegistrosTx = 0;
  pageSizeTx = 14;
  totalPaginasTx = 0;
  paginaActualDataTx: any[] = [];
  filtroActivoTx = '';

  loadingMone = false;
  paginaActualM = 1;
  totalRegistrosM = 0;
  pageSizeM = 14;
  totalPaginasM = 0;
  paginaActualDataM: any[] = [];
  filtroActivoM = '';

  showFilterRowTx = false;
  showHeaderFilterTx = false;
  showFilterRowM = false;
  showHeaderFilterM = false;

  mensajeAgruparTx = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  mensajeAgruparM = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';

  listaTransacciones: any;
  listaMonederos: any;

  showId: any;
  showNombre: any;
  showApellidoPaterno: any;
  showApellidoMaterno: any;
  showTelefono: any;
  showCorreo: any;
  showRol: any;
  showRolDescripcion: any;
  showImage: any;
  showRolExtraDescripcion: any;
  showCreacion: any;
  ultimoLogin: string | null = null;
  showNombreCliente: any;
  showApellidoPaternoCliente: any;
  showApellidoMaternoCliente: any;
  mesActualLabel = '';

  saldo = 9876.33;
  informacion: any

  // Propiedades para el modal unificado
  public selectedTransactionData: any = null;
  public hasInicioLocation: boolean = false;
  public hasFinLocation: boolean = false;
  public hasRecargaLocation: boolean = false;
  public direccionInicio: string = '';
  public direccionFin: string = '';
  public direccionRecarga: string = '';

  private readonly markerIcon: google.maps.Icon = {
    url: new URL('assets/images/icons8-marker-48.png', document.baseURI).toString(),
    scaledSize: new google.maps.Size(42, 42),
    anchor: new google.maps.Point(21, 42),
  };

  private obtenerNombreMesActual(): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[new Date().getMonth()];
  }

  constructor(
    private users: AuthenticationService,
    private tranService: TransaccionesService,
    private moneService: MonederosServices,
    private pasjService: PasajerosService,
    private modalService: NgbModal
  ) {
    this.mesActualLabel = this.obtenerNombreMesActual();
    const sanitize = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value).trim();
      return str && str.toLowerCase() !== 'null' ? str : '';
    };

    const user = this.users.getUser();
    this.showNombre = sanitize(user?.nombre);
    this.showApellidoPaterno = sanitize(user?.apellidoPaterno);
    this.showApellidoMaterno = sanitize(user?.apellidoMaterno);
    this.showCreacion = this.formatFechaCreacion(user?.fechaCreacion);
    this.ultimoLogin = this.formatFechaCreacion(user?.ultimoLogin);
    const tel = user?.telefono;
    this.showTelefono =
      tel === null ||
        tel === undefined ||
        String(tel).trim().toLowerCase() === 'null'
        ? 'Sin registro'
        : String(tel).trim();
    this.showCorreo = user.userName;
    this.showId = user.id;
    this.showNombreCliente = sanitize(user?.nombreCliente);
    this.showApellidoPaternoCliente = sanitize(user?.apellidoPaternoCliente);
    this.showApellidoMaternoCliente = sanitize(user?.apellidoMaternoCliente);
  }

  private formatFechaCreacion(raw: any): string {
    if (!raw || raw === 'null') return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  obtenerUsuarioOperador() {
    this.errorUsuarioOperador = false;

    this.pasjService.datosUsuarioPasajero(this.showId).subscribe({
      next: (response) => {
        this.informacion = response.data?.[0] ?? null;
        this.errorUsuarioOperador = false;
      },
      error: (err) => {
        
        //Si hay error muestra validación
        this.informacion = null;
        this.errorUsuarioOperador = true;
      }
    });
  }

  ngOnInit(): void {
    this.setupTransaccionesDataSource();
    this.obtenerUsuarioOperador();
  }

  reintentarCargaUsuario() {
    this.obtenerUsuarioOperador();
  }

  setupTransaccionesDataSource() {
    this.loadingTx = true;

    this.listaTransacciones = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {

        const take = Number(loadOptions?.take) || this.pageSizeTx || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        const body = {
          page,
          limit: take,
          fechaInicio: null,
          fechaFin: null
        };

        try {
          const resp: any = await lastValueFrom(this.tranService.obtenerTransaccionesData(body));
          this.loadingTx = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated ?? {};
          const totalRegistros = toNum(meta.total) ?? rows.length;
          const paginaActual = toNum(meta.page) ?? page;
          const totalPaginas = toNum(meta.lastPage) ?? Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((x: any, idx: number) => ({
            id: x?.id ?? `tx_${page}_${idx}`,
            Id: x?.id ?? `tx_${page}_${idx}`,
            tipoTransaccion: x?.tipoTransaccion ?? null,
            monto: toMoney(x?.monto),
            latitud: x?.latitud ?? null,
            longitud: x?.longitud ?? null,
            fechaHora: x?.fechaHora ?? null,
            latitudInicial: x?.latitudInicial ?? null,
            longitudInicial: x?.longitudInicial ?? null,
            fechaHoraInicio: x?.fechaHoraInicio ?? null,
            latitudFinal: x?.latitudFinal ?? null,
            longitudFinal: x?.longitudFinal ?? null,
            fechaHoraFinal: x?.fechaHoraFinal ?? null,
            fhRegistro: x?.fhRegistro ?? null,
            numeroSerieMonedero: x?.numeroSerieMonedero ?? null,
            numeroSerieDispositivo: x?.numeroSerieDispositivo ?? null
          }));

          this.totalRegistrosTx = totalRegistros;
          this.paginaActualTx = paginaActual;
          this.totalPaginasTx = totalPaginas;
          this.paginaActualDataTx = dataTransformada;

          return { data: dataTransformada, totalCount: totalRegistros };
        } catch (error) {
          this.loadingTx = false;
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

  setupMonederosDataSource() {
    this.loadingMone = true;

    const PAGE_SIZE = this.pageSizeM || 14;

    this.listaMonederos = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = PAGE_SIZE;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(this.moneService.obtenerMonederosData(page, take));
          this.loadingMone = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};
          const totalRegistros = toNum(meta.total) ?? toNum(resp?.total) ?? rows.length;
          const paginaActual = toNum(meta.page) ?? toNum(resp?.page) ?? page;
          const totalPaginas = toNum(meta.lastPage) ?? toNum(resp?.pages) ?? Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((item: any) => ({
            ...item,
            estatusTexto: item?.estatus === 1 ? 'Activo' : item?.estatus === 0 ? 'Inactivo' : null
          }));

          const start = skip;
          const end = skip + take;
          const pageData = dataTransformada.slice(start, end);

          this.totalRegistrosM = totalRegistros;
          this.paginaActualM = paginaActual;
          this.totalPaginasM = totalPaginas;
          this.paginaActualDataM = pageData;

          return { data: pageData, totalCount: totalRegistros };
        } catch (err) {
          this.loadingMone = false;
          console.error('[MONEDEROS] Error:', err);
          return { data: [], totalCount: 0 };
        }
      }
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  }

  onGridOptionChangedTransacciones(e: any) {
    if (e.fullName !== 'searchPanel.text') return;

    this.filtroActivoTx = e.value || '';
    if (!this.filtroActivoTx) {
      e.component.option('dataSource', this.listaTransacciones);
      return;
    }

    const q = this.filtroActivoTx.toLowerCase();
    const dataFiltrada = this.paginaActualDataTx.filter((item: any) => {
      const fFecha = (item.fhRegistro ? String(item.fhRegistro) : '').toLowerCase();
      const fTipo = (item.tipoTransaccion ? String(item.tipoTransaccion) : '').toLowerCase();
      const fMonto = item.monto != null ? String(item.monto) : '';
      const fNSM = (item.numeroSerieMonedero ? String(item.numeroSerieMonedero) : '').toLowerCase();
      const fNSD = (item.numeroSerieDispositivo ? String(item.numeroSerieDispositivo) : '').toLowerCase();
      return fFecha.includes(q) || fTipo.includes(q) || fMonto.includes(q) || fNSM.includes(q) || fNSD.includes(q);
    });

    e.component.option('dataSource', dataFiltrada);
  }

  onGridOptionChangedMonederos(e: any) {
    if (e.fullName !== 'searchPanel.text') return;

    this.filtroActivoM = e.value || '';
    if (!this.filtroActivoM) {
      e.component.option('dataSource', this.listaMonederos);
      return;
    }

    const q = this.filtroActivoM.toLowerCase();
    const dataFiltrada = this.paginaActualDataM.filter((item: any) => {
      const ns = (item.numeroSerie || item.ns || '').toString().toLowerCase();
      const alias = (item.alias || '').toString().toLowerCase();
      const est = (item.estatusTexto || '').toString().toLowerCase();
      const saldo = item.saldo != null ? String(item.saldo) : '';
      return ns.includes(q) || alias.includes(q) || est.includes(q) || saldo.includes(q);
    });

    e.component.option('dataSource', dataFiltrada);
  }

  onPageIndexChangedTransacciones(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActualTx = pageIndex + 1;
    e.component.refresh();
  }

  onPageIndexChangedMonederos(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActualM = pageIndex + 1;
    e.component.refresh();
  }

  onExtravio() {
    const correo =
      this.informacion?.CorreoUsuario || this.showCorreo || '';

    const monederoActual =
      this.informacion?.Monederos || 'monedero';

    Swal.fire({
      title: '¡Reporte de Extravío!',
      html: `Se marcará como extraviado tu monedero: <strong>${monederoActual}</strong>.`,
      icon: 'warning',
      background: '#002136',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      input: 'text',
      inputLabel: 'Nuevo monedero',
      inputPlaceholder: 'Ingresa el nuevo monedero',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes ingresar el nuevo monedero';
        }
        return null;
      },
      customClass: {
        inputLabel: 'swal-label-grey',
        input: 'swal-input-borderless'
      }
    }).then(result => {
      if (!result.isConfirmed) {
        return;
      }

      const nuevoMonedero = (result.value || '').trim();

      this.moneService.reporteExtravio(correo, nuevoMonedero).subscribe({
        next: (response: any) => {
          Swal.fire({
            title: '¡Operación Exitosa!',
            html: response.message,
            icon: 'success',
            background: '#002136',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Aceptar',
            allowOutsideClick: false,
            allowEscapeKey: false
          });
          // this.setupTransaccionesDataSource();
          this.setupMonederosDataSource();
          this.obtenerUsuarioOperador();
        },
        error: (error) => {
          Swal.fire({
            title: '¡Ops!',
            html: error.error,
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