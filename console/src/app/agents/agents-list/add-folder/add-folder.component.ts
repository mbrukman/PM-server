import { Component } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap";
import { Subject } from "rxjs/Subject";

@Component({
  selector: 'app-add-folder',
  templateUrl: './add-folder.component.html',
  styleUrls: ['./add-folder.component.scss']
})
export class AddFolderComponent {
  public result: Subject<string> = new Subject<string>();
  name: string;
  constructor(public bsModalRef: BsModalRef) { }


  onConfirm() {
    this.result.next(this.name);
    this.onClose();
  }

  onClose() {
    this.bsModalRef.hide();
  }

}
