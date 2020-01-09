import {TermsOfUseDTOInterface} from '@app/services/terms-of-use/terms-of-use.interface';

export class TermsOfUseModel {
  isAccepted: boolean = false;
  constructor(data: TermsOfUseDTOInterface) {
    this.isAccepted = data.isAccepted;
  }
}
