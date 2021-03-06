import {Component} from '@angular/core';
import {Subject} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap';
import {MapStructureConfiguration} from '@maps/models/map-structure-configuration.model';

@Component({
  selector: 'app-add-configuration',
  templateUrl: './add-configuration.component.html',
  styleUrls: ['./add-configuration.component.scss']
})
export class AddConfigurationComponent {
  name: string;
  result: Subject<string> = new Subject<string>();
  configExist: boolean = false;
  configurations: MapStructureConfiguration[];

  constructor(public bsModalRef: BsModalRef) {
  }


  onConfirm() {
    this.configExist = false;
    for (let i = 0, length = this.configurations.length; i < length; i++) {
      if (this.configurations[i].name === this.name) {
        this.configExist = true;
        setTimeout(() => {
          this.configExist = null;
        }, 3000);
        break;
      }
    }
    if (!this.configExist) {
      this.result.next(this.name);
      this.bsModalRef.hide();
    }
  }

  onClose() {
    this.bsModalRef.hide();
  }
}
