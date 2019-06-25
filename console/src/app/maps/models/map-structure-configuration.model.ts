import { de } from 'ngx-bootstrap';

export class MapStructureConfiguration {
  name: string;
  value: object | string;
  default:boolean = false;
 
  constructor(name?, value?,isDefault?) {
    this.name = name;
    this.value = value;
    this.default = isDefault;
  }
}
