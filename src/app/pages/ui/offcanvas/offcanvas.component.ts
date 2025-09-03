import { Component, TemplateRef } from '@angular/core';
import {NgbOffcanvas} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-offcanvas',
  templateUrl: './offcanvas.component.html',
  styleUrls: ['./offcanvas.component.scss']
})
export class OffcanvasComponent {

  // bread crumb items
  breadCrumbItems: Array<{}>;

  constructor(private offcanvasService: NgbOffcanvas) {}

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'UI Elements' }, { label: 'Offcanvas', active: true }];
  }

  // Demo Offcanvas
  openLeft(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { position: 'start' });
  }

   // Offcanvas Open Top
   openTop(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { position: 'top' });
  }

  // Offcanvas Open Right
  openRight(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { position: 'end' });
  }

  // Offcanvas Open Bottom
  openBottom(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { position: 'bottom' });
  }

  // Offcanvas Open No Backdrop
  openNoBackdrop(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { backdrop: false });
  }

  // Offcanvas Open Scroll
  openScroll(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { scroll: true });
  }

  // Offcanvas Open No Keyboard
  openNoKeyboard(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { keyboard: false });
  }

}
