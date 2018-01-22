import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/debounceTime';


@Directive({
  selector: '[inlineEdit]'
})
export class InlineEditDirective implements AfterViewInit, OnChanges {
  inputEvent: any;
  @Input('inlineEdit') model: any;
  @Output('inlineEditChange') onChange: EventEmitter<any> = new EventEmitter();
  @Output('valueChanged') update: EventEmitter<any> = new EventEmitter();

  constructor(private elm: ElementRef, private renderer: Renderer2) {
    this.renderer.setAttribute(this.elm.nativeElement, 'contenteditable', 'true')
    this.renderer.addClass(this.elm.nativeElement, 'pm-inline-edit')
  }

  ngAfterViewInit() {
    this.registerInputEvent();
  }

  ngOnChanges(change: SimpleChanges) {
    this.elm.nativeElement.innerText= this.model;
  }

  registerInputEvent() {
    this.inputEvent = Observable.fromEvent(this.elm.nativeElement, 'blur')
      .map(e => (<any>e).target.innerText)
      .distinctUntilChanged()
      .subscribe(e => {
        this.model = e;
        this.onChange.emit(e);
        this.update.emit(e);
      })
  }
}
