import {AgentResult} from '@maps/models/execution-result.model';

export class DistinctMapResult{
    _id:string;
    project:{name:String}
    exec:{trigger:string,startTime:string,agentsResults?:AgentResult[]};
    map:{name:string};
}