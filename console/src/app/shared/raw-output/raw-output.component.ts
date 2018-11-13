import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'app-raw-output',
  templateUrl: './raw-output.component.html',
  styleUrls: ['./raw-output.component.scss']
})
export class RawOutputComponent implements OnInit {

  messages: string [] ;
  constructor(public bsModalRef: BsModalRef) { }

  ngOnInit() {
  }


  closeModal() {
    this.bsModalRef.hide();

  }
}



