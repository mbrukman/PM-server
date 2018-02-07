import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { MapsService } from '@maps/maps.service';
import { Map } from '@maps/models/map.model';
import { MapResult } from '@maps/models/execution-result.model';
import { SocketService } from '@shared/socket.service';
import { Agent } from '@agents/models/agent.model';
import { MapStructure } from '@maps/models/map-structure.model';

@Component({
  selector: 'app-map-result',
  templateUrl: './map-result.component.html',
  styleUrls: ['./map-result.component.scss']
})
export class MapResultComponent implements OnInit, OnDestroy {
  map: Map;
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
  @ViewChild('rawOutput') rawOutputElm: ElementRef;
  mapSubscription: Subscription;
  mapExecutionSubscription: Subscription;
  mapExecutionResultSubscription: Subscription;
  mapExecutionMessagesSubscription: Subscription;
  executing: string[] = [];
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936', '#3FC9EB']
  };

  constructor(private mapsService: MapsService, private socketService: SocketService) {
  }

  ngOnInit() {
    this.mapSubscription = this.mapsService.getCurrentMap()
      .filter(map => map)
      .subscribe(map => {
        this.map = map;
        this.getExecutionList();
      });

    this.mapExecutionSubscription = this.socketService.getCurrentExecutionsAsObservable().subscribe(executions => {
      this.executing = Object.keys(executions);
    });

    this.mapExecutionResultSubscription = this.socketService.getMapExecutionResultAsObservable()
      .filter(result => (<string>result.map) === this.map.id)
      .subscribe(result => {
        let execution = this.executionsList.find((o) => o.runId === result.runId);
        if (!execution) {
          delete result.agentsResults;
          this.executionsList.unshift(result);
        }

        if (this.selectedExecution.runId === result.runId) {
          this.selectExecution(result._id);
        }
      });

    this.mapExecutionMessagesSubscription = this.socketService.getMessagesAsObservable()
      .filter(message => this.selectedExecution && (message.runId === this.selectedExecution.runId))
      .subscribe(message => {
        this.selectedExecutionLogs.push(message);
        this.scrollOutputToBottom();
      });
  }

  ngOnDestroy() {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
    if (this.executionListReq) {
      this.executionListReq.unsubscribe();
    }
    if (this.mapExecutionSubscription) {
      this.mapExecutionSubscription.unsubscribe();
    }
    if (this.mapExecutionResultSubscription) {
      this.mapExecutionResultSubscription.unsubscribe();
    }
    if (this.mapExecutionMessagesSubscription) {
      this.mapExecutionMessagesSubscription.unsubscribe();
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
    this.aggregateProcessesStatus(this.getExecutionProcessesArray(this.result));
  }

  getExecutionList() {
    this.executionListReq = this.mapsService.executionResults(this.map.id)
      .filter(executions => executions && executions.length > 0)
      .subscribe(executions => {
        this.executionsList = executions;
        this.selectExecution(executions[0].id);
      });
  }

  getExecutionProcessesArray(agentsResults) {
    let processes = [];
    agentsResults.forEach(agent => {
      processes = [...processes, ...agent.processes];
    });
    return processes;
  }

  selectExecution(executionId) {
    this.selectedProcess = null;
    this.selectedExecutionReq = this.mapsService.executionResultDetail(this.map.id, executionId).subscribe(result => {
      this.selectedExecution = result;
      this.agents = result.agentsResults.map(o => {
        return { label: (<Agent>o.agent).name, value: o }
      });
      if (this.agents.length > 1) {
        this.agents.unshift({ label: 'Aggregate', value: 'default' })
      }
      this.changeAgent();
      this.executionLogsReq = this.mapsService.logsList(this.map.id, this.selectedExecution.runId).subscribe(logs => {
        this.selectedExecutionLogs = logs;
      });
      const processes = this.getExecutionProcessesArray(result.agentsResults);
      this.aggregateProcessesStatus(processes);
    }, error => {
      this.socketService.setNotification({ title: 'Connection error', message: 'couldn\'t connect to server' });
    });

  }

  stopRun(runId: string) {
    this.mapsService.stopExecutions(this.map.id, runId).subscribe();
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
      stopped: { name: 'stopped', value: 0 },
      partial: { name: 'partial', value: 0 }
    });
    let result = Object.keys(ag).map((key) => {
      return ag[key];
    });
    this.agProcessesStatus = <[{ name: string, value: number }]>result;
    let structure = this.selectedExecution.structure;
    if (structure) {
      this.selectProcess((<MapStructure>structure).processes[0])
    }
  }

  selectProcess(process) {
    this.selectedProcess = process;
  }

  scrollOutputToBottom() {
    this.rawOutputElm.nativeElement.scrollTop = this.rawOutputElm.nativeElement.scrollHeight;
  }

}
