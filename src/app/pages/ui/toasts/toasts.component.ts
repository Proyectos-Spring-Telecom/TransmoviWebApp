import { Component } from '@angular/core';
import { ToastService } from './toast-service';

@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.component.html',
  styleUrls: ['./toasts.component.scss']
})
export class ToastsComponent {

  // bread crumb items
  breadCrumbItems: Array<{}>;

  show = false;
  autohide = true;
  basic = true;
  translucent = true;
  stacking = true;
  stackingsecond = true;

  constructor(public toastService: ToastService) { }

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'UI Elements' }, { label: 'Toasts', active: true }];
  }

  /**
   * Standard message
   */
  showStandard() {
    this.toastService.show('Hello, world! This is a toast message.', { classname: 'bg-primary text-center text-white mt-3', delay: 10000 });
  }

  /**
   * Success message
   */
   showSuccess() {
    this.toastService.show('Hello, world! This is a toast message.', { classname: 'bg-success text-center text-white mt-3', delay: 10000 });
  }

  /**
   * Danger message
   */
   showDanger() {
    this.toastService.show('Hello, world! This is a toast message.', { classname: 'bg-danger text-center text-white mt-3', delay: 10000 });
  }

  /**
   * Warning message
   */
  showWarning() {
    this.toastService.show('Hello, world! This is a toast message.', { classname: 'bg-warning text-center text-white mt-3', delay: 10000 });
  }

}
