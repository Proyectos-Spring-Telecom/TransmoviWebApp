import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DiagramaRoutingModule } from './diagrama-routing.module';
import { DxDiagramModule } from 'devextreme-angular';
import { DiagramasComponent } from './diagramas/diagramas.component';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [DiagramasComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    DiagramaRoutingModule,
    DxDiagramModule,
  ],
  bootstrap: [DiagramasComponent],
})
export class DiagramaModule { }
