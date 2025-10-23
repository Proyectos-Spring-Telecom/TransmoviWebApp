import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaPasajeroComponent } from './vista-pasajero.component';

describe('VistaPasajeroComponent', () => {
  let component: VistaPasajeroComponent;
  let fixture: ComponentFixture<VistaPasajeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistaPasajeroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VistaPasajeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
