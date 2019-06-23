import { Map } from "./map.model";

export class MapExecutionLogs {
  id?: string;
  _id?: string;
  map: string | Map;
  message: any;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

