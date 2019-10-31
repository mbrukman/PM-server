import { Map } from '@app/services/map/models/map.model';

export class MapExecutionLogs {
  id?: string;
  // tslint:disable-next-line:variable-name
  _id?: string;
  map: string | Map;
  message: any;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

