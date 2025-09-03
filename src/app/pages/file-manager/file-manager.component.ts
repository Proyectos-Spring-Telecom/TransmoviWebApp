import { Component } from '@angular/core';

import { ChartType } from './file-manager.model';

import { activityDataChart } from './data';

@Component({
  selector: 'app-file-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss']
})
export class FileManagerComponent {

  // bread crumb items
  breadCrumbItems: Array<{}>;
  public isCollapsed = false;
  activityChart: ChartType;
  message: string

  ngOnInit(): void {

    this.breadCrumbItems = [{ label: 'Apps' }, { label: 'File Manager', active: true }];

    this.activityChart = activityDataChart;

    this.message = "<div class='mb-3'><i class=\"display-4 text-muted uil uil-cloud-upload\"></i></div><h5>Import Files</h5>";

  }

}
