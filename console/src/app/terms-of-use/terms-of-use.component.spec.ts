import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsOfUseComponent } from './tos.component';

describe('TosComponent', () => {
  let component: TermsOfUseComponent;
  let fixture: ComponentFixture<TermsOfUseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TermsOfUseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TermsOfUseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
