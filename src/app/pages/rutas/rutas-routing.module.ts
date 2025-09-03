import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaRutasComponent } from './lista-rutas/lista-rutas.component';
import { AgregarRutaComponent } from './agregar-ruta/agregar-ruta.component';

const routes: Routes = [
  {
      path: 'lista-rutas',
      component: ListaRutasComponent
  },
  {
    path: 'agregar-ruta',
    component: AgregarRutaComponent
  },
  {
    path: 'ver-ruta/:idRutaEspecifica',
    component: AgregarRutaComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RutasRoutingModule { }
