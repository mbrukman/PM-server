import { Injectable } from '@angular/core';
import { Title }     from '@angular/platform-browser';
@Injectable()
export class SeoService {
    Dashboard = "Dashboard"
    MapsList = "Maps"
    ProjectsList = "Projects" 
    ProjectDetails = " - Project"
    Map = " - Map"
    Plugins = "Plugins - Manage"
    Agents = "Agents - Manage"
    Vault = "Vault - Manage"
    Calendar= "Calendar - Manage"

    constructor(private titleService:Title){}

    setTitle(title){
        this.titleService.setTitle(title + ' - Kaholo')
    }

}