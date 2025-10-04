import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarTarifaComponent } from './agregar-tarifa.component';

describe('AgregarTarifaComponent', () => {
  let component: AgregarTarifaComponent;
  let fixture: ComponentFixture<AgregarTarifaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarTarifaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarTarifaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
