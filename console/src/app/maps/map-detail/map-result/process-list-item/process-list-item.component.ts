import { Component, Input, OnInit } from '@angular/core';
import { IProcessList } from '@maps/interfaces/process-list.interface';
import { ItemComponent } from '@swimlane/ngx-dnd';

@Component({
  selector: 'app-process-list-item',
  templateUrl: './process-list-item.component.html',
  styleUrls: ['./process-list-item.component.scss']
})
export class ProcessListItemComponent implements OnInit{
  @Input('item') item : IProcessList;
  @Input('processes') processes: any;
  statuses:string[];
  isAllElementEqual:boolean = false;


  constructor() { }


  ngOnInit(){
    this.statuses = this.aggregateProcesseStatus()[this.item.index];
    if(this.statuses.every( status => status === this.statuses[0])){
      this.isAllElementEqual = true;
    }
  }

  aggregateProcesseStatus(){

    return this.processes.reduce((total, current) => {
      if (!total.hasOwnProperty(current.index)) {
        total[current.index] = [];
      }

      if(typeof current.result == 'string' || current.message == "Process didn't pass condition"){
        total[current.index].push('skipped')
      }
      else{
        total[current.index].push(current.status);
      }
      return total;
    }, {});
  }

  isWarning(status){
    return status == 'stopped' || status == 'skipped'
  }

}
