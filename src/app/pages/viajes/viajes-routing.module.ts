import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaViajesComponent } from './lista-viajes/lista-viajes.component';

const routes: Routes = [
  { 
    path: '',
    component: ListaViajesComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViajesRoutingModule { }
