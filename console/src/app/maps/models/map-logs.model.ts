import { Map } from "./map.model";

export class MapExecutionLogs {
  id?: string;
  _id?: string;
  map: string | Map;
  runId: string;
  message: any;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

