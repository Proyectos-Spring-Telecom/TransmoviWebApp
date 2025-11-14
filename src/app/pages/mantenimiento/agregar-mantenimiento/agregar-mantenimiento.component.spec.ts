import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarMantenimientoComponent } from './agregar-mantenimiento.component';

describe('AgregarMantenimientoComponent', () => {
  let component: AgregarMantenimientoComponent;
  let fixture: ComponentFixture<AgregarMantenimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarMantenimientoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarMantenimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
