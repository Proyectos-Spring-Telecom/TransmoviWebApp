import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantenimientoCombustibleComponent } from './mantenimiento-combustible.component';

describe('MantenimientoCombustibleComponent', () => {
  let component: MantenimientoCombustibleComponent;
  let fixture: ComponentFixture<MantenimientoCombustibleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MantenimientoCombustibleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MantenimientoCombustibleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
