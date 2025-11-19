import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantenimientoVehicularComponent } from './mantenimiento-vehicular.component';

describe('MantenimientoVehicularComponent', () => {
  let component: MantenimientoVehicularComponent;
  let fixture: ComponentFixture<MantenimientoVehicularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MantenimientoVehicularComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MantenimientoVehicularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
