import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges
} from '@angular/core';

@Directive({
  selector: '[appPermissionsCheck]',
  providers: []
})
export class PermissionsCheckDirective implements AfterViewInit, OnChanges {
  inputEvent: any;
  @Input('inlineEdit') model: any;

  constructor(private elm: ElementRef, private renderer: Renderer2) {
    this.renderer.setAttribute(this.elm.nativeElement, 'contenteditable', 'true');
    this.renderer.addClass(this.elm.nativeElement, 'pm-inline-edit');
  }

  ngAfterViewInit() {
  }

  ngOnChanges(change: SimpleChanges) {
    this.elm.nativeElement.innerText = this.model;
  }

}
