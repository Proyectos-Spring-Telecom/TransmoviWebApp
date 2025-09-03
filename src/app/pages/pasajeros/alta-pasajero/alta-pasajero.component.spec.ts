import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaPasajeroComponent } from './alta-pasajero.component';

describe('AltaPasajeroComponent', () => {
  let component: AltaPasajeroComponent;
  let fixture: ComponentFixture<AltaPasajeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaPasajeroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AltaPasajeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
