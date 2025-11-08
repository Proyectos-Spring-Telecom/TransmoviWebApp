import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaTalleresComponent } from './lista-talleres.component';

describe('ListaTalleresComponent', () => {
  let component: ListaTalleresComponent;
  let fixture: ComponentFixture<ListaTalleresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaTalleresComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaTalleresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
