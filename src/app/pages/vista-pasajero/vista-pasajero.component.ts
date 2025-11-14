import { Component, OnInit } from '@angular/core';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { OperadoresService } from 'src/app/shared/services/operadores.service';
import { PasajerosService } from 'src/app/shared/services/pasajeros.service';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';

@Component({
  selector: 'app-vista-pasajero',
  templateUrl: './vista-pasajero.component.html',
  styleUrls: ['./vista-pasajero.component.scss'],
  animations: [fadeInUpAnimation],
})
export class VistaPasajeroComponent implements OnInit {
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
    private pasjService: PasajerosService
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

  obtenerUsuarioOperador(idUsuario: any){
    this.pasjService.datosUsuarioPasajero(this.showId).subscribe((response)=> {
      this.informacion = response.data[0]
    })
  }

  ngOnInit(): void {
    this.setupTransaccionesDataSource();
    this.setupMonederosDataSource();
    this.obtenerUsuarioOperador(this.showId);
  }

  setupTransaccionesDataSource() {
    this.loadingTx = true;

    this.listaTransacciones = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSizeTx || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(this.tranService.obtenerTransaccionesData(page, take));
          this.loadingTx = false;

          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated ?? {};
          const totalRegistros = toNum(meta.total) ?? rows.length;
          const paginaActual = toNum(meta.page) ?? page;
          const totalPaginas = toNum(meta.lastPage) ?? Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((x: any, idx: number) => ({
            id: x?.id ?? `tx_${page}_${idx}`,
            tipoTransaccion: x?.tipoTransaccion ?? null,
            monto: toMoney(x?.monto),
            latitud: x?.latitud ?? null,
            longitud: x?.longitud ?? null,
            fechaHora: x?.fechaHora ?? null,
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
}
