import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecaudacionVehiculoComponent } from './recaudacion-vehiculo.component';

describe('RecaudacionVehiculoComponent', () => {
  let component: RecaudacionVehiculoComponent;
  let fixture: ComponentFixture<RecaudacionVehiculoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecaudacionVehiculoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecaudacionVehiculoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
