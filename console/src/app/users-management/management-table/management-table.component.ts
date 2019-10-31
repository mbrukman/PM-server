import { Component, Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
@Component({
  selector: 'app-management-table',
  templateUrl: './management-table.component.html',
  styleUrls: ['./management-table.component.scss']
})
export class ManagementTableComponent {
  elements = [];
  @Input('value') value;
  @Input('name') name;
  @Input('fields') fields: { label: string; value: string }[];
  @Input('resultCount') resultCount: number;
  @Input('isLazy') isLazy: boolean = true;
  @Output() delete: EventEmitter<string | object> = new EventEmitter<string | object>();
  @Output() edit: EventEmitter<string | object> = new EventEmitter<string | object>();
  @Output() load: EventEmitter<string | object> = new EventEmitter<any>();

  constructor() { }

  isArray(item: object) {
    return Array.isArray(item);
  }

  loadElementLazy(event: object) {
    this.load.emit(event);
  }

  onConfirmDelete(id: string) {
    this.delete.emit(id);
  }

  onEdit(id: string) {
    this.edit.emit(id);
  }

  showToolTip(e) {
    e.srcElement.children[0].style['display'] = 'block';
  }

  hideToolTip(e) {
    e.srcElement.children[0].style['display'] = 'none';
  }

}
