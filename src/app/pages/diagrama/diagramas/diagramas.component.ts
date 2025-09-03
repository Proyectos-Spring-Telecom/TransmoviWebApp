import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DxDiagramComponent } from 'devextreme-angular';
import * as go from 'gojs';

@Component({
  selector: 'app-diagramas',
  templateUrl: './diagramas.component.html',
  styleUrls: ['./diagramas.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DiagramasComponent implements OnInit {

  @ViewChild(DxDiagramComponent, { static: false }) diagram: DxDiagramComponent;

  constructor(http: HttpClient) {
    http.get('data/diagram-hardware.json').subscribe({
      next: (data) => { this.diagram.instance.import(JSON.stringify(data)); },
      error: (err) => { throw 'Data Loading Error'; },
    });
  }
  
  ngOnInit(): void {
      
  }
  
}
