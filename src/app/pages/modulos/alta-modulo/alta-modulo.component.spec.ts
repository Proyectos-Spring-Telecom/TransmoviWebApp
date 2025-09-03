import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaModuloComponent } from './alta-modulo.component';

describe('AltaModuloComponent', () => {
  let component: AltaModuloComponent;
  let fixture: ComponentFixture<AltaModuloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaModuloComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AltaModuloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
