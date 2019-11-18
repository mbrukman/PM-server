import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserGroupAttachUsersModalComponent } from './user-group-attach-users-modal.component';

describe('UserGroupAttachUsersModalComponent', () => {
  let component: UserGroupAttachUsersModalComponent;
  let fixture: ComponentFixture<UserGroupAttachUsersModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserGroupAttachUsersModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserGroupAttachUsersModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
