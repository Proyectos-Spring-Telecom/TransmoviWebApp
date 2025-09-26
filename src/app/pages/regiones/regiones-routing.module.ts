import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaRegionesComponent } from './lista-regiones/lista-regiones.component';
import { AltaRegionComponent } from './alta-region/alta-region.component';

const routes: Routes = 
[
  { 
    path: '',
    component: ListaRegionesComponent
  },
  { path: 'agregar-region',
    component: AltaRegionComponent
  },
  {
    path: 'editar-region/:idRegion',
    component: AltaRegionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegionesRoutingModule { }
