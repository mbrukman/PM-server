import { AfterContentInit, Component, OnChanges, SimpleChanges } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { Subject } from 'rxjs/Subject';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Configuration } from '@maps/models';

@Component({
  selector: 'app-add-configuration',
  templateUrl: './add-configuration.component.html',
  styleUrls: ['./add-configuration.component.scss']
})
export class AddConfigurationComponent implements AfterContentInit, OnChanges {
  ngOnChanges(changes: SimpleChanges): void {

    console.log(changes);
  }

  configuration: Configuration;
  forbiddenNames: string[];
  configurationForm: FormGroup;
  public result: Subject<any> = new Subject();

  constructor(public bsModalRef: BsModalRef) {
  }

  ngAfterContentInit() {
    this.configurationForm = new FormGroup({
      name: new FormControl(null, [Validators.required, this.forbiddenNameValidator()]),
      value: new FormControl(null, [Validators.required, this.validJSONValidator()])
    });

    setTimeout(() => {
      if (this.configuration) {
        this.setFormValue({
          name: this.configuration.name,
          value: this.configuration.value
        });
      }
    }, 0);
  }

  forbiddenNameValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (!this.forbiddenNames) {
        return null;
      }
      return this.forbiddenNames.indexOf(control.value) > -1 ? { 'forbiddenName': { value: control.value } } : null;
    };
  }

  validJSONValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      try {
        JSON.parse(control.value);
        return;
      } catch (e) {
        return { 'invalidJSON': { value: e.message } };
      }
    }
  }

  setFormValue(attribute: { name: string, value: object }) {
    this.configurationForm.setValue(attribute);
  }

  onConfirm(form: { name: string, value: string }): void {
    this.result.next({ name: form.name, value: JSON.parse(form.value), selected: this.configuration.selected });
    this.bsModalRef.hide();
  }

  onClose(): void {
    this.result.next();
    this.bsModalRef.hide();
  }

}
