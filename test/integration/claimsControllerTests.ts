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

import {assert, expect} from 'chai';
import fetch from 'node-fetch';
import {config} from '../../src/config';
import {performLogin} from './testUtils'

// Tests to focus on returning ID token details
describe('ClaimsControllerTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}/api`

    it('Requesting claims from an untrusted origin should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/claims`,
            {
                method: 'GET',
                headers: {
                    origin: 'https://malicious-site.com',
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json() as any
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Requesting claims without session cookies should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/claims`,
            {
                method: 'GET',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json() as any
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Requesting claims with valid cookies should return ID Token claims', async () => {

        const [, , cookieString] = await performLogin()
        const response = await fetch(
            `${oauthAgentBaseUrl}/claims`,
            {
                method: 'GET',
                headers: {
                    origin: config.trustedWebOrigins[0],
                    cookie: cookieString,
                },
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json() as any
        expect(body.auth_time.toString(), 'Missing auth_time claim').length.above(0)
    })
})
