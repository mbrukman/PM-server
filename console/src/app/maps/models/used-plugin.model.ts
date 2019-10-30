import {IUsedPlugin} from '@maps/interfaces/map-structure.interface';

export class UsedPlugin implements IUsedPlugin {
  _id?: string;
  name: string;
  version: string;
}
