import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoPasajeroComponent } from './tipo-pasajero.component';

describe('TipoPasajeroComponent', () => {
  let component: TipoPasajeroComponent;
  let fixture: ComponentFixture<TipoPasajeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoPasajeroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TipoPasajeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
