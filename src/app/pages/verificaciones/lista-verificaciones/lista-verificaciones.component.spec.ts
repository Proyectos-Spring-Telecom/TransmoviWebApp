import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaVerificacionesComponent } from './lista-verificaciones.component';

describe('ListaVerificacionesComponent', () => {
  let component: ListaVerificacionesComponent;
  let fixture: ComponentFixture<ListaVerificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaVerificacionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaVerificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
