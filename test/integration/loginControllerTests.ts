/*
 *  Copyright 2022 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import fetch, {RequestInit} from 'node-fetch'
import {assert, expect} from "chai";

import { config } from '../../src/config'
import {fetchStubbedResponse, performLogin, startLogin} from './testUtils'

// Tests to focus on the login endpoint
describe('LoginControllerTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}/api`

    it('Sending an OPTIONS request with wrong Origin should return 204 response without CORS headers', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'OPTIONS',
                headers: {
                    origin: 'https://malicious-site.com',
                },
            },
        )

        assert.equal(response.status, 204, 'Incorrect HTTP status')
        assert.equal(response.headers.get('access-control-allow-origin'), null, 'Incorrect allowed origin');
    })

    it('Sending OPTIONS request with a valid web origin should return a 204 response with proper CORS headers', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'OPTIONS',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
            },
        )

        assert.equal(response.status, 204, 'Incorrect HTTP status')
        assert.equal(response.headers.get('access-control-allow-origin'), config.trustedWebOrigins[0], 'Incorrect allowed origin');
    })

    it('Request to end login with invalid web origin should return 401 response', async () => {

        const payload = {
            pageUrl: 'http://www.example.com'
        }
        const response = await fetch(
            `${oauthAgentBaseUrl}/login/end`,
            {
                method: 'POST',
                headers: {
                    origin: 'https://malicious-site.com',
                },
                body: JSON.stringify(payload),
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json() as any
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Request to end login should return correct unauthenticated response', async () => {

        const payload = {
            pageUrl: 'http://www.example.com'
        }
        const response = await fetch(
            `${oauthAgentBaseUrl}/login/end`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
                body: JSON.stringify(payload),
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json() as any
        assert.equal(body.isLoggedIn, false, 'Incorrect isLoggedIn value')
        assert.equal(body.handled, false, 'Incorrect handled value')
    })

    it('POST request to start login with invalid web origin should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'POST',
                headers: {
                    origin: 'https://malicious-site.com',
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json() as any
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Request to start login should return authorization request URL', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json() as any
        const authorizationRequestUrl = body.authorizationRequestUrl as string
        expect(authorizationRequestUrl).contains(`client_id=${config.clientID}`, 'Invalid authorization request URL')
    })

    it('Posting a code flow response to login end should result in authenticating the user', async () => {

        const [status, body, cookieString] = await performLogin()

        assert.equal(status, 200, 'Incorrect HTTP status')
        expect(cookieString, 'Missing secure cookies').length.above(0)
        assert.equal(body.isLoggedIn, true, 'Incorrect isLoggedIn value')
        assert.equal(body.handled, true, 'Incorrect handled value')
        expect(body.csrf, 'Missing csrfToken value').length.above(0)
    })

    it('Posting a code flow response with malicous state to login end should return a 400 invalid_request response', async () => {

        const [status, body] = await performLogin('ad0316c6-b4e8-11ec-b909-0242ac120002')

        assert.equal(status, 400, 'Incorrect HTTP status')
        assert.equal(body.code, 'invalid_request', 'Incorrect error code')
    })

    it("Posting to end login with session cookies should return proper 200 response", async () => {

        const [, , cookieString] = await performLogin()

        const payload = {
            pageUrl: 'http://www.example.com',
        }
        const response = await fetch(
            `${oauthAgentBaseUrl}/login/end`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                    cookie: cookieString,
                },
                body: JSON.stringify(payload),
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json() as any
        assert.equal(body.isLoggedIn, true, 'Incorrect isLoggedIn value')
        assert.equal(body.handled, false, 'Incorrect handled value')
        expect(body.csrf, 'Missing csrfToken value').length.above(0)
    })

    it('When the Authorization Server returns a configuration-related 400 response, the OAuth Agent should respond with 400', async () => {

        const [state, cookieString] = await startLogin()
        const code = '4a4246d6-b4bd-11ec-b909-0242ac120002'

        const payload = {
            pageUrl: `http://www.example.com?code=${code}&state=${state}`,
        }
        const options = {
            method: 'POST',
            headers: {
                origin: config.trustedWebOrigins[0],
                'Content-Type': 'application/json',
                cookie: cookieString,
            },
            body: JSON.stringify(payload) as string,
        } as RequestInit

        const stubbedResponse = {
            id: '1527eaa0-6af2-45c2-a2b2-e433eaf7cf04',
            priority: 1,
            request: {
                method: 'POST',
                url: '/oauth/v2/oauth-token'
            },
            response: {

                // Simulate the response for an incorrect client secret to complete the OIDC flow
                status: 400,
                body: "{\"error\":\"invalid_client\"}"
            }
        }

        const response = await fetchStubbedResponse(stubbedResponse, async () => {
            return await fetch(`${oauthAgentBaseUrl}/login/end`, options)
        })

        assert.equal(response.status, 400, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'authorization_error', 'Incorrect error code')
    })

    it('When the Authorization Server returns an OAuth error response to the front channel, the OAuth Agent should return 400 from login/end', async () => {

        const [state, cookieString] = await startLogin()

        const payload = {
            pageUrl: `http://www.example.com?error=invalid_scope&state=${state}`,
        }
        const options = {
            method: 'POST',
            headers: {
                origin: config.trustedWebOrigins[0],
                'Content-Type': 'application/json',
                cookie: cookieString,
            },
            body: JSON.stringify(payload),
        } as RequestInit

        const response = await fetch(`${oauthAgentBaseUrl}/login/end`, options)

        assert.equal(response.status, 400, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'invalid_scope', 'Incorrect error code')
    })

    it('When the Authorization Server returns an expiry-related error response to the front channel, the OAuth Agent should return 401 from login/end', async () => {

        const clientOptions = {
            extraParams: [
                {
                    key: 'prompt',
                    value: 'none',
                }
            ]
        }
        const [state, cookieString] = await startLogin(clientOptions)

        const payload = {
            pageUrl: `http://www.example.com?error=login_required&state=${state}`,
        }
        const options = {
            method: 'POST',
            headers: {
                origin: config.trustedWebOrigins[0],
                'Content-Type': 'application/json',
                cookie: cookieString,
            },
            body: JSON.stringify(payload),
        } as RequestInit

        const response = await fetch(`${oauthAgentBaseUrl}/login/end`, options)

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'login_required', 'Incorrect error code')
    })
})
