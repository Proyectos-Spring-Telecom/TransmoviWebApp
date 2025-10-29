import { Component, OnInit, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild, Input, OnChanges } from '@angular/core';
import MetisMenu from 'metismenujs';
import { Router, NavigationEnd } from '@angular/router';
import { MENU } from './menu';
import { MenuItem } from './menu.model';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from '../../core/services/event.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { AuthenticationService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() isCondensed = false;
  @Output() mobileMenuButtonClicked = new EventEmitter();
  public imagenPerfil: string;
  public validarImagenClienteTecsa: boolean;

  menu: any;
  public permisos = [];
  menuItems = [];
  public showRol: any;
  @ViewChild('sideMenu') sideMenu: ElementRef;
  @ViewChild('componentRef') scrollRef;

  constructor(
    private eventService: EventService,
    private router: Router,
    public translate: TranslateService,
    private authService: AuthenticationService,
    private permissionsService: NgxPermissionsService,
    private user: AuthenticationService,
  ) {
    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        this._activateMenuDropdown();
        this._scrollElement();
      }
    });
  }

  ngOnInit() {
    this.loadRolesWithPermissions();
    this.initialize();
    this._scrollElement();

    const user = this.user.getUser();

    if(user.rol.nombre == 'Pasajeros'){
      this.showRol = true
    } else{
      this.showRol = false;
    }

    this.permisos = (this.authService.getPermissions() || [])
      .map((p: any) => (typeof p === 'object' ? p.idPermiso : p).toString().trim());
  }

  ngAfterViewInit() {
    this.menu = new MetisMenu(this.sideMenu.nativeElement, {
      toggle: false
    });

    this._activateMenuDropdown();
    document.querySelectorAll('.side-nav-link-ref').forEach((element) => {
      element.addEventListener('click', (event) => {
        const parentLi = (event.target as HTMLElement).closest('li');

        if (parentLi) {
          this._keepSubmenuOpen(parentLi);
        }
      });
    });
  }

  _keepSubmenuOpen(selectedItem: HTMLElement) {
    let parentEl = selectedItem.closest('li');
    document.querySelectorAll('#side-menu > li.mm-active').forEach((item) => {
      if (item !== parentEl) {
        item.classList.remove('mm-active');
        let subMenu = item.querySelector('.sub-menu');
        if (subMenu) {
          subMenu.classList.remove('mm-show');
        }
      }
    });

    while (parentEl && parentEl.id !== 'side-menu') {
      parentEl.classList.add('mm-active');

      let subMenu = parentEl.querySelector('.sub-menu');
      if (subMenu) {
        subMenu.classList.add('mm-show');
      }

      parentEl = parentEl.parentElement?.closest('li') || null;
    }
  }

  _toggleSubmenu(selectedItem: HTMLElement) {
    document.querySelectorAll('.mm-active').forEach((item) => {
      if (item !== selectedItem) {
        item.classList.remove('mm-active');
        let subMenu = item.querySelector('.sub-menu');
        if (subMenu) {
          subMenu.classList.remove('mm-show');
        }
      }
    });

    selectedItem.classList.toggle('mm-active');
    let subMenu = selectedItem.querySelector('.sub-menu');
    if (subMenu) {
      subMenu.classList.toggle('mm-show');
    }
  }



  ngOnChanges() {
    if (!this.isCondensed && this.sideMenu || this.isCondensed) {
      setTimeout(() => {
        this.menu = new MetisMenu(this.sideMenu.nativeElement);
      });
    } else if (this.menu) {
      this.menu.dispose();
    }
  }

  loadRolesWithPermissions() {
    this.permissionsService.flushPermissions();
    const permissions = this.authService.getPermissions();
    // console.log('Cargando permisos:', permissions);
    this.permissionsService.loadPermissions(permissions);
  }

  changeLayout(layout: string) {
    this.eventService.broadcast('changeLayout', layout);
  }

  _removeAllClass(className) {
    const els = document.getElementsByClassName(className);
    while (els[0]) {
      els[0].classList.remove(className);
    }
  }

  toggleMobileMenu(event: any) {
    event.preventDefault();
    this.mobileMenuButtonClicked.emit();
  }

  darkSidebar() {
    document.body.setAttribute('data-sidebar', 'dark');
    document.body.removeAttribute('data-sidebar-size');
    document.body.removeAttribute('data-layout-size');
    document.body.removeAttribute('data-keep-enlarged');
    document.body.classList.remove('vertical-collpsed');
  }

  compactSidebar() {
    document.body.setAttribute('data-sidebar-size', 'small');
    document.body.setAttribute('data-sidebar', 'dark');
    document.body.removeAttribute('data-topbar');
    document.body.removeAttribute('data-layout-size');
    document.body.removeAttribute('data-keep-enlarged');
    document.body.classList.remove('sidebar-enable');
    document.body.classList.remove('vertical-collpsed');
  }

  iconSidebar() {
    document.body.classList.add('sidebar-enable');
    document.body.classList.add('vertical-collpsed');
    document.body.setAttribute('data-sidebar-size', 'sm');
    document.body.removeAttribute('data-layout-size');
    document.body.removeAttribute('data-keep-enlarged');
    document.body.removeAttribute('data-topbar');
  }

  boxedLayout() {
    document.body.setAttribute('data-keep-enlarged', 'true');
    document.body.setAttribute('data-layout-size', 'boxed');
    document.body.setAttribute('data-sidebar', 'dark');
    document.body.classList.add('vertical-collpsed');
    document.body.classList.remove('sidebar-enable');
    document.body.removeAttribute('data-topbar');
  }

  coloredSidebar() {
    document.body.setAttribute('data-sidebar', 'colored');
    document.body.removeAttribute('data-sidebar-size');
    document.body.removeAttribute('data-layout-size');
    document.body.classList.remove('vertical-collpsed');
    document.body.removeAttribute('data-topbar');
  }

  _scrollElement() {
    setTimeout(() => {
      if (document.getElementsByClassName("mm-active").length > 0) {
        const currentPosition = document.getElementsByClassName("mm-active")[0]['offsetTop'];
        if (currentPosition > 500)
          if (this.scrollRef.SimpleBar) {
            if (this.scrollRef.SimpleBar.getScrollElement() !== null) {
              this.scrollRef.SimpleBar.getScrollElement().scrollTop =
                currentPosition + 300;
            }
          }
      }
    }, 300);
  }

  _activateMenuDropdown() {
    this._removeAllClass('mm-active');
    this._removeAllClass('mm-show');
  
    const links = document.querySelectorAll('.side-nav-link-ref') as NodeListOf<HTMLElement>;
    let menuItemEl: HTMLElement | null = null;
    const currentPath = window.location.pathname;
  
    links.forEach((link) => {
      if (link.getAttribute('routerLink') === currentPath) {
        menuItemEl = link;
      }
    });
  
    if (menuItemEl) {
      menuItemEl.classList.add('active');
      this._keepSubmenuOpen(menuItemEl.closest('li')); 
    }
  }

  initialize(): void {
    this.menuItems = MENU;
  }

  hasItems(item: MenuItem): boolean {
    return this.hasPermission(item.permiso) && item.subItems !== undefined && item.subItems.some(subItem => this.hasPermission(subItem.permiso));
  }

  hasPermission(permiso?: string): boolean {
    if (!permiso) return true;
    const p = permiso.toString().trim().toLowerCase();
    return this.permisos.some(x => x.toString().trim().toLowerCase() === p);
  }


  trackByFn(index: number, item: MenuItem): number {
    return item.id;
  }
}
