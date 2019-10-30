import { Component, ElementRef, OnDestroy, OnInit, ViewChild, Host } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapsService } from '@app/services/map/maps.service';
import { Map } from '@app/services/map/models/map.model';
import { IProcessList } from '@maps/interfaces/process-list.interface';
import { MapResult, AgentResult, ProcessResult } from '@app/services/map/models/execution-result.model';
import { SocketService } from '@shared/socket.service';
import { Agent } from '@app/services/agent/agent.model';
import { ProcessResultByProcessIndex } from '@maps/models';
import { PopupService } from '@shared/services/popup.service'
import { RawOutputComponent } from '@shared/raw-output/raw-output.component';
import { filter, take, tap, mergeMap } from 'rxjs/operators';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';


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
  processIndex: number;
  agProcessesStatus: [{ name: string, value: number }];
  result: AgentResult[];
  agents: any;
  @ViewChild('rawOutput') rawOutputElm: ElementRef;
  mapSubscription: Subscription;
  mapExecutionSubscription: Subscription;
  mapExecutionResultSubscription: Subscription;
  mapExecutionMessagesSubscription: Subscription;
  pendingMessagesSubscriptions: Subscription;
  actionExecutionResultSubscription: Subscription;
  executing: string[] = [];
  pendingExecutions: string[];
  page: number = 1;
  processesList: IProcessList[];
  agProcessStatusesByProcessIndex: ProcessResultByProcessIndex;
  pieChartExecution: ProcessResult[];
  colorScheme = {
    domain: ['#42bc76', '#f85555', '#ebb936', '#3FC9EB']
  };

  ongoingExecutionSocket;
  constructor(private route: ActivatedRoute, private router: Router, private mapsService: MapsService, private socketService: SocketService, private popupService: PopupService) {
  }

  ngOnInit() {

    // getting current map and requesting the executions list
    this.mapSubscription = this.mapsService.getCurrentMap().pipe(filter(map => map)).subscribe(map => {
      this.map = map;
      this.loadResultOnScroll(map)
    });


    // subscribing to executions updates.
    this.mapExecutionSubscription = this.socketService.getCurrentExecutionsAsObservable()
      .subscribe(executions => {
        this.executing = Object.keys(executions);
      });
    // subscribing to map executions results updates.
    this.mapExecutionResultSubscription = this.socketService.getMapExecutionResultAsObservable().pipe(
      filter(result => (<string>result.map) === this.map.id)
    ).subscribe(result => {
      let execution = this.executionsList.find((o) => o._id === result._id);
      if (!execution) {
        delete result.agentsResults;
        this.executionsList.unshift(result);
      }
    });

    // updating logs messages updates
    this.mapExecutionMessagesSubscription = this.socketService.getLogExecutionAsObservable().pipe(
      filter(message => this.selectedExecution && (message.runId === this.selectedExecution.id))
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

      this.route.data.subscribe(data => {
        this.selectedExecution = data.execution['selectedExecution'];
        this.executing = Object.keys(data.execution['onGoing']);
        this.selectExecution(this.selectedExecution);
      })
  }

  loadResultOnScroll(map = this.map) {
    this.mapsService.executionResults(map.id, this.page)
      .subscribe(executions => {
        if (executions.length < this.load_results) {
          this.maxLengthReached = true
        }
        this.executionsList.push(...executions);
      })
  }

  onScroll() {
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
    if(this.ongoingExecutionSocket){
      this.socketService.closeSocket(this.ongoingExecutionSocket.nsp)
    }
  }


  expandOutput() {
    let messages = []
    this.selectedExecutionLogs.forEach(item => { messages.push(item.message) });
    this.popupService.openComponent(RawOutputComponent, { messages: messages })
  }

  buildExecutionFromSocket(selectedExecution,result){

    let agentIndex = selectedExecution.agentsResults.findIndex(agent => agent.agent['_id'] == result.agent._id);
    if(agentIndex == -1){
      let process = result.process;
      process['actions'] = [result.action];
      let agentResult = {
        agent:result.agent,
        processes:[process]
      };
      selectedExecution.agentsResults.push(<AgentResult>agentResult);
    }
    else{
      let isProcessFound;
      let sameProcessIndex = -1;
      selectedExecution.agentsResults[agentIndex].processes.forEach((process,index) => {
        if(process.uuid == result.process.uuid){
          isProcessFound = true;
          if(result.process.index == process.index){
            sameProcessIndex = index;
          }
        }
      })
      if(!isProcessFound || sameProcessIndex == -1){
        let process = result.process;
        process['actions'] = result.action ? [result.action] : [];
        selectedExecution.agentsResults[agentIndex].processes.push(<ProcessResult>process)
      }
      else{
          selectedExecution.agentsResults[agentIndex].processes[sameProcessIndex].actions.push(result.action);
      }
    }

    selectedExecution.startTime = this.selectedExecution ? (this.selectedExecution.startTime || result.action.startTime) : result.action.startTime;
    return selectedExecution;
  }


  agentsConfiguration(){
    this.agents = this.selectedExecution.agentsResults.map(agentResult => {
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
  }

  setActionToSelectedExecution(selectedExecution,action){
    selectedExecution = this.buildExecutionFromSocket(selectedExecution,action);
    this.selectedExecution = this._mapperResult(selectedExecution);
    this.agentsConfiguration();
  }

  gotoExecution(executionId) {
    this.router.navigate(['results', executionId], { relativeTo: this.route.parent });
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
  selectExecution(execution : MapResult) {
    if(!execution){return }

    let selectedExecution = null;
    if(this.ongoingExecutionSocket){
        this.socketService.closeSocket(this.ongoingExecutionSocket.nsp)
    }
    this.gotoExecution(execution.id);
    if(this.executing.indexOf(execution.id) > -1){ //if ongoing
      this.ongoingExecutionSocket = this.socketService.addNewSocket("execution-update-"+execution.id);
      this.processesList = [];
      this.selectedProcess = null;
      this.selectedExecutionLogs = [];
      this.ongoingExecutionSocket.on('updateAction',(action) => {
        this.setActionToSelectedExecution(this.selectedExecution,action);
      });
      this.ongoingExecutionSocket.on('updateActions',(actions) => {

          let exec = {
            agentsResults:[],
            id:execution.id,
            structure:execution.structure,
            trigger:execution.trigger
          }
          selectedExecution = <MapResult> exec;
          this.selectedExecution = selectedExecution;
          actions.forEach(action => {
            this.setActionToSelectedExecution(selectedExecution,action)
            //TODO: ask David why
            this.selectedExecution.agentsResults.forEach(agent => {
                this.selectedProcess.push(agent.processes[0])
            })
          })

      });

      this.ongoingExecutionSocket.on('updateFinishTime',(data) => {
        this.selectedExecution.finishTime = data.execution;
        if(data.process){
          for(let i=0,length = this.selectedExecution.agentsResults.length;i<length;i++){
            let agent = this.selectedExecution.agentsResults[i];
            for(let j=0,length = agent.processes.length;j<length;j++){
              let process = agent.processes[j];
              if(process.uuid == data.process.uuid){
                process.finishTime = data.process.finishTime;
                break;
              }
            }
          }
        }
      });

    }
    else{
      this.selectedExecutionLogs = [];
      this.selectedProcess = null;
      this.agentsConfiguration();
      this.mapsService.logsList((<string>execution.map), execution._id // get the logs list for this execution
      ).subscribe(logs => {
        this.selectedExecutionLogs = logs;
      });
    }



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
    let resultProcess = [];
    processes.forEach((process) => {
      if(process.uuid == uuid){
        resultProcess.push(process)
      }
    })
    return resultProcess;
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


  _mapperResult(execResult, processNames=null) {
    let newResult = Object.assign({},execResult)
    if(!execResult.agentsResults){return }
    execResult.agentsResults.forEach((agentResult, agentIndex) => {
        agentResult.processes.forEach((process, processIndex) => {
            process = Object.assign({},process)
            let processResult = []
            let statuses = [];
            process.actions.forEach(action => {

                  statuses.push(action.status)
                  if(!action.result){
                      action.result = {stdout:action.status}
                  }
                  processResult.push(action.result)

            })
            let processStatus = 'error'
            let mapS = {}
            if(statuses){
                statuses.map(s => {
                  if(s){
                    mapS[s] = 1
                  }
                 })
                if (mapS['error'] && mapS['success']) { processStatus = 'partial' }
                else if (!mapS['error'] && Object.keys(mapS).length) { processStatus = 'success' }
                process.status = processStatus
            }

            process.result = processResult
            processNames ? process.name = processNames[process.uuid] : null
            newResult.agentsResults[agentIndex].processes[processIndex] = process
        })
    })
    return newResult
  }
}
