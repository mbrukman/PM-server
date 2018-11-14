export class MapStructureConfiguration {
  name: string;
  value: object | string;
  selected?: boolean;

  constructor(name?, value?) {
    this.name = name;
    this.value = value;
  }
}
