import { Component, OnInit } from '@angular/core';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

declare var google: any;

@Component({
  selector: 'app-lista-transacciones',
  templateUrl: './lista-transacciones.component.html',
  styleUrls: ['./lista-transacciones.component.scss'],
  animations: [fadeInUpAnimation]
})
export class ListaTransaccionesComponent implements OnInit {

  listaTransacciones: any[] = [];
  isLoading: boolean = false;
  public selectedTransactionId: number | null = null;
  public latSelect: string | null = null;
  public lngSelect: string | null = null;
  public selectedTransactionDate: string | null = null;
  public selectedTransactionAmount: number | null = null;
  public selectedTipoTransaccion: any | null = null;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna"
  public loading: boolean = false;
  public loadingMessage: string = 'Cargando...';

  constructor(private tranService: TransaccionesService, private modalService: NgbModal) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerTransacciones();
  }

  obtenerTransacciones() {
    this.loading = true;
    this.tranService.obtenerTransacciones().subscribe(
      (res: any) => {
        setTimeout(()=> {
          this.loading = false;
        },2000)
        this.listaTransacciones = res.transacciones;
      },
      (error) => {
        console.error('Error al obtener transacciones:', error);
        this.loading = false;
      }
    );
  }

  showInfo(id: any): void {
    console.log('Mostrar información de la transacción con ID:', id);
  }

  centerModal(centerDataModal: any, id: number, Latitud: string, Longitud: string, FechaHora: string, Monto: number, TipoTransaccion: any) {
    this.selectedTransactionId = id;
    this.latSelect = Latitud;
    this.lngSelect = Longitud;
    this.selectedTransactionDate = FechaHora;
    this.selectedTransactionAmount = Monto;
    this.selectedTipoTransaccion = TipoTransaccion;
    this.modalService.open(centerDataModal, { 
      centered: true, windowClass: 'modal-holder',
      backdrop: 'static', // ❗ evita cerrar al hacer clic fuera
      keyboard: false,
    });

    setTimeout(() => {
      this.initializeMap(Latitud, Longitud);
    }, 500);
  }

  initializeMap(lat: string, lng: string) {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
      const map = new google.maps.Map(mapElement, {
        center: location,
        zoom: 15
      });

      new google.maps.Marker({
        position: location,
        map: map
      });
    }
  }

  cerrarModal(modal: any) {
    modal.close('Modal cerrado por nuevo método');
  }
}