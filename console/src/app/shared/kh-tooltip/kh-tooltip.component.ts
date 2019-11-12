import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-kh-tooltip',
  templateUrl: './kh-tooltip.component.html',
  styleUrls: ['./kh-tooltip.component.scss']
})
export class KhTooltipComponent implements OnInit {
  @Input() shouldShow: boolean = true;

  public show: boolean = false;

  constructor() { }

  ngOnInit() {
  }

  showToolTip(e: MouseEvent) {
    if (this.shouldShow) {
      this.show = true;
    }
  }

  hideToolTip($event: MouseEvent) {
    this.show = false;
  }
}
