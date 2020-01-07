export interface TosDTOInterface {
  isAccepted: boolean;
}

export class TosModel {
  isAccepted: boolean = false;
  constructor(data: TosDTOInterface) {
    this.isAccepted = data.isAccepted;
  }
}
