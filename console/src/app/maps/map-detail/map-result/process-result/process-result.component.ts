import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-process-result',
  templateUrl: './process-result.component.html',
  styleUrls: ['./process-result.component.scss']
})
export class ProcessResultComponent implements OnChanges {
  @Input('process') process: any;
  @Input('result') result: any;
  @Input('count') count: number;
  processResult: any;
  selectedProcess: any;
  agProcessActionsStatus: any;
  agActionsStatus: any;
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936']
  };

  constructor() {
  }

  ngOnChanges(changes) {
    this.agProcessActionsStatus = null;
    this.agActionsStatus = null;
    this.aggregateProcessActionResults(this.result);
    if (this.result.length === 1) {
      this.selectedProcess = this.result[0].processes.find((o) => {
        return o.process === this.process._id;
      });
    }
  }

  aggregateProcessActionResults(result) {
    let processes = [];
    let actions = [];
    result.forEach(agent => {
      let process = agent.processes.find((o) => {
        return o.process === this.process._id;
      });
      if (!process) {
        return;
      }
      processes.push(process);
      actions = [...actions, ...process.actions];
    });


    // aggregating actions status
    let agActionsStatus = actions.reduce((total, current) => {
      total[current.status] = (total[current.status] || 0) + 1;
      return total;
    }, { success: 0, error: 0 });

    // formatting for chart
    this.agProcessActionsStatus = Object.keys(agActionsStatus).map((o) => {
      return { name: o, value: agActionsStatus[o] };
    });

    // aggregating status for each action
    let agActions = actions.reduce((total, current) => {
      if (!total[current.action]) {
        total[current.action] = {
          status: { success: 0, error: 0 },
          results: { result: [], stderr: [], stdout: [] },
          startTime: new Date(),
          finishTime: new Date('1994-12-17T03:24:00')
        };
      }
      total[current.action]['status'][current.status] = (total[current.action][current.status] || 0) + 1;
      total[current.action]['results']['result'].push(current.result.result);
      total[current.action]['results']['stderr'].push(current.result.stderr);
      total[current.action]['results']['stdout'].push(current.result.stdout);
      total[current.action]['startTime'] = new Date(current.startTime) < total[current.action]['startTime'] ? current.startTime : total[current.action]['startTime'];
      total[current.action]['finishTime'] = new Date(current.finishTime) > total[current.action]['finishTime'] ? current.startTime : total[current.action]['finishTime'];
      return total;
    }, {});

    Object.keys(agActions).map((o) => {
      agActions[o].total = this.calculateFinalStatus(agActions[o].status);
      // formatting for graph
      agActions[o].status = Object.keys(agActions[o].status).map((key) => {
        return { name: key, value: agActions[o].status[key] }
      });
    });
    this.agActionsStatus = agActions;
  }

  calculateFinalStatus(agStatus: { success: number, error: number, partial?: number }): 'success' | 'partial' | 'error' {
    if ((agStatus.partial && agStatus.partial > 0) || (agStatus.success && agStatus.error)) {
      return 'partial';
    }
    return agStatus.success ? 'success' : 'error';
  }

  showProcessResult(result) {
    return typeof result === 'string';
  }
}
