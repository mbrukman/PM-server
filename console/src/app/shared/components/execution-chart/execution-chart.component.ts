import { Component,Input, OnChanges } from '@angular/core';
import {MapResult, AgentResult} from '@maps/models/execution-result.model';

@Component({
  selector: 'app-execution-chart',
  templateUrl: './execution-chart.component.html',
  styleUrls: ['./execution-chart.component.scss']
})
export class ExecutionChartComponent implements OnChanges {
  @Input('result') result :MapResult ;
  @Input('size') size:number[] = [200,200];
  status : [{ name: string, value: number }];
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936']
  };

  ngOnChanges(){
    Object.assign(this.result,this.result.map)
    let processes = [];
    if(!this.result.agentsResults){ 
      this.status = this.aggregateProcessesStatus(this.result); 
    }
    else {
      this.result.agentsResults.forEach(agent => {
        processes = [...processes, ...agent.processes];
        this.status = this.aggregateProcessesStatus(processes);
      });
    }
  }

  aggregateProcessesStatus(processes) {
    let ag = processes.reduce((total, current) => {
      if (!total[current.status]) {
        return total;
      } 
      if(current.status == 'partial'){
        current.actions.forEach((action) => {
            action.status == 'success' ?  total['success'].value++ : total['error'].value++;
        });
        return total;
      }
      else{
        total[current.status].value = (total[current.status].value || 0) + 1;
        return total;
      }
    }, {
        success: { name: 'success', value: 0 },
        error: { name: 'error', value: 0 },
        stopped: { name: 'stopped', value: 0 },
        partial: { name: 'partial', value: 0 },
      });
    let result = Object.keys(ag).map((key) => {
      return ag[key];
    });
    return <[{ name: string, value: number }]>result;
  }
}