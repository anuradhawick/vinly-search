import { Injectable, NgZone } from '@angular/core';
import Amplify, { Auth, Hub } from 'aws-amplify';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router, RouterStateSnapshot } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ReplaySubject } from 'rxjs';
import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth/lib/types';
import * as _ from 'lodash';

declare const $: any;
declare const window: any;

Amplify.configure(environment.aws_config);
Auth.configure({oauth: environment.oauth});

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public redirectUrl = null;
  public user = new ReplaySubject<any>(1);
  public isLoggedIn = false;
  private autoLogin;
  private customState: any = '';

  constructor(private route: ActivatedRoute,
              private zone: NgZone,
              private http: HttpClient,
              private router: Router) {
    route.queryParams.subscribe((params: any) => {
      if (params.error === 'invalid_request' && params.error_description) {
        if (params.error_description === 'PreSignUp failed with error Google. ') {
          this.loginFacebook();
        } else if (params.error_description === 'PreSignUp failed with error Facebook. ') {
          this.loginGoogle();
        }
      }
    });

    this.autoLogin = new Promise((resolve, reject) => {
      Auth.currentAuthenticatedUser().then((u) => {
        this.processUser(u);
        resolve(true);
      }).catch((e) => {
        resolve(false);
      });

      Hub.listen('auth', ({payload: {event, data}}) => {
        console.log(event, data)
        switch (event) {
          case 'signIn':
            console.log('Login success');
            Auth.currentAuthenticatedUser().then((u) => {
              this.processUser(u);
              resolve(true);
            });
            break;
          case 'signOut':
            console.log('Logout success');
            this.isLoggedIn = false;
            this.user = null;
            this.autoLogin = false;
            resolve(false);
            break;
          case 'customOAuthState':
            this.customState = JSON.parse(decodeURIComponent(data));
            Auth.currentAuthenticatedUser().then((u) => {
              this.processUser(u);
              resolve(true);
              this.zone.run(() => this.router.navigate(this.customState));
            });
            break;
        }
      });
    });
  }

  processUser(u) {
    console.log(u);
    console.log(u.signInUserSession.idToken.jwtToken);
    this.zone.run(async () => {
      this.isLoggedIn = true;
      this.user.next(await this.http.get(environment.api_gateway + 'users/', {
        headers: new HttpHeaders({
          'Authorization': await this.getToken()
        })
      }).toPromise());
    });
  }

  async getToken() {
    try {
      const session: any = await Auth.currentSession();
      return session.idToken.jwtToken;
    } catch (e) {
      return null;
    }
  }

  setUser(user) {
    this.user.next(user);
  }

  loginFacebook() {
    Auth.federatedSignIn({
      provider: CognitoHostedUIIdentityProvider.Facebook,
      customState: this.customState
    }).then(() => {

    }).catch(e => {
      console.log(e);
    });
  }

  loginGoogle() {
    Auth.federatedSignIn({provider: CognitoHostedUIIdentityProvider.Google, customState: this.customState}).then(() => {

    }).catch(e => {
      console.log(e);
    });
  }

  login(customeState = null) {
    if (_.isEmpty(customeState)) {
      this.customState = JSON.stringify([this.router.routerState.snapshot.url]);
    } else {
      this.customState = customeState;
    }

    $('#loginModal').modal('show');
  }

  logout() {
    this.redirectUrl = null;
    this.user = null;
    this.isLoggedIn = false;
    this.autoLogin = null;
    Auth.signOut();
  }

  loginAuto() {
    return this.autoLogin;
  }
}
