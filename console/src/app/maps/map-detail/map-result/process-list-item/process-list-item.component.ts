import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-process-list-item',
  templateUrl: './process-list-item.component.html',
  styleUrls: ['./process-list-item.component.scss']
})
export class ProcessListItemComponent {
  @Input('item') item;
  @Input('statuses') statuses: string[];

  constructor() { }

}
