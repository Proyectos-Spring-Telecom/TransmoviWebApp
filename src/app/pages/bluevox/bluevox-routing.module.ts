import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaBluevoxComponent } from './lista-bluevox/lista-bluevox.component';
import { RegistrarComponent } from './registrar/registrar.component';

const routes: Routes = [
  {
      path: 'lista-bluevox',
      component: ListaBluevoxComponent
  },
  {
      path: 'registrar',
      component: RegistrarComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BluevoxRoutingModule { }
