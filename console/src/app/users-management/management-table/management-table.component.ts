import { Component, Input, OnChanges, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
@Component({
  selector: 'app-management-table',
  templateUrl: './management-table.component.html',
  styleUrls: ['./management-table.component.scss']
})
export class ManagementTableComponent implements OnChanges {
  elements = [];
  @Input('value') value;
  @Input('name') name;
  @Input('fields') fields: { label: string; value: string }[];
  @Input('resultCount') resultCount: number;
  @Input('isLazy') isLazy: boolean = true;
  @Output() delete: EventEmitter<any> = new EventEmitter<any>();
  @Output() edit: EventEmitter<any> = new EventEmitter<any>();
  @Output() load: EventEmitter<any> = new EventEmitter<any>();

  constructor() {}

  ngOnChanges() {
    if (this.name === 'policies' && this.value) {
      this.elements = [...this.mapperResult([...this.value])];
    } else {
      this.elements = [...this.value];
    }
  }

  isArray(item) {
    return Array.isArray(item);
  }

  loadElementLazy(event) {
    this.load.emit(event);
  }

  onConfirmDelete(id) {
    this.delete.emit(id);
  }

  onEdit(i) {
    this.edit.emit(i);
  }

  mapperResult(element) {
    let elements = [];
    for (let i = 0, length = element.length; i < length; i++) {
      elements[i] = { ...element[i] };
      elements[i].permission = this.getOperationName(element[i].operation);
      elements[i].entityId = element[i].entityId || 'All';
    }
    return elements;
  }

  getOperationName(number) {
    switch (number) {
      case 1:
        return 'Read';
      case 2:
        return 'Execute';
      case 3:
        return 'Write';
      case 4:
        return 'Admin';
      default:
        return number;
    }
  }
}
