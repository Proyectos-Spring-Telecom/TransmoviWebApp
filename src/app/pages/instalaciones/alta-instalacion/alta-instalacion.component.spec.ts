import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaInstalacionComponent } from './alta-instalacion.component';

describe('AltaInstalacionComponent', () => {
  let component: AltaInstalacionComponent;
  let fixture: ComponentFixture<AltaInstalacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaInstalacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AltaInstalacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
