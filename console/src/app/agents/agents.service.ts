import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

import { TreeNode } from "primeng/primeng";
import * as _ from "lodash";

import { Agent } from "./models/agent.model";

const serverUrl = environment.serverUrl;

@Injectable()
export class AgentsService {

  constructor(private http: HttpClient) {
  }

  buildAgentsTree(nodes, parent = "-1"): TreeNode[] {
    // By defult, to level nodes parent is -1.
    // The function return a nested array tree of the snodes.
    let tree: TreeNode[] = [];

    let nodesClone = _.cloneDeep(nodes);
    for (let i in nodes) {
      if (!nodes[i].parent) {
        nodes[i].parent = "-1";
      }
      if (nodes[i].parent == parent) {
        let children = this.buildAgentsTree(nodes, nodes[i].id);
        nodesClone[i] = { data: nodesClone[i] };
        if (children.length) {
          nodes[i].children = children;
          nodesClone[i].children = children;
        }
        tree.push(nodesClone[i]);
      }
    }
    return tree
  }

  delete(agentId) {
    return this.http.delete(serverUrl + "api/agents/" + agentId + "/delete", { responseType: 'text' as 'json' })
  }

  list() {
    return this.http.get<[Agent]>(serverUrl + "api/agents")
  }

  status() {
    return this.http.get<any>(serverUrl + "api/agents/status")
  }

  update(agent) {
    return this.http.put<Agent>(serverUrl + "api/agents/" + agent._id + "/update", agent);
  }

}
