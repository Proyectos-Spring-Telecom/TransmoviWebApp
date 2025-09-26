import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaRegionComponent } from './alta-region.component';

describe('AltaRegionComponent', () => {
  let component: AltaRegionComponent;
  let fixture: ComponentFixture<AltaRegionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaRegionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AltaRegionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
