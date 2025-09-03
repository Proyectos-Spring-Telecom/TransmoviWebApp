import { Component, OnInit } from '@angular/core';
import { EventService } from '../../core/services/event.service';
import { LAYOUT_MODE, LAYOUT_WIDTH, TOPBAR, SIDEBAR_SIZE, SIDEBAR_COLOR, LAYOUT_POSITION, LAYOUT_VERTICAL } from '../layouts.model';

@Component({
  selector: 'app-rightsidebar',
  templateUrl: './rightsidebar.component.html',
  styleUrls: ['./rightsidebar.component.scss']
})

/**
 * Rightsidebar component
 */
export class RightsidebarComponent implements OnInit {

  layout: string | undefined;
  mode: string | undefined;
  width: string | undefined;
  topbar: string | undefined;
  sidebarsize: string | undefined;
  sidebarcolor: string | undefined;

  constructor(private eventService: EventService) { }

  ngOnInit() {
 
    this.mode = LAYOUT_MODE;
    this.width = LAYOUT_WIDTH;
    this.topbar = TOPBAR;
    this.sidebarsize = SIDEBAR_SIZE;
    this.sidebarcolor = SIDEBAR_COLOR;
    // this.position = LAYOUT_POSITION;

    /**
     * horizontal-vertical layput set
     */
    this.layout = document.body.getAttribute('data-layout');
    const vertical = document.getElementById('is-layout');
    if (vertical != null) {
      vertical.setAttribute('checked', 'true');
    }
    if (this.layout == 'horizontal') {
      vertical?.removeAttribute('checked');
    }
  }

/**
   * Hide the sidebar
   */
public hide() {
  document.body.classList.remove('right-bar-enabled');
}

/**
 * Change the layout onclick
 * @param layout Change the layout
 */
changeLayout(layout: any) {
  this.layout = layout
  this.eventService.broadcast('changeLayout', layout);
}

  enableLightMode(){
    this.hide();
    document.body.setAttribute('data-sidebar', 'light');
    document.body.setAttribute('data-topbar', 'light');
  }

  enableDarkMode(){
    this.hide();
  }

  enableRTLMode(){ }

   /**
   * Change the Mode onclick
   * @param mode Change the layout
   */
   changeMode(mode: string) {
     this.mode = mode;
    this.eventService.broadcast('changeMode', mode);
  }

  /**
   * Change the Width onclick
   * @param Width Change the layout
   */
  changeWidth(width: string) {
    this.width = width;
    this.eventService.broadcast('changeWidth', width);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 0);
  }

  /**
   * Change the Topbar onclick
   * @param topbar Change the layout
   */
  changeTopbar(topbar: string) {
    this.topbar = topbar;
    this.eventService.broadcast('changeTopbar', topbar);
  }

  /**
   * Change the Sidebar Size onclick
   * @param Sidebar Size Change the layout
   */
  changeSidebarSize(sidebarsize: string) {
    this.sidebarsize = sidebarsize;
    this.eventService.broadcast('changeSidebarSize', sidebarsize);
  }

  /**
   * Change the Sidebar Color onclick
   * @param Sidebar Color Change the layout
   */
  changeSidebarColor(sidebarcolor: string) {
    this.sidebarcolor = sidebarcolor;
    this.eventService.broadcast('changeSidebarColor', sidebarcolor);
  }

}


