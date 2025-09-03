import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaOperadorComponent } from './alta-operador.component';

describe('AltaOperadorComponent', () => {
  let component: AltaOperadorComponent;
  let fixture: ComponentFixture<AltaOperadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaOperadorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AltaOperadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
