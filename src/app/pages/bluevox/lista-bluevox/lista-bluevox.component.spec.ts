import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaBluevoxComponent } from './lista-bluevox.component';

describe('ListaBluevoxComponent', () => {
  let component: ListaBluevoxComponent;
  let fixture: ComponentFixture<ListaBluevoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaBluevoxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaBluevoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
