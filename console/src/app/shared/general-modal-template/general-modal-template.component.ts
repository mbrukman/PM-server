import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';


@Component({
  selector: 'app-general-modal-template',
  templateUrl: './general-modal-template.component.html',
  styleUrls: ['./general-modal-template.component.scss']
})
export class GeneralModalTemplateComponent implements OnInit {

  @Input() modalRef: BsModalRef;
  @Input() modalTitle: string;
  @Input() disabledCond: boolean;
  @Output() action: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
  }

  onAction(action): void{
    this.action.emit(action);
  }

}
