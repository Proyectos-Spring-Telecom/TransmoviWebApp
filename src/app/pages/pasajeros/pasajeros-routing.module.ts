import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaPasajerosComponent } from './lista-pasajeros/lista-pasajeros.component';
import { AltaPasajeroComponent } from './alta-pasajero/alta-pasajero.component';

const routes: Routes = 
[
  { 
    path: '',
    component:ListaPasajerosComponent
  },
  { path: 'agregar-pasajero',
    component: AltaPasajeroComponent
  },
  {
    path: 'editar-pasajero/:idPasajero',
    component: AltaPasajeroComponent,
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PasajerosRoutingModule { }
