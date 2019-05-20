import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapsService } from '@maps/maps.service';
import { Map } from '@maps/models/map.model';
import { IProcessList } from '@maps/interfaces/process-list.interface';
import { MapResult, AgentResult, ProcessResult } from '@maps/models/execution-result.model';
import { SocketService } from '@shared/socket.service';
import { Agent } from '@agents/models/agent.model';
import { ProcessResultByProcessIndex } from '@maps/models';
import {PopupService} from '@shared/services/popup.service'
import { RawOutputComponent } from '@shared/raw-output/raw-output.component';
import { filter, take, tap, mergeMap } from 'rxjs/operators';
import * as _ from 'lodash';

const defaultAgentValue = 'default'

@Component({
  selector: 'app-map-result',
  templateUrl: './map-result.component.html',
  styleUrls: ['./map-result.component.scss']
})


export class MapResultComponent implements OnInit, OnDestroy {
  load_results = 25;
  map: Map;
  executionsList: MapResult[] = [];
  selectedExecution: MapResult;
  maxLengthReached: boolean = false;
  selectedExecutionLogs: any[];
  selectedAgent: any = defaultAgentValue;
  selectedProcess: ProcessResult[];
  processIndex:number;
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
  page:number = 1;
  processesList: IProcessList[];
  agProcessStatusesByProcessIndex: ProcessResultByProcessIndex;
  pieChartExecution:ProcessResult[];
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936', '#3FC9EB']
  };

  constructor(private mapsService: MapsService, private socketService: SocketService, private popupService:PopupService) {
  }

  ngOnInit() {
    
    // getting current map and requesting the executions list
    this.mapSubscription = this.mapsService.getCurrentMap().pipe(filter(map=>map)).subscribe(map => {
        this.map= map;
        this.loadResultOnScroll(map)
      });

    // getting the current executions list when initiating
    this.mapsService.currentExecutionList().pipe(
      take(1)
    ).subscribe(executions => this.executing = Object.keys(executions));

    // subscribing to executions updates.
    this.mapExecutionSubscription = this.socketService.getCurrentExecutionsAsObservable()
      .subscribe(executions => {
        this.executing = Object.keys(executions);
      });

    // subscribing to map executions results updates.
    this.mapExecutionResultSubscription = this.socketService.getMapExecutionResultAsObservable().pipe(
      filter(result => (<string>result.map) === this.map.id)
    ).subscribe(result => {
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
    this.mapExecutionMessagesSubscription = this.socketService.getMessagesAsObservable().pipe(
      filter(message => this.selectedExecution && (message.runId === this.selectedExecution.runId))
    ).subscribe(message => {
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

  loadResultOnScroll(map = this.map){
    this.mapsService.executionResults(map.id,this.page)
    .subscribe(executions => {
      if(executions.length < this.load_results){
        this.maxLengthReached = true
      }
      this.executionsList.push(...executions);
      if (this.page == 1 && this.executionsList[0])
        this.selectExecution(this.executionsList[0]._id);
    })
  }

  onScroll(){
    this.page++;
    this.loadResultOnScroll();
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
    this.popupService.openComponent(RawOutputComponent,{messages:messages})
  }


  /**
   * Aggregating results status by processes indexes
   * @param results
   * @returns {ProcessResultByProcessIndex}
   */

  /**
   * Selecting execution and getting result from the server
   * @param executionId
   */
  selectExecution(executionId) {
    this.selectedProcess = null;
    this.mapsService.executionResultDetail(this.map.id, executionId).pipe(
      tap(result => {
        this.selectedExecution = result;

        this.agents = result.agentsResults.map(agentResult => {
          return { label: agentResult.agent ? (<Agent>agentResult.agent).name : '', value: agentResult };
        });

        if (this.agents.length > 1) { // if there is more than one agent, add an aggregated option.
          this.agents.unshift({ label: 'Aggregate', value: defaultAgentValue });
          this.selectedAgent = defaultAgentValue;
        }
        else if (this.agents.length){
          this.selectedAgent = this.agents[0].value
        }
        this.changeAgent();
      }),
      mergeMap(result => this.mapsService.logsList((<string>result.map), result.runId)) // get the logs list for this execution
    ).subscribe(logs => {
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
    
    this.pieChartExecution = [];
    if (!agentResult) { // if not found it aggregate
      this.result = this.selectedExecution.agentsResults;
      this.selectedExecution.agentsResults.forEach(agent => {
        this.pieChartExecution.push(...agent.processes)
      })
      
    } else {
      this.pieChartExecution.push(...agentResult.processes)
        this.result = [agentResult];
    }
    this.generateProcessesList();
  } 

  resultsByProcessUuid(uuid){
    let processes = [];
    this.result.forEach(res => {
      processes = [...processes, ...res.processes];
    });
    let processUuid = [];
    processes.forEach((process) => {
      if(process.uuid == uuid){
        processUuid.push(process)
      }
    })
    return processUuid;
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
          overall: overall[o.uuid],
        };
      });

    if (processesList.length) {
      this.selectProcess(processesList[0]); // selecting the first process
    }
  }

  selectProcess(process,i=0) {
    let processes = [];
    this.result.forEach(res => {
      res.processes.forEach(o=>{
        if(o.uuid === process.uuid && o.index === process.index){
          res.agent? processes.push({...o, agentKey: (<Agent>res.agent).id})  : null  
        }
      })
    });
    this.selectedProcess = processes;
    this.processIndex = i;
  }

  stopRun(runId: string) {
    this.mapsService.stopExecutions(this.map.id, runId).subscribe();
  }

  cancelPending(runId: string) {
    this.mapsService.cancelPending(this.map.id, runId).subscribe();
  }
}
