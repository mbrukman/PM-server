import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { MapsService } from '@maps/maps.service';
import { Map } from '@maps/models/map.model';
import { IProcessList } from '@maps/interfaces/process-list.interface';
import { MapResult, AgentResult, ProcessResult } from '@maps/models/execution-result.model';
import { SocketService } from '@shared/socket.service';
import { Agent } from '@agents/models/agent.model';
import { ProcessResultByProcessIndex } from '@maps/models';
import { BsModalService } from 'ngx-bootstrap';
import { RawOutputComponent } from '@shared/raw-output/raw-output.component';


@Component({
  selector: 'app-map-result',
  templateUrl: './map-result.component.html',
  styleUrls: ['./map-result.component.scss']
})
export class MapResultComponent implements OnInit, OnDestroy {
  map: Map;
  executionsList: MapResult[];
  selectedExecution: MapResult;
  selectedExecutionReq: any;
  selectedExecutionLogs: any[];
  selectedAgent: any = 'default';
  selectedProcess: ProcessResult[];
  agProcessesStatus: [{ name: string, value: number }];
  result: AgentResult[];
  agents: any;
  @ViewChild('rawOutput') rawOutputElm: ElementRef;
  mapSubscription: Subscription;
  mapExecutionSubscription: Subscription;
  mapExecutionResultSubscription: Subscription;
  mapExecutionMessagesSubscription: Subscription;
  pendingMessagesSubscriptions: Subscription;
  executing: string[] = [];
  pendingExecutions: string[];
  processesList: IProcessList[];
  agProcessStatusesByProcessIndex: ProcessResultByProcessIndex;
  view: number[] = [200, 200];
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936', '#3FC9EB']
  };

  constructor(private mapsService: MapsService, private socketService: SocketService, private modalService: BsModalService) {
  }

  ngOnInit() {
    // getting current map and requesting the executions list
    this.mapSubscription = this.mapsService.getCurrentMap()
      .filter(map => map)
      .do(map => this.map = map)
      .flatMap(map => this.mapsService.executionResults(map.id)) // request execution results list
      .subscribe(executions => {
        this.executionsList = executions;
        if (executions && executions.length) {
          this.selectExecution(executions[0].id);
        }
      });

    // getting the current executions list when initiating
    this.mapsService.currentExecutionList()
      .take(1)
      .subscribe(executions => this.executing = Object.keys(executions));

    // subscribing to executions updates.
    this.mapExecutionSubscription = this.socketService.getCurrentExecutionsAsObservable()
      .subscribe(executions => {
        this.executing = Object.keys(executions);
      });

    // subscribing to map executions results updates.
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

    // updating logs messages updates
    this.mapExecutionMessagesSubscription = this.socketService.getMessagesAsObservable()
      .filter(message => this.selectedExecution && (message.runId === this.selectedExecution.runId))
      .subscribe(message => {
        this.selectedExecutionLogs.push(message);
        this.scrollOutputToBottom();
      });

    this.pendingMessagesSubscriptions = this.socketService.getCurrentPendingAsObservable()
      .subscribe((message) => {
        if (!message.hasOwnProperty(this.map.id)) {
          this.pendingExecutions = [];
        } else {
          this.pendingExecutions = message[this.map.id];
        }
      });
  }

  ngOnDestroy() {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
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

  expandOutput(){
    let messages = []
    this.selectedExecutionLogs.forEach(item=>{messages.push(item.message)});
    const modal = this.modalService.show(RawOutputComponent);
    modal.content.messages = messages;
  }

  /**
   * Aggregating all processes and returning count for results graph.
   * @param results
   * @returns result
   */
  aggregateProcessStatuses(results) {
    let processes = [];
    results.forEach(res => {
      processes = [...processes, ...res.processes];
    });

    let ag = processes.reduce((total, current) => {
      if (!total[current.status]) {
        return total;
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
    return <[{ name: string, value: number }]>result; 
  }

  /**
   * Aggregating results status by processes indexes
   * @param results
   * @returns {ProcessResultByProcessIndex}
   */
  aggregateProcessStatusesByProcessIndex(results): ProcessResultByProcessIndex {
    let processes = [];
    results.forEach(res => {
      processes = [...processes, ...res.processes];
    });
    return processes.reduce((total, current) => {
      if (!total.hasOwnProperty(current.uuid)) {
        total[current.uuid] = {};
      }
      if (!total[current.uuid].hasOwnProperty(current.index)) {
        total[current.uuid][current.index] = [];
      }
      total[current.uuid][current.index].push(current.status);
      return total;
    }, {});
  }

  /**
   * Selecting execution and getting result from the server
   * @param executionId
   */
  selectExecution(executionId) {
    this.selectedProcess = null;
    this.selectedExecutionReq = this.mapsService.executionResultDetail(this.map.id, executionId)
      .do(result => {
        this.selectedExecution = result;

        this.agents = result.agentsResults.map(o => {
          return { label: o.agent ? (<Agent>o.agent).name : '', value: o };
        });

        if (this.agents.length > 1) { // if there is more than one agent, add an aggregated option.
          this.agents.unshift({ label: 'Aggregate', value: 'default' });
        }

        this.changeAgent();
      }).flatMap(result => this.mapsService.logsList((<string>result.map), result.runId)) // get the logs list for this execution
      .subscribe(logs => {
        this.selectedExecutionLogs = logs;
      });
  }

  scrollOutputToBottom() {
    this.rawOutputElm.nativeElement.scrollTop = this.rawOutputElm.nativeElement.scrollHeight;
  }

  /**
   * changing to the selected agent or to aggregated statuses
   */
  changeAgent() {
    let agentResult = this.selectedExecution.agentsResults.find((o) => {
      if (this.selectedAgent.agent) {
        return (<Agent>o.agent)._id === this.selectedAgent.agent._id;
      } else {
        return false;
      }
    });
    if (!agentResult) { // if not found it aggregate
      this.result = this.selectedExecution.agentsResults;
    } else {
      this.result = [agentResult];
    }
    this.generateProcessesList();
    this.agProcessesStatus = this.aggregateProcessStatuses(this.result);
    this.agProcessStatusesByProcessIndex = this.aggregateProcessStatusesByProcessIndex(this.result);
  }

  /**
   * Aggregates the results to generate processes list.
   */
  generateProcessesList() {
    function sortByDate(a, b) {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      if (dateA < dateB) {
        return -1;
      }
      if (dateA > dateB) {
        return 1;
      }
      return 0;
    }

    let processesList = [];
    this.result.forEach(res => {
      res.processes.map(o => {
        if (processesList.findIndex(k => o.uuid === k.uuid && o.index === k.index) === -1) {
          processesList.push(o);
        }
      });

    });
    let overall = processesList.reduce((total, current) => {
      total[current.uuid] = (total[current.uuid] || 0) + 1;
      return total;
    }, {});
    this.processesList = processesList
      .sort(sortByDate)
      .map(o => {
        return {
          name: (o.name) || 'Process #' + (Object.keys(overall).indexOf(o.uuid) + 1),
          index: o.index,
          uuid: o.uuid,
          overall: overall[o.uuid]
        };
      });

    if (processesList.length) {
      this.selectProcess(processesList[0]); // selecting the first process
    }
  }

  selectProcess(process) {
    let processes = [];
    this.result.forEach(res => {
      processes.push(res.processes.find(o => o.uuid === process.uuid && o.index === process.index));
    });
    this.selectedProcess = processes;
  }

  stopRun(runId: string) {
    this.mapsService.stopExecutions(this.map.id, runId).subscribe();
  }

  cancelPending(runId: string) {
    this.mapsService.cancelPending(this.map.id, runId).subscribe();
  }
}
