import { ActionResult } from "../execution-result.model";
import { Agent } from '@agents/models/agent.model';

export class ActionResultView {
    key: string;
    selected?:boolean
    constructor(public action : ActionResult , public agent : Agent ){
        this.key = this.action.action + "_" + this.agent.key;
    }
  }

