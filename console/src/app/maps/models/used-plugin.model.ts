import {IUsedPlugin} from '@maps/interfaces/map-structure.interface';

export class UsedPlugin implements IUsedPlugin {
  // tslint:disable-next-line:variable-name
  _id?: string;
  name: string;
  version: string;
}
