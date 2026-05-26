import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { environment } from '../../../environments/environment';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      width?: string;
      logo_alignment?: 'left' | 'center';
    }
  ) => void;
}

interface GoogleWindow extends Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
    };
  };
}

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements AfterViewInit, OnDestroy {
  private readonly googleScriptId = 'google-identity-services';
  private readonly googleWindow = window as GoogleWindow;
  private googleCredentialCallback?: (response: GoogleCredentialResponse) => void;

  readonly googleClientConfigured = Boolean(environment.googleClientId);

  onLogin = output<string>();

  @ViewChild('googleButton', { static: true })
  private googleButtonRef!: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    this.loadGoogleScript();
  }

  ngOnDestroy(): void {
    this.googleCredentialCallback = undefined;
  }

  handleGoogleLogin(response: GoogleCredentialResponse): void {
    this.onLogin.emit(response.credential);
  }

  private loadGoogleScript(): void {
    if (!environment.googleClientId) {
      return;
    }

    if (this.googleWindow.google?.accounts.id) {
      this.initializeGoogleButton();
      return;
    }

    if (document.getElementById(this.googleScriptId)) {
      this.waitForGoogleReady();
      return;
    }

    const script = document.createElement('script');
    script.id = this.googleScriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initializeGoogleButton();
    document.head.append(script);
  }

  private waitForGoogleReady(): void {
    const timeoutId = window.setInterval(() => {
      if (this.googleWindow.google?.accounts.id) {
        window.clearInterval(timeoutId);
        this.initializeGoogleButton();
      }
    }, 50);

    window.setTimeout(() => window.clearInterval(timeoutId), 5000);
  }

  private initializeGoogleButton(): void {
    if (!environment.googleClientId) {
      return;
    }

    this.googleCredentialCallback = (response) => this.handleGoogleLogin(response);

    this.googleWindow.google?.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: this.googleCredentialCallback,
    });

    this.googleWindow.google?.accounts.id.renderButton(this.googleButtonRef.nativeElement, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: '100%',
      logo_alignment: 'left',
    });
  }
}
