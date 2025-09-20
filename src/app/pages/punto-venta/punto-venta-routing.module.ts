import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuntoVentaPostComponent } from './punto-venta-post/punto-venta-post.component';

const routes: Routes = [
  { 
    path: '',
    component:PuntoVentaPostComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PuntoVentaRoutingModule { }
