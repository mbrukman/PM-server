import { IMap } from "../interfaces/map.interface";
import { Agent } from "../../agents/models/agent.model";

export class Map implements IMap {
  id?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  licence?: string;
  archived: boolean;
  agents?: [Agent];
}
