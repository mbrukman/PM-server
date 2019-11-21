import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.scss']
})
export class PolicyComponent implements OnInit {

  public toggleCheckboxes: Subject<boolean> = new Subject<boolean>();

  // public policyValue: Policy = { create: false, read: false, update: false, remove: false };
  @Input() name: String;
  @Input() policyValue: Policy = { create: false, read: false, update: false, remove: false };
  constructor() { }

  get wholePolicyTrue() {
    return this.policyValue.create && this.policyValue.read && this.policyValue.update && this.policyValue.remove;
  }

  ngOnInit() {
    console.log(this.policyValue);
  }

  toggleWholePolicy(newValue: boolean) {
    this.toggleCheckboxes.next(newValue);
    for (const policy in this.policyValue) {
      if (this.policyValue.hasOwnProperty(policy)) {
        this.policyValue[policy] = newValue;
      }
    }
  }

  updateCheckboxes(newValue: Policy) {

  }

  togglePermission(permissionName: string, newValue: boolean) {
    this.policyValue[permissionName] = newValue;
  }

}
