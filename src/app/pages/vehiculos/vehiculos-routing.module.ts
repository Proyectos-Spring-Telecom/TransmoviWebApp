import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaVehiculosComponent } from './lista-vehiculos/lista-vehiculos.component';
import { AltaVehiculoComponent } from './alta-vehiculo/alta-vehiculo.component';

const routes: Routes = [
  { 
    path: '',
    component:ListaVehiculosComponent
  },
  { path: 'agregar-vehiculo',
    component: AltaVehiculoComponent
  },
  {
    path: 'editar-vehiculo/:idVehiculo',
    component: AltaVehiculoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VehiculosRoutingModule { }
