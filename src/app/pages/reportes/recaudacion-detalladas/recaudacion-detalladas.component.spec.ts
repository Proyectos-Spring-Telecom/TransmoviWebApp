import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecaudacionDetalladasComponent } from './recaudacion-detalladas.component';

describe('RecaudacionDetalladasComponent', () => {
  let component: RecaudacionDetalladasComponent;
  let fixture: ComponentFixture<RecaudacionDetalladasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecaudacionDetalladasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecaudacionDetalladasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
