import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { ProjectPermissions } from '@app/services/project-policy/project-permissions.interface';
import { ProjectPolicy } from '@app/services/project-policy/project-policy.interface';
import { BasicPolicyComponent } from '../basic-policy/basic-policy.component';

@Component({
  selector: 'app-project-policy',
  templateUrl: './project-policy.component.html',
  styleUrls: ['./project-policy.component.scss']
})
export class ProjectPolicyComponent extends BasicPolicyComponent {
  public toggleCheckboxes: Subject<boolean> = new Subject<boolean>();
  @Input() projectIndex: number;
  @Input() name: string;
  @Input() permissions: ProjectPermissions = {
    createMap: false,
    read: false,
    update: false,
    remove: false,
    archive: false
  };
  @Input() projectPolicySubject: Subject<{
    projectIndex: number;
    permissions: ProjectPermissions;
  }>;

  constructor() {
    super();
  }

  get wholePolicyTrue() {
    return (
      this.permissions.createMap &&
      this.permissions.read &&
      this.permissions.update &&
      this.permissions.remove &&
      this.permissions.archive
    );
  }

  togglePermission(permissionName: string, newValue: boolean) {
    this.permissions[permissionName] = newValue;
    this.projectPolicySubject.next({
      projectIndex: this.projectIndex,
      permissions: this.permissions
    });
  }
}
