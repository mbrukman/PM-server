import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KhTooltipComponent } from './kh-tooltip.component';

@NgModule({
  declarations: [KhTooltipComponent],
  exports: [KhTooltipComponent],
  imports: [
    CommonModule
  ]
})
export class KhTooltipModule { }
