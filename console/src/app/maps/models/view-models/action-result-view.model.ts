import {ActionResult} from '@app/services/map/models/execution-result.model';
import {Agent} from '@app/services/agent/agent.model';

export class ActionResultView {
  key: string;

  constructor(
    public action: ActionResult,
    public agent: Agent
  ) {
    this.key = `${this.action.action}_${this.agent.id}${action.finishTime}`;
  }
}

