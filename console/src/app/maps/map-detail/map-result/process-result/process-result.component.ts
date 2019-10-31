import {Component, Input, OnChanges} from '@angular/core';
import * as moment from 'moment';
import {RawOutputComponent} from '@shared/raw-output/raw-output.component';
import {PopupService} from '@shared/services/popup.service';
import {AgentResult, ProcessResult} from '@app/services/map/models/execution-result.model';
import {ActionResultView} from '@maps/models';
import {Agent} from '@app/services/agent/agent.model';


@Component({
  selector: 'app-process-result',
  templateUrl: './process-result.component.html',
  styleUrls: ['./process-result.component.scss']
})
export class ProcessResultComponent implements OnChanges {
  @Input('process') process: ProcessResult[];
  @Input('result') result: AgentResult[];
  aggregate: boolean;
  actions: ActionResultView[];
  generalInfo: ProcessResult;
  agProcessActionsStatus: any;
  agActionsStatus: any;


  constructor(private popupService: PopupService) {
  }

  ngOnChanges() {
    this.aggregate = this.result.length > 1;
    this.agProcessActionsStatus = null;
    this.agActionsStatus = null;
    this.generalInfo = null;
    this.aggregateProcessActionResults();
    if (this.process.length === 1) {
      this.generalInfo = this.result[0].processes.find(o => o.uuid === this.process[0].uuid && o.index === this.process[0].index);
    }
  }


  isObject(item) {
    return typeof item === 'object';
  }

  expandOutput(action: ActionResultView) {
    const messages = [];
    const results = this.agActionsStatus[action.key].results;
    const msgs = [];
    results.stdout.forEach(text => {
      msgs.push(text);
    });
    results.stderr.forEach(text => {
      msgs.push(text);
    });

    results.result.forEach(res => {
      if (typeof res === 'string') {
        msgs.push(res);
      } else {
        msgs.push(JSON.stringify(res));
      }
    });

    messages.push(msgs.join('\n'));
    this.popupService.openComponent(RawOutputComponent, {messages: messages});
  }


  aggregateProcessActionResults() {
    const actions = [];
    this.process.forEach(process => {
      let agent: Agent;
      for (let i = 0, length = this.result.length; i < length; i++) {
        if ((<Agent>(this.result[i].agent)).id === process.agentKey) {
          agent = <Agent>this.result[i].agent;
          break;
        }
      }
      for (let i = 0, length = process.actions.length; i < length; i++) {
        if (!process.actions[i].finishTime) {
          continue;
        }
        actions.push(new ActionResultView(process.actions[i], agent));
      }
    });
    this.actions = actions;

    // aggregating status for each action
    const agActions = this.actions.reduce((total, current) => {
      if (!total[current.key]) {
        total[current.key] = {
          status: {success: 0, error: 0, stopped: 0},
          results: {result: [], stderr: [], stdout: []},
          startTime: new Date(),
          finishTime: new Date('1994-12-17T03:24:00')
        };
      }
      total[current.key]['status'][current.action.status] = (total[current.key][current.action.status] || 0) + 1;
      if (current.action.result) {

        total[current.key]['results']['result'].push(current.action.result.result);
        total[current.key]['results']['stderr'].push(current.action.result.stderr);
        total[current.key]['results']['stdout'].push(current.action.result.stdout);
      }
      total[current.key]['startTime'] = moment(current.action.startTime).isBefore(moment(total[current.key]['startTime'])) ? current.action.startTime : total[current.key]['startTime'];
      total[current.key]['finishTime'] = moment(current.action.finishTime).isAfter(moment(total[current.key]['finishTime'])) ? current.action.finishTime : total[current.key]['finishTime'];
      return total;
    }, {});
    Object.keys(agActions).map((o) => {
      agActions[o].total = this.calculateFinalStatus(agActions[o].status);
      // formatting for graph
      agActions[o].status = Object.keys(agActions[o].status).map((key) => {
        return {name: key, value: agActions[o].status[key]};
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
}
