import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagramaComponent } from './diagrama.component';

describe('DiagramaComponent', () => {
  let component: DiagramaComponent;
  let fixture: ComponentFixture<DiagramaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagramaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DiagramaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
