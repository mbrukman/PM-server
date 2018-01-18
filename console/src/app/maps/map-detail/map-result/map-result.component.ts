import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { MapsService } from '../../maps.service';
import { Map } from '../../models/map.model';
import { MapResult } from '../../models/execution-result.model';
import { SocketService } from '../../../shared/socket.service';
import { Agent } from '../../../agents/models/agent.model';
import { MapStructure } from '../../models/map-structure.model';

@Component({
  selector: 'app-map-result',
  templateUrl: './map-result.component.html',
  styleUrls: ['./map-result.component.scss']
})
export class MapResultComponent implements OnInit, OnDestroy {
  map: Map;
  mapSubscription: Subscription;
  executionListReq: any;
  executionsList: MapResult[];
  selectedExecution: MapResult;
  selectedExecutionReq: any;
  executionLogsReq: any;
  selectedExecutionLogs: any[];
  selectedAgent: string = 'aggregated';
  selectedProcess: any;
  agProcessesStatus: [{ name: string, value: number }];
  result: any;
  agents: any;
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936']
  };

  constructor(private mapsService: MapsService, private socketService: SocketService) {
  }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap().subscribe(map => {
      if (!map) {
        return;
      }
      this.map = map;
      this.getExecutionList();
    });
  }

  ngOnDestroy() {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
    if (this.executionListReq) {
      this.executionListReq.unsubscribe();
    }
  }

  changeAgent() {
    let agentResult = this.selectedExecution.agentsResults.find((o) => {
      return o.agent === this.selectedAgent;
    });
    if (!agentResult) {
      this.result = this.selectedExecution.agentsResults;
    } else {
      this.result = [agentResult];
    }
  }

  getExecutionList() {
    this.executionListReq = this.mapsService.executionResults(this.map.id).subscribe(executions => {
      this.executionsList = executions;
      this.selectExecution(executions[0].id);
    });
  }

  selectExecution(executionId) {
    this.selectedProcess = null;
    this.selectedExecutionReq = this.mapsService.executionResultDetail(this.map.id, executionId).subscribe(result => {
      this.selectedExecution = result;
      this.agents = result.agentsResults.map(o => {
        return { label: (<Agent>o.agent).name, value: o }
      });
      if (this.agents.length > 1 ) {
        this.agents.unshift({label: 'Aggregate', value: 'default'})
      }
      this.changeAgent();
      this.executionLogsReq = this.mapsService.logsList(this.map.id, this.selectedExecution.runId).subscribe(logs => {
        this.selectedExecutionLogs = logs;
      });
      let processes = [];
      result.agentsResults.forEach(agent => {
        processes = [...processes, ...agent.processes];
      });
      this.aggregateProcessesStatus(processes);
    }, error => {
      this.socketService.setNotification({ title: 'Connection error', message: 'couldn\'t connect to server' });
    });

  }

  aggregateProcessesStatus(processes) {
    let ag = processes.reduce((total, current) => {
      if (!total[current.status]) {
        return total
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
    this.agProcessesStatus = <[{ name: string, value: number }]>result;
    this.selectProcess((<MapStructure>this.selectedExecution.structure).processes[0]);
  }

  selectProcess(process) {
    this.selectedProcess = process;
  }

}
