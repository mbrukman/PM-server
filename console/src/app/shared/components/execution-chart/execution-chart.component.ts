import { Component,Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-execution-chart',
  templateUrl: './execution-chart.component.html',
  styleUrls: ['./execution-chart.component.scss']
})
export class ExecutionChartComponent implements OnChanges {
  @Input('execution') execution :any;
  @Input('size') size:number[] = [200,200];
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936']
  };

  ngOnChanges(){
    Object.assign(this.execution,this.execution.map)
    let processes = [];
    let execution = this.execution.exec ? this.execution.exec : this.execution;
    if(!execution.agentsResults){ //if the pie chart is from the process-result component
      processes = execution 
    }
    else {
      execution.agentsResults.forEach(agent => {
        processes = [...processes, ...agent.processes];
      });
    }
    this.execution.status = this.aggregateProcessesStatus(processes);
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