import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaIncidentesComponent } from './lista-incidentes.component';

describe('ListaIncidentesComponent', () => {
  let component: ListaIncidentesComponent;
  let fixture: ComponentFixture<ListaIncidentesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaIncidentesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaIncidentesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
