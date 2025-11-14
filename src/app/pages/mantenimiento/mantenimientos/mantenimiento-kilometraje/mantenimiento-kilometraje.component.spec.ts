import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantenimientoKilometrajeComponent } from './mantenimiento-kilometraje.component';

describe('MantenimientoKilometrajeComponent', () => {
  let component: MantenimientoKilometrajeComponent;
  let fixture: ComponentFixture<MantenimientoKilometrajeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MantenimientoKilometrajeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MantenimientoKilometrajeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
