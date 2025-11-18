import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarVehicularComponent } from './agregar-vehicular.component';

describe('AgregarVehicularComponent', () => {
  let component: AgregarVehicularComponent;
  let fixture: ComponentFixture<AgregarVehicularComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarVehicularComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgregarVehicularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
