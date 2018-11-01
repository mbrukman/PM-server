import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnChanges, Output, Renderer2, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { distinctUntilChanged } from 'rxjs/operators';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/debounceTime';


@Directive({
  selector: '[inlineEdit]'
})
export class InlineEditDirective implements AfterViewInit, OnChanges {
  inputEvent: any;
  @Input('inlineEdit') model: any;
  @Output('inlineEditChange') inlineEditChange: EventEmitter<any> = new EventEmitter();
  @Output('valueChanged') valueChanged: EventEmitter<any> = new EventEmitter();

  constructor(private elm: ElementRef, private renderer: Renderer2) {
    this.renderer.setAttribute(this.elm.nativeElement, 'contenteditable', 'true');
    this.renderer.addClass(this.elm.nativeElement, 'pm-inline-edit');
  }

  ngAfterViewInit() {
    this.registerInputEvent();
  }

  ngOnChanges(change: SimpleChanges) {
    this.elm.nativeElement.innerText = this.model;
  }

  registerInputEvent() {
    this.inputEvent = Observable.fromEvent(this.elm.nativeElement, 'blur')
      .map(e => (<any>e).target.innerText)
      .pipe(distinctUntilChanged())
      .subscribe(e => {
        this.model = e;
        this.inlineEditChange.emit(e);
        this.valueChanged.emit(e);
      });
  }
}
