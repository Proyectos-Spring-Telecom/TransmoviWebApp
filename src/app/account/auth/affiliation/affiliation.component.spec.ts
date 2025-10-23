import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffiliationComponent } from './affiliation.component';

describe('AffiliationComponent', () => {
  let component: AffiliationComponent;
  let fixture: ComponentFixture<AffiliationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffiliationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AffiliationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
