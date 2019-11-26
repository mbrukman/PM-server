import {
  AfterViewInit,
  Directive,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { IAMPolicyService } from '@app/services/iam-policy/iam-policy.service';
import { IAMPermissions } from '@app/services/iam-policy/iam-permissions.interface';

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
    // this.iamPolicyService
    //   .iamPolicySubject
    //   .subscribe((iamPermissions: IAMPermissions) => {
    //     const hasPermission = iamPermissions && iamPermissions[this.permission];
    //     const isDisabled = !hasPermission;
    //     if (this.hide) {
    //       this.elm.nativeElement.style.display = isDisabled ? 'none' : 'default';
    //     } else {
    //       if (this.elm.nativeElement.disabled !== null) {
    //         this.renderer.setProperty(this.elm.nativeElement, 'disabled', isDisabled);
    //       }else {
    //         this.renderer.setAttribute(this.elm.nativeElement, 'disabled', isDisabled.toString());
    //       }
    //     }
    //   });
  }

}
