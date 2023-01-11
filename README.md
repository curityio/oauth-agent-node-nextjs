# A Next.js OAuth Agent for SPAs

[![Quality](https://img.shields.io/badge/quality-test-yellow)](https://curity.io/resources/code-examples/status/)
[![Availability](https://img.shields.io/badge/availability-source-blue)](https://curity.io/resources/code-examples/status/)

## Overview

The OAuth Agent acts as a modern `Back End for Front End (BFF)` for Single Page Applications.\
This implementation demonstrates the standard pattern for SPAs:

- Strong browser security with `HTTP only` and `SameSite=strict` cookies
- The OpenID Connect flow uses Authorization Code Flow with [PKCE](https://curity.io/resources/learn/pkce/) and a client secret

![Logical Components](/doc/logical-components.png)

## Architecture

The following endpoints are used so that the SPA uses simple one-liners to perform its OAuth work:

| Endpoint          | Description                                                                          |
|-------------------|--------------------------------------------------------------------------------------|
| POST /login/start | Start a login by providing the request URL to the SPA and setting temporary cookies. |
| POST /login/end   | Complete a login and issuing secure cookies for the SPA containing encrypted tokens. |
| GET /userInfo     | Return information from the User Info endpoint for the SPA to display.               |
| GET /claims       | Return ID token claims such as `auth_time` and `acr`.                                |
| POST /refresh     | Refresh an access token and rewrite cookies.                                         |
| POST /logout      | Clear cookies and return an end session request URL.                                 |

For further details see the [Architecture](/doc/Architecture.md) article.

## OAuth Agent Development

See the [Setup](/doc/Setup.md) article for details on productive OAuth Agent development.\
This enables a test driven approach to developing the OAuth Agent, without the need for a browser.

## Deploying on Vercel

A simple way for deploying a Next.js app is to use the https [Vercel](https://vercel.com) platform. All you need to do is to connect your repository to the Vercel dashboard and set proper environment variables. These are the variables used in the `src/config.ts` file. The app can then be deployed and is ready for use.

Remember that the OAuth Agent needs to be deployed to the same parent domain as the SPA, so that cookies can be properly recognized as first-party. This means that you need to either configure your own domain in Vercel, or put the OAuth Agent behind a reverse proxy.

### Environment variables

The following variables are used by the configuration of the OAuth Agent:

| Variable                 | Description                                                                            | Default                                                            |
|--------------------------|----------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| CLIENT_ID                | The OAuth client ID.                                                                   | 'spa-client'                                                       |
| CLIENT_SECRET            | The client secret.                                                                     | 'Password1'                                                        |
| REDIRECT_URI             | The URI of the SPA.                                                                    | 'http://www.example.local/'                                        |
| POST_LOGOUT_REDIRECT_URI | The URI to which the user is redirected after logout.                                  | 'http://www.example.local/'                                        |
| SCOPE                    | The OAuth scope parameter.                                                             | 'openid profile'                                                   |
| COOKIE_ENCRYPTION_KEY    | The encryption key.*                                                                   | '4e4636356d65563e4c73233847503e3b21436e6f7629724950526f4b5e2e4e50' |
| COOKIE_NAME_PREFIX       | The prefix of cookies set by the OAuth Agent.                                          | 'example'                                                          |
| COOKIE_DOMAIN            | The domain for which cookies are issued. This should be the domain of the OAuth Agent. | 'api.example.local'                                                |
| TRUSTED_WEB_ORIGIN       | The origin of the SPA. Requests from other Origins will be rejected.                   | 'http://www.example.local'                                         |
| CORS_ENABLED             | True when the agent runs in a different subdomain of the web origin, false otherwise   | 'true'                                                             |
| ISSUER                   | The issuer of the Authorization Server.                                                | 'http://login.example.local:8443/oauth/v2/oauth-anonymous'         |
| AUTHORIZE_ENDPOINT       | The authorization endpoint of the Authorization Server.                                | 'http://login.example.local:8443/oauth/v2/oauth-authorize'         |
| LOGOUT_ENDPOINT          | The logout endpoint of the Authorization Server.                                       | 'http://login.example.local:8443/oauth/v2/oauth-session/logout'    |
| TOKEN_ENDPOINT           | The token endpoint of the Authorization Server.                                        | 'http://login.example.local:8443/oauth/v2/oauth-token'             |
| USERINFO_ENDPOINT        | The userinfo endpoint of the Authorization Server.                                     | 'http://login.example.local:8443/oauth/v2/oauth-userinfo'          |
| PORT                     | The port where the OAuth Agent runs. This setting is only used by tests.               | '3000'                                                             |

* A 64-character hex string. See [this info](https://curity.io/resources/learn/token-handler-deployment-example/#cookie-encryption-keys) to learn more about the key and how it can be generated.

## End-to-End SPA Flow

See the below article for details on how to run the end-to-end solution in a browser:

- [SPA Code Example](https://curity.io/resources/learn/token-handler-spa-example/)

The end-to-end solution, by default, uses our [Express implementation of the OAuth Agent](https://github.com/curityio/oauth-agent-node-express).
If you want to run it with this Next.js implementation, then a few things would have to be changed manually in the build
and deployment scripts. In this repository, you will find a `Dockerfile` that can be used with the scripts provided in the End-to-End example.

## Website Documentation

See the [Curity OAuth for Web Home Page](https://curity.io/product/token-service/oauth-for-web/) for all resources on this design pattern.

## More Information

Please visit [curity.io](https://curity.io/) for more information about the Curity Identity Server.
