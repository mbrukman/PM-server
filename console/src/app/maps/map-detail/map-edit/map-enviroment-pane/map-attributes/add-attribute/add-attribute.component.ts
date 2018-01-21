import { AfterContentInit, Component, OnInit } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap";
import { Subject } from "rxjs/Subject";
import { Attribute } from "../../../../../models/attribute.model";
import { FormControl, FormGroup, Validators, AbstractControl, ValidatorFn } from "@angular/forms";

@Component({
  selector: 'app-add-attribute',
  templateUrl: './add-attribute.component.html',
  styleUrls: ['./add-attribute.component.scss']
})
export class AddAttributeComponent implements AfterContentInit {
  attribute: Attribute;
  forbiddenNames: string[];
  attributeForm: FormGroup;
  public result: Subject<any> = new Subject();

  constructor(public bsModalRef: BsModalRef) {
  }

  ngAfterContentInit() {
    this.attributeForm = new FormGroup({
      name: new FormControl(null, [Validators.required, this.forbiddenNameValidator()]),
      value: new FormControl(null, Validators.required),
      type: new FormControl('string', Validators.required)
    });
    setTimeout(() => {
      if (this.attribute) {
        this.setFormValue({
          name: this.attribute.name,
          value: this.attribute.value,
          type: this.attribute.type
        });
      }
    }, 0);
  }

  forbiddenNameValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!this.forbiddenNames) {
        return null;
      }
      const index = this.forbiddenNames.indexOf(control.value);
      return index > -1 ? { 'forbiddenName': { value: control.value } } : null;
    };
  }

  setFormValue(attribute: { name: string, value: any, type: string }) {
    this.attributeForm.setValue(attribute);
  }

  onConfirm(form: Attribute): void {
    // TODO: add custom validator to check the json while user type it
    if (form.type === 'object') {
      try {
        form.value = JSON.parse(form.value);
      } catch (e) {

      }
    }
    this.result.next(form);
    this.bsModalRef.hide();
  }

  onClose(): void {
    this.bsModalRef.hide();
  }

}
