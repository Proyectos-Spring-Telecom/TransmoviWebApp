import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TipoPasajeroComponent } from './tipo-pasajero.component';
import { AgregarTipoPasajeroComponent } from './agregar-tipo-pasajero/agregar-tipo-pasajero.component';

const routes: Routes = 
[
  { 
    path: '',
    component:TipoPasajeroComponent
  },
  { path: 'agregar-tipo-pasajero',
    component: AgregarTipoPasajeroComponent
  },
  {
    path: 'editar-tipo-pasajero/:idTipoPasajero',
    component: AgregarTipoPasajeroComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TipoPasajeroRoutingModule { }
