import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaTalleresComponent } from './lista-talleres/lista-talleres.component';
import { AgregarTallerComponent } from './agregar-taller/agregar-taller.component';

const routes: Routes = 
[
  { 
    path: '',
    component:ListaTalleresComponent
  },
  { path: 'agregar-taller',
    component: AgregarTallerComponent
  },
  {
    path: 'editar-taller/:idTaller',
    component: AgregarTallerComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TalleresRoutingModule { }
