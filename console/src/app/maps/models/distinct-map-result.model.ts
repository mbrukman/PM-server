import {AgentResult} from '@maps/models/execution-result.model';

export class DistinctMapResult{
    id:string;
    project:{name:String}
    exec:{trigger:string,startTime:string,agentsResults?:AgentResult[]};
    count?:number;
    name?:string;
}