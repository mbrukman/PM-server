import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralModalTemplateComponent } from './general-modal-template.component';

describe('GeneralModalTemplateComponent', () => {
  let component: GeneralModalTemplateComponent;
  let fixture: ComponentFixture<GeneralModalTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneralModalTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralModalTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
