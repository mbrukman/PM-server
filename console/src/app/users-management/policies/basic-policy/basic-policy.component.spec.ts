import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicPolicyComponent } from './basic-policy.component';

describe('PolicyComponent', () => {
  let component: BasicPolicyComponent;
  let fixture: ComponentFixture<BasicPolicyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BasicPolicyComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
