import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecaudacionOperadorComponent } from './recaudacion-operador.component';

describe('RecaudacionOperadorComponent', () => {
  let component: RecaudacionOperadorComponent;
  let fixture: ComponentFixture<RecaudacionOperadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecaudacionOperadorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecaudacionOperadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
