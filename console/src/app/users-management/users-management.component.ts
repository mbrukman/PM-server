import { Component, OnInit } from '@angular/core';
import { SeoService, PageTitleTypes } from '@app/seo.service';

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent implements OnInit {
  navItems: {
    name: string;
    routerLink: string[];
  }[];
  title: string = 'Users';

  constructor(private seoService: SeoService) {
    this.navItems = [
      { name: 'Dashboard', routerLink: ['*'] },
      { name: 'Users', routerLink: ['users'] },
      { name: 'Groups', routerLink: ['groups'] },
      { name: 'Policies', routerLink: ['policies'] }
    ];
  }

  ngOnInit() {
    this.seoService.setTitle(PageTitleTypes.UsersManagement);
  }

  changeCurrentTab(title) {
    this.title = title;
  }
}
