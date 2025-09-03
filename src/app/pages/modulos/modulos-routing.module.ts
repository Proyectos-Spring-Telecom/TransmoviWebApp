import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaModulosComponent } from './lista-modulos/lista-modulos.component';
import { AltaModuloComponent } from './alta-modulo/alta-modulo.component';

const routes: Routes = 
[
  { 
    path: '',
    component:ListaModulosComponent
  },
  { path: 'agregar-modulo',
    component: AltaModuloComponent
  },
  {
    path: 'editar-modulo/:idModulo',
    component: AltaModuloComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModulosRoutingModule { }
