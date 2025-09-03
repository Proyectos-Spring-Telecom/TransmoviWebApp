import { Component } from '@angular/core';

@Component({
  selector: 'app-utilities',
  templateUrl: './utilities.component.html',
  styleUrls: ['./utilities.component.scss']
})
export class UtilitiesComponent {

  // bread crumb items
  breadCrumbItems: Array<{}>;

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'UI Elements' }, { label: 'utilities', active: true }];
  }

}
