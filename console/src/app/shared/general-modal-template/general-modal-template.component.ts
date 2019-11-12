import {Component, Input, OnInit} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';

@Component({
  selector: 'app-general-modal-template',
  templateUrl: './general-modal-template.component.html',
  styleUrls: ['./general-modal-template.component.scss']
})
export class GeneralModalTemplateComponent implements OnInit {

  @Input() modalRef: BsModalRef;
  @Input() modalTitle: string;


  constructor() { }

  ngOnInit() {
  }

}
