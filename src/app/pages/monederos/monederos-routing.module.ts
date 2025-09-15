import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaMonederosComponent } from './lista-monederos/lista-monederos.component';
import { AgregarMonederoComponent } from './agregar-monedero/agregar-monedero.component';

const routes: Routes = [
  {
    path: '',
    component: ListaMonederosComponent,
  },
  { 
    path: 'agregar-monedero', 
    component: AgregarMonederoComponent 
  },
  {
    path: 'editar-monedero/:idMonedero',
    component: AgregarMonederoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MonederosRoutingModule {}
