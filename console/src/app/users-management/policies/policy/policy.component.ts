import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { Permissions } from '../../../services/users/permissions.interface';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.scss']
})
export class PolicyComponent implements OnInit {

  public toggleCheckboxes: Subject<boolean> = new Subject<boolean>();

  // public policyValue: Policy = { create: false, read: false, update: false, remove: false };
  @Input() name: String;
  @Input() permissions: Permissions = { create: false, read: false, update: false, remove: false };
  constructor() { }

  get wholePolicyTrue() {
    return this.permissions.create && this.permissions.read && this.permissions.update && this.permissions.remove;
  }

  ngOnInit() {
  }

  toggleWholePolicy(newValue: boolean) {
    this.toggleCheckboxes.next(newValue);
    for (const policy in this.permissions) {
      if (this.permissions.hasOwnProperty(policy)) {
        this.permissions[policy] = newValue;
      }
    }
  }

  togglePermission(permissionName: string, newValue: boolean) {
    this.permissions[permissionName] = newValue;
  }

}
