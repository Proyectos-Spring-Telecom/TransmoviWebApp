import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  public languages: string[] = ['en', 'es'];
  private googleTranslateLoaded = false;
  private pendingLang: 'en' | 'es' = 'es';
  private activeLang: 'en' | 'es' = 'es';

  constructor(public translate: TranslateService, private cookieService: CookieService) {
    this.translate.addLangs(this.languages);
    // Política solicitada: al recargar, SIEMPRE iniciar en español.
    this.activeLang = 'es';
    this.clearTranslationCookies();
    translate.use('es');
  }

  public setLanguage(lang: string) {
    const normalized = lang === 'en' ? 'en' : 'es';
    this.runLanguageSwitchAnimation();
    this.activeLang = normalized;
    this.translate.use(normalized);

    if (normalized === 'en') {
      this.applyGlobalProjectLanguage('en', true);
      return;
    }

    // Volver a español: limpiar cookies de traducción y deshacer traducción.
    this.clearTranslationCookies();
    this.applyGlobalProjectLanguage('es', true);
  }

  public reapplyCurrentLanguage(): void {
    if (this.activeLang === 'en') {
      this.applyGlobalProjectLanguage('en', true);
    }
  }

  public getCurrentLanguage(): 'en' | 'es' {
    return this.activeLang;
  }

  public applyGlobalProjectLanguage(
    lang: 'en' | 'es',
    forceEvent = false
  ): void {
    const target = lang === 'en' ? '/es/en' : '/es/es';
    this.cookieService.set('googtrans', target, undefined, '/');
    this.cookieService.set('googtrans', target, undefined, '/', '.');
    this.pendingLang = lang;
    this.loadGoogleTranslateScript();
    this.applyLanguageInWidget(0, forceEvent);
  }

  private loadGoogleTranslateScript(): void {
    if (this.googleTranslateLoaded) return;

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-translate="1"]');
    if (existing) {
      this.googleTranslateLoaded = true;
      return;
    }

    const w = window as any;
    w.googleTranslateElementInit = () => {
      const googleObj = (window as any).google;
      if (googleObj?.translate?.TranslateElement) {
        new googleObj.translate.TranslateElement(
          {
            pageLanguage: 'es',
            includedLanguages: 'es,en',
            autoDisplay: false,
          },
          'google_translate_element'
        );
        this.applyLanguageInWidget(0, true);
      }
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-google-translate', '1');
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
    this.googleTranslateLoaded = true;
  }

  private applyLanguageInWidget(attempt = 0, forceEvent = false): void {
    const combo = document.querySelector<HTMLSelectElement>('select.goog-te-combo');
    if (!combo) {
      if (attempt < 25) {
        setTimeout(() => this.applyLanguageInWidget(attempt + 1, forceEvent), 200);
      }
      return;
    }

    const target =
      this.pendingLang === 'en'
        ? 'en'
        : Array.from(combo.options).some((o) => o.value === 'es')
          ? 'es'
          : '';

    if (forceEvent && combo.value === target) {
      combo.dispatchEvent(new Event('change'));
      return;
    }

    if (combo.value !== target) {
      combo.value = target;
      combo.dispatchEvent(new Event('change'));
    }
  }

  private clearTranslationCookies(): void {
    this.cookieService.delete('googtrans', '/');
    this.cookieService.delete('googtrans', '/', '.');
    this.cookieService.set('googtrans', '/es/es', undefined, '/');
  }

  private runLanguageSwitchAnimation(): void {
    const body = document?.body;
    if (!body) return;

    body.classList.remove('lang-switching');
    // Reinicia la animación si el usuario cambia rápido varias veces.
    void body.offsetWidth;
    body.classList.add('lang-switching');

    setTimeout(() => {
      body.classList.remove('lang-switching');
    }, 380);
  }

}
