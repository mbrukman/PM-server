import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SettingsService } from './settings.service';
import { SocketService } from '../../shared/socket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit, OnDestroy {
  URIForm: FormGroup;
  setupReq: any;
  error: string;

  constructor(private router: Router, private settingsService: SettingsService, private notificationService: SocketService) {
  }

  ngOnInit() {
    this.initiateForm();
  }

  ngOnDestroy() {
    if (this.setupReq) {
      this.setupReq.unsubscribe();
    }
  }

  initiateForm() {
    this.URIForm = new FormGroup({
      uri: new FormControl(null, Validators.required)
    });
  }

  onSubmitForm(form) {
    this.setupReq = this.settingsService.setupDbConnectionString(form)
      .subscribe(() => {
        this.notificationService.setNotification({
          title: 'Great! We are ready to go',
          msg: 'DB is now connected'
        });
        this.router.navigate(['/']);
      }, error => {
        error = typeof error === 'object' ? JSON.stringify(error) : error;
        this.error = 'Error trying to connect to db';

        this.notificationService.setNotification({
          title: 'No connection',
          msg: `There was an error connecting to db: ${error}`
        });
      });
  }


}
