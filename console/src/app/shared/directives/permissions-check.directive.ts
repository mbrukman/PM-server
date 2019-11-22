import {
  AfterViewInit,
  Directive,
  ElementRef,
  Renderer2,
} from '@angular/core';
import {IAMPolicyService} from '@app/services/iam-policy/iam-policy.service';
import {Permissions} from '@app/services/iam-policy/permissions.interface';

@Directive({
  selector: '[appPermissionsCheck]',
  providers: [IAMPolicyService],
  inputs: ['permission', 'hide']
})
export class PermissionsCheckDirective implements AfterViewInit {
  hide: boolean;
  permission: string;

  constructor(
    private elm: ElementRef,
    private renderer: Renderer2,
    private iamPolicyService: IAMPolicyService
  ) {
  }

  ngAfterViewInit() {
    this.iamPolicyService
      .iamPolicySubject
      .subscribe((permissions: Permissions) => {
        const hasPermission = permissions && permissions[this.permission];
        const isDisabled = !hasPermission;
        if (this.hide) {
          this.elm.nativeElement.style.display = isDisabled ? 'none' : 'default';
        } else {
          this.renderer.setAttribute(this.elm.nativeElement, 'disabled', isDisabled.toString());
        }
      });
  }

}
