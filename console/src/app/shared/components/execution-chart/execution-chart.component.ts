import { Component,Input, OnChanges } from '@angular/core';
import {MapResult, AgentResult, ProcessResult} from '@app/services/map/models/execution-result.model';

@Component({
  selector: 'app-execution-chart',
  templateUrl: './execution-chart.component.html',
  styleUrls: ['./execution-chart.component.scss']
})
export class ExecutionChartComponent implements OnChanges {
  @Input('result') result : ProcessResult[] ;
  @Input('size') size:number[] = [200,200];
  status : [{ name: string, value: number }];
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936','#3FC9EB','#ebb936']
  };

  ngOnChanges(){
    this.status = this.aggregateProcessesStatus(this.result);
  }

  aggregateProcessesStatus(processes) {
    let skipped = 0;
    if(!processes){return}
    let ag = processes.reduce((total, current) => {
      if (!total[current.status]) {
        return total;
      }
      if((typeof current.result == 'string' && current.status == 'error') || current.message == "Process didn't pass condition"){
        skipped++;
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
        skipped: { name: 'skipped', value: 0 },
      });
    let result = Object.keys(ag).map((key) => {
      return ag[key];
    });
    if(result.every(item => item.value == 0)){
      result[result.findIndex(item => item.name == 'skipped')].value = skipped;
    }
    return <[{ name: string, value: number }]>result;
  }
}
