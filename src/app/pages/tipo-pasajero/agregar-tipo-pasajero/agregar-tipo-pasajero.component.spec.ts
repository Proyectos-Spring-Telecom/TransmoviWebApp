import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarTipoPasajeroComponent } from './agregar-tipo-pasajero.component';

describe('AgregarTipoPasajeroComponent', () => {
  let component: AgregarTipoPasajeroComponent;
  let fixture: ComponentFixture<AgregarTipoPasajeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarTipoPasajeroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarTipoPasajeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
