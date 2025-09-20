import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuntoVentaPostComponent } from './punto-venta-post.component';

describe('PuntoVentaPostComponent', () => {
  let component: PuntoVentaPostComponent;
  let fixture: ComponentFixture<PuntoVentaPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuntoVentaPostComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PuntoVentaPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
