import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecaudacionDiariaRutaComponent } from './recaudacion-diaria-ruta/recaudacion-diaria-ruta.component';
import { RecaudacionOperadorComponent } from './recaudacion-operador/recaudacion-operador.component';
import { RecaudacionVehiculoComponent } from './recaudacion-vehiculo/recaudacion-vehiculo.component';
import { RecaudacionDipositivoInstalacionComponent } from './recaudacion-dipositivo-instalacion/recaudacion-dipositivo-instalacion.component';
import { RecaudacionDetalladasComponent } from './recaudacion-detalladas/recaudacion-detalladas.component';
import { ConteoPasajerosViajeComponent } from './conteo-pasajeros-viaje/conteo-pasajeros-viaje.component';

const routes: Routes = [
  { 
    path: 'recaudacion-diaria-ruta',
    component: RecaudacionDiariaRutaComponent
  },
  { 
    path: 'recaudacion-operador',
    component: RecaudacionOperadorComponent
  },
  { 
    path: 'recaudacion-vehiculo',
    component: RecaudacionVehiculoComponent
  },
  { 
    path: 'recaudacion-dispositivoInstalacion',
    component: RecaudacionDipositivoInstalacionComponent
  },
  { 
    path: 'recaudacion-detalladas',
    component: RecaudacionDetalladasComponent
  },
  { 
    path: 'conteo-pasajeros-viaje',
    component: ConteoPasajerosViajeComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportesRoutingModule { }
