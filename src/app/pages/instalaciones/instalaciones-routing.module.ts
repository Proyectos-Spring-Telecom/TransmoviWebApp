import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaInstalacionesComponent } from './lista-instalaciones/lista-instalaciones.component';
import { AltaInstalacionComponent } from './alta-instalacion/alta-instalacion.component';

const routes: Routes = 
[
  { 
    path: '',
    component:ListaInstalacionesComponent
  },
  { path: 'agregar-instalacion',
    component: AltaInstalacionComponent
  },
  {
    path: 'editar-instalacion/:idInstalacion',
    component: AltaInstalacionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InstalacionesRoutingModule { }
