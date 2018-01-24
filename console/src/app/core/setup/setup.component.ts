import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SetupService } from './setup.service';
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

  constructor(private router: Router, private setupService: SetupService, private notificationService: SocketService) {
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
    this.setupReq = this.setupService.setupDbConnectionString(form)
      .subscribe(() => {
        this.notificationService.setNotification({
          title: 'Great! We are ready to go',
          msg: 'DB is now connected'
        });
        this.router.navigate(['/']);
      }, error => {
        console.log(error);
        this.notificationService.setNotification({
          title: 'No connection',
          msg: `We ran to an error trying to connect to the db: ${error}`
        });
      });
  }


}
