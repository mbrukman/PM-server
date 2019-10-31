import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Process } from '@maps/models';

@Component({
  selector: 'app-process-view',
  templateUrl: './process-view.component.html',
  styleUrls: ['./process-view.component.scss']
})
export class ProcessViewComponent implements OnInit, OnChanges {
  action: any;
  groups: { name: string, properties: string[] }[];
  @Input('process') process: Process;
  @Output() close: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
  }

  ngOnInit(): void {
    this.groups = [
      {
        name: 'Details',
        properties: ['name', 'description', 'uuid']
      },
      {
        name: 'Conditions',
        properties: ['mandatory', 'condition']
      },
      {
        name: 'Flow control',
        properties: ['flowControl', 'coordination']
      },
      {
        name: 'Hooks',
        properties: ['preRun', 'postRun']
      }
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.action = null;
  }

  showAction(index: number) {
    this.action = this.process.actions[index];
  }

  closePane() {
    if (this.action) {
      this.action = null;
    } else {
      this.close.emit();
    }
  }
}
