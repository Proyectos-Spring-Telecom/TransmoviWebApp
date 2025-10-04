import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaTarifasComponent } from './lista-tarifas/lista-tarifas.component';
import { AgregarTarifaComponent } from './agregar-tarifa/agregar-tarifa.component';

const routes: Routes = [
  { 
    path: '',
    component:ListaTarifasComponent
  },
  { path: 'agregar-tarifa',
    component: AgregarTarifaComponent
  },
  {
    path: 'editar-tarifa/:idTarifa',
    component: AgregarTarifaComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TarifasRoutingModule { }
