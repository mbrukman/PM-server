import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterTextInputComponent } from './filter-text-input.component';

describe('FilterTextInputComponent', () => {
  let component: FilterTextInputComponent;
  let fixture: ComponentFixture<FilterTextInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterTextInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterTextInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
