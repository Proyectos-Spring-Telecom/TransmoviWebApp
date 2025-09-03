import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';
import { RutasService } from 'src/app/shared/services/rutas.service';

@Component({
  selector: 'app-lista-rutas',
  templateUrl: './lista-rutas.component.html',
  styleUrls: ['./lista-rutas.component.scss'],
  animations: [fadeInUpAnimation],
})
export class ListaRutasComponent implements OnInit {
  isLoading: boolean = false;
  listaRutas: any[] = [];
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';

  constructor(
    private rutaSe: RutasService,
    private zone: NgZone,
    private route: Router
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.obtenerRutas();
  }

  agregarRuta() {
    this.route.navigateByUrl('/rutas/agregar-ruta');
  }

  obtenerRutas() {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

    this.rutaSe.obtenerRutas().subscribe((response) => {
      this.listaRutas = response.map((d) => {
        return {
          id: d.id,
          nombre: d.nombre ?? 'Sin información',
          ciaKm:
            d.distanciaKm != null ? `${d.distanciaKm} km` : 'Sin información',
          tarifaBase:
            d.tarifa?.tarifaBase != null
              ? formatter.format(d.tarifa.tarifaBase)
              : 'Sin información',
          costoAdicional:
            d.tarifa?.costoAdicional != null
              ? formatter.format(d.tarifa.costoAdicional)
              : 'Sin información',
          distanciaBaseKm:
            d.tarifa?.distanciaBaseKm != null
              ? formatter.format(d.tarifa.distanciaBaseKm)
              : 'Sin información',
          puntoInicioDireccion: d.puntoInicio?.direccion ?? 'Sin información',
          puntoFinDireccion: d.puntoFin?.direccion ?? 'Sin información',
        };
      }).sort((a, b) => b.id - a.id);
    });
  }

  isNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  verRuta(idRutaEspecifica: number){
    this.route.navigateByUrl('/rutas/ver-ruta/' + idRutaEspecifica
    );
  };
  
  alCambiarOpcion(e: any): void {
  if (e.name === 'paging' && e.fullName === 'paging.pageIndex') {
    // Scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

}
