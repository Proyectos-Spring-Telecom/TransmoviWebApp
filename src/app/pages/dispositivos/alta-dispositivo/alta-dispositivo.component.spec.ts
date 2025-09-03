import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaDispositivoComponent } from './alta-dispositivo.component';

describe('AltaDispositivoComponent', () => {
  let component: AltaDispositivoComponent;
  let fixture: ComponentFixture<AltaDispositivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaDispositivoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AltaDispositivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
