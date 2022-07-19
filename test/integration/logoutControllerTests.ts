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

import {assert, expect} from 'chai'
import fetch, {RequestInit} from 'node-fetch'
import {config} from '../../src/config'
import {performLogin} from './testUtils'

// Tests to focus on the logout endpoint
describe('LogoutControllerTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}/api`

    it('Posting to logout from a malicious origin should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/logout`,
            {
                method: 'POST',
                headers: {
                    origin: 'https://malicious-site.com',
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Posting to logout without cookies should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/logout`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Posting incorrect CSRF token to logout should return a 401 response', async () => {

        const [, , cookieString] = await performLogin()

        const options = {
            method: 'POST',
            headers: {
                origin: config.trustedWebOrigins[0],
                'Content-Type': 'application/json',
                cookie: cookieString,
            },
        } as RequestInit
        (options.headers as any)[`x-${config.cookieNamePrefix}-csrf`] = 'abc123'
       
        const response = await fetch(`${oauthAgentBaseUrl}/logout`, options)

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it("Posting to logout with correct session cookies should return a 200 response and clear cookies", async () => {

        const [, loginBody, cookieString] = await performLogin()
        const options = {
            method: 'POST',
            headers: {
                origin: config.trustedWebOrigins[0],
                'Content-Type': 'application/json',
                cookie: cookieString,
            },
        } as RequestInit
        (options.headers as any)[`x-${config.cookieNamePrefix}-csrf`] = loginBody['csrf']
       
        const response = await fetch(`${oauthAgentBaseUrl}/logout`, options)

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json()
        const endSessionRequestUrl = body.url as string
        expect(endSessionRequestUrl).contains(`client_id=${config.clientID}`, 'Invalid end session request URL')
    })
})
