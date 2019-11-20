import { Component, OnInit } from '@angular/core';
import { SeoService, PageTitleTypes } from '@app/seo.service';
import { NavItemInterface } from './interfaces/nav-item.interface';
@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent implements OnInit {
  navItems: Array<NavItemInterface>;
  title: string = 'Users';

  constructor(private seoService: SeoService) {
    this.navItems = [
      { name: 'Dashboard', routerLink: ['*'] },
      { name: 'Users', routerLink: ['users'] },
      { name: 'Groups', routerLink: ['groups'] },
      { name: 'Plugin Policies', routerLink: ['policies'] }
    ];
  }

  ngOnInit() {
    this.seoService.setTitle(PageTitleTypes.UsersManagement);
  }

  changeCurrentTab(title) {
    this.title = title;
  }
}
