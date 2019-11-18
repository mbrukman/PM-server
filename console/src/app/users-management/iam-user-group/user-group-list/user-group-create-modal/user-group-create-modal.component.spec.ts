import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserGroupCreateModalComponent } from './user-group-create-modal.component';

describe('UserGroupCreateModalComponent', () => {
  let component: UserGroupCreateModalComponent;
  let fixture: ComponentFixture<UserGroupCreateModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserGroupCreateModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserGroupCreateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
