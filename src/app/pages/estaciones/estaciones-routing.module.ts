import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaEstacionesComponent } from './lista-estaciones/lista-estaciones.component';

const routes: Routes = [
  {
      path: 'lista-estaciones',
      component: ListaEstacionesComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EstacionesRoutingModule { }
