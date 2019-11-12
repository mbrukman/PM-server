import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-basic-input',
  templateUrl: './basic-input.component.html',
  styleUrls: ['./basic-input.component.scss']
})
export class BasicInputComponent implements OnInit {
  @Input() debounceTime?: number = 300;
  @Input() label?: string = '';
  @Input() placeholder?: string = '';
  @Output() public onChange? = new EventEmitter<any>(); // literally any type might be here.
  constructor() { }

  ngOnInit() {
  }

}
