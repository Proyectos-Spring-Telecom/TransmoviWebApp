import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaBluevoxComponent } from './lista-bluevox/lista-bluevox.component';
import { RegistrarComponent } from './registrar/registrar.component';
import { DispositivoBluevoxComponent } from './dispositivo-bluevox/dispositivo-bluevox.component';
import { RegistrarBluevoxComponent } from './registrar-bluevox/registrar-bluevox.component';

const routes: Routes = [
  {
      path: 'lista-bluevox',
      component: ListaBluevoxComponent
  },
  {
      path: 'registrar',
      component: RegistrarComponent
  },
  {
      path: 'dispositivo-bluevox',
      component: DispositivoBluevoxComponent
  },
  {
      path: 'agregar-bluevox',
      component: RegistrarBluevoxComponent
  },
  {
      path: 'editar-bluevox/:idBluevox',
      component: RegistrarBluevoxComponent,
    },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BluevoxRoutingModule { }
