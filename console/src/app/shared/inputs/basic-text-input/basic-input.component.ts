import {Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-basic-input',
  templateUrl: './basic-input.component.html',
  styleUrls: ['./basic-input.component.scss']
})
export class BasicInputComponent implements OnInit {
  @Output() debounceTime?: number = 300;
  @Output() label?: string = '';
  @Output() public onChange? = new EventEmitter<string>();
  constructor() { }

  ngOnInit() {
  }

}
