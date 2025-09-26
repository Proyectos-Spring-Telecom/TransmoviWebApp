import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaDerroteroComponent } from './alta-derrotero.component';

describe('AltaDerroteroComponent', () => {
  let component: AltaDerroteroComponent;
  let fixture: ComponentFixture<AltaDerroteroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaDerroteroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AltaDerroteroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
