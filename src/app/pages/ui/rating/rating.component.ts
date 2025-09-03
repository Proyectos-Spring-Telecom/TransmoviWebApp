import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss']
})
export class RatingComponent implements OnInit {

  // bread crumb items
  breadCrumbItems: Array<{}>;

  readonly = false;
  currentRate = 0;
  stepRate = 2;
  readRate = 3;
  hoverSelect = 2;
  customColor = 4;
  clearRate = 2;
  stepHeart = 2;

  constructor() { }

  

  ngOnInit(): void {
    
  }


}
