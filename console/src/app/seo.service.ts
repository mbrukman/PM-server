import { Injectable } from '@angular/core';
import { Title }     from '@angular/platform-browser';

export enum PageTitleTypes {
    Dashboard = "Dashboard",
    MapsList = "Maps",
    ProjectsList = "Projects" ,
    ProjectDetails = " - Project",
    Map = " - Map",
    Plugins = "Plugins - Manage",
    Agents = "Agents - Manage",
    Vault = "Vault - Manage",
    Calendar= "Calendar - Manage",
    PluginSettings = " - Settings - Manage"
}

@Injectable()
export class SeoService {
    constructor(private titleService:Title){}

    setTitle(title){
        this.titleService.setTitle(title + ' - Kaholo')
    }

}