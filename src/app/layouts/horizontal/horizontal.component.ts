import { Component, OnInit, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-horizontal',
  templateUrl: './horizontal.component.html',
  styleUrls: ['./horizontal.component.scss']
})

/**
 * Horizontal-layout component
 */
export class HorizontalComponent implements OnInit, AfterViewInit {

  isCondensed = false;
  
  constructor() { }

  ngOnInit() {
    document.body.setAttribute('data-layout', 'horizontal');
  }

  ngAfterViewInit() {
  }

  /**
   * on settings button clicked from topbar
   */
  onSettingsButtonClicked() {
    document.body.classList.toggle('right-bar-enabled');
  }

    /**
   * Mobile Toggle Menu
   */
    onToggleMobileMenu() {
      const element = document.getElementById('topnav-menu-content');
      element?.classList.toggle('show');
    }
}
