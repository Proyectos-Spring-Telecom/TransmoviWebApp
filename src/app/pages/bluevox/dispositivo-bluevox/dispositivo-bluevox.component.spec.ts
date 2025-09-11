import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DispositivoBluevoxComponent } from './dispositivo-bluevox.component';

describe('DispositivoBluevoxComponent', () => {
  let component: DispositivoBluevoxComponent;
  let fixture: ComponentFixture<DispositivoBluevoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DispositivoBluevoxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DispositivoBluevoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
