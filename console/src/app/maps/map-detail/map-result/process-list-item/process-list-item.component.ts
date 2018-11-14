import { Component, Input } from '@angular/core';
import { IProcessList } from '@maps/interfaces/process-list.interface';

@Component({
  selector: 'app-process-list-item',
  templateUrl: './process-list-item.component.html',
  styleUrls: ['./process-list-item.component.scss']
})
export class ProcessListItemComponent {
  @Input('item') item : IProcessList;
  @Input('statuses') statuses: string[];

  constructor() { }

}
