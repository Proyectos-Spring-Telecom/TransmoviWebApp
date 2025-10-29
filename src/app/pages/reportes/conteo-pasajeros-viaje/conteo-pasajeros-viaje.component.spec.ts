import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConteoPasajerosViajeComponent } from './conteo-pasajeros-viaje.component';

describe('ConteoPasajerosViajeComponent', () => {
  let component: ConteoPasajerosViajeComponent;
  let fixture: ComponentFixture<ConteoPasajerosViajeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConteoPasajerosViajeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConteoPasajerosViajeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
