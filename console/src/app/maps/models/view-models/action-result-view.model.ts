import { ActionResult } from "../execution-result.model";
import { Agent } from '@agents/models/agent.model';

export class ActionResultView {
    key: string;
    constructor(public action : ActionResult , public agent : Agent ){
        this.key = this.action.action + "_" + this.agent.id;
    }
  }

