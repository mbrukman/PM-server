import { ActionResult } from "./execution-result.model";

export class ActionResultView {
    action : ActionResult;
    agentKey : string;
    key: string;
    
    constructor(action : ActionResult ,  agentKey : string ){
        this.action = action;
        this.agentKey = agentKey
        this.key = this.action.action + "_" + this.agentKey;
    }
  }

