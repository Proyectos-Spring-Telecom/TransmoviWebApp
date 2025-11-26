import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaPosicionesComponent } from './lista-posiciones/lista-posiciones.component';

const routes: Routes = [
  {
    path: '',
    component: ListaPosicionesComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PosicionesRoutingModule { }
