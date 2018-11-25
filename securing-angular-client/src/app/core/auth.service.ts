import { Injectable } from '@angular/core';
import { User, UserManager, WebStorageStateStore } from 'oidc-client';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../constants';
import { promise } from 'protractor';
import { AuthContext } from '../model/auth-context';
import { Utils } from './utils';

@Injectable()
export class AuthService {
    private _userManager: UserManager;
    private _user: User;
    authContext: AuthContext;
    constructor(private httpClient: HttpClient) {
        var config = {
            authority: Constants.stsAuthority,
            client_id: Constants.clientId,
            redirect_uri: `${Constants.clientRoot}assets/oidc-login-redirect.html`,
            scope: 'openid projects-api profile',
            response_type: 'id_token token',
            post_logout_redirect_uri: `${Constants.clientRoot}?postLogout=true`,
            userStore: new WebStorageStateStore({store: window.localStorage}),
            automaticSilentRenew: true,
            silent_redirect_uri: `${Constants.clientRoot}assets/silent-redirect.html`
            //used for auth0 settings
            // metadat: {
            //     authorization_endpoint: `${Constants.stsAuthority}authorize?audience=projects-api`,
            //     issuer: `${Constants.stsAuthority}`,
            //     jwks_uri: `${Constants.stsAuthority}.well-known/jwks.json`,
            //     end_session_endpoint: 'https://securing-app.auth0.com/v2/logout?client_id=F1D41T3XiYahRO81vfXts3FlxLR0Br1N&returnTo=http://localhost:4200/?postLogout=true' //`${Constants.stsAuthority}v2/logout?client_id=${Constants.clientId}&returnTo=http://localhost:4200/?postLogout=true`;
            // }
        };
        this._userManager = new UserManager(config);
        this._userManager.getUser().then(user =>{
            if(user && !user.expired){
                this._user = user;
                this.loadSecurityContext();
            }
        });
        this._userManager.events.addUserLoaded(() =>{
            this._userManager.getUser().then(user =>{
                this._user = user;
                this.loadSecurityContext();
            });
        });
     }

     login(): Promise<any> {
        return this._userManager.signinRedirect();
     }

     logout(): Promise<any> {
         return this._userManager.signoutRedirect();
     }

     isLoggedIn(): boolean {
         return this._user && this._user.access_token && !this._user.expired;
     }

     // returns the access token from the user object if there is one
     getAccessToken(): string {
         return this._user ? this._user.access_token : ''; 
     }

     //It will clear the items from the storage, which it created during the login process
     signoutRedirectCallback(): Promise<any> {
        return this._userManager.signoutRedirectCallback();
     }

     loadSecurityContext(){
         this.httpClient.get<AuthContext>(`${Constants.apiRoot}Account/AuthContext`)
         .subscribe(context => {
             this.authContext = context;
         }, error =>{
             console.error(Utils.formatError(error));
         })
     }
}