import { Component, Input, OnInit } from '@angular/core';
import { IProcessList } from '@maps/interfaces/process-list.interface';

@Component({
  selector: 'app-process-list-item',
  templateUrl: './process-list-item.component.html',
  styleUrls: ['./process-list-item.component.scss']
})
export class ProcessListItemComponent implements OnInit{
  @Input('item') item : IProcessList;
  @Input('statuses') statuses: string[];
  isAllElementEqual:boolean = false;


  constructor() { }


  ngOnInit(){
    if(this.statuses.every( status => status === this.statuses[0])){
      this.isAllElementEqual = true;
    }
  }

  isWarning(status){
    return status == 'stopped' || status == 'skipped'
  }

}
