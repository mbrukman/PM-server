import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPolicyComponent } from './project-policy.component';

describe('ProjectPolicyComponent', () => {
  let component: ProjectPolicyComponent;
  let fixture: ComponentFixture<ProjectPolicyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectPolicyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
