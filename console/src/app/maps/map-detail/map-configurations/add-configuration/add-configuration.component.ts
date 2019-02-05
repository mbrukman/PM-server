import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'app-add-configuration',
  templateUrl: './add-configuration.component.html',
  styleUrls: ['./add-configuration.component.scss']
})
export class AddConfigurationComponent {
  name: string;
  result: Subject<string> = new Subject<string>();

  constructor(public bsModalRef: BsModalRef) { }

  onClose(emit: boolean) {
    if (emit)
      this.result.next(this.name);
    this.bsModalRef.hide();
  }


}
