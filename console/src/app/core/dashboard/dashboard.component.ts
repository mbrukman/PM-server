import { Component, OnInit } from '@angular/core';
import { MapsService } from '../../maps/maps.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  executions: any;
  mode: string = 'grid';
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936']
  };
  constructor(private mapsService: MapsService) {
  }

  ngOnInit() {
    this.mapsService.getDistinctMapExecutionsResult(16).subscribe(executions => {
      this.executions = executions;
      executions.forEach(execution => {
        let processes = [];
        execution.exec.agentsResults.forEach(agent => {
          processes = [...processes, ...agent.processes];
        });
        execution.status = this.aggregateProcessesStatus(processes);
      });
    });
  }

  aggregateProcessesStatus(processes) {
    let ag = processes.reduce((total, current) => {
      if (!total[current.status]) {
        return total;
      }
      total[current.status].value = (total[current.status].value || 0) + 1;
      return total;
    }, {
        success: { name: 'success', value: 0 },
        error: { name: 'error', value: 0 },
        partial: { name: 'partial', value: 0 }
      });
    let result = Object.keys(ag).map((key) => {
      return ag[key];
    });
    return <[{ name: string, value: number }]>result;
  }


}
