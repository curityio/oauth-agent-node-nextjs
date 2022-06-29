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
import fetch from 'node-fetch'
import {config} from '../../src/config'

// Tests to focus on extra details the SPA may need to supply at runtime
describe('ExtensibilityTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}/api`

    it('Starting a login request with a simple OpenID Connect parameter should include it in the request URL', async () => {

        const options = {
            extraParams: [
                {
                    key: 'prompt',
                    value: 'login',
                },
            ],
        }

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                    'content-type': 'application/json',
                },
                body: JSON.stringify(options),
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json()
        const authorizationRequestUrl = body.authorizationRequestUrl as string

        expect(authorizationRequestUrl).contains(
            `${options.extraParams[0].key}=${options.extraParams[0].value}`,
            'The extra parameter was not added to the authorization request URL')
    })

    it('Starting a login request with multiple OpenID Connect parameters should include them in the request URL', async () => {

        const claims = {
            id_token: {
                acr: {
                    essential: true,
                    values: [
                        "urn:se:curity:authentication:html-form:htmlform1"
                    ]
                }
            }
        }
        const claimsText = JSON.stringify(claims)

        const options = {
            extraParams: [
                {
                    key: 'ui_locales',
                    value: 'fr',
                },
                {
                    key: 'claims',
                    value: claimsText,
                },
            ],
        }

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                    'content-type': 'application/json',
                },
                body: JSON.stringify(options),
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json()
        const authorizationRequestUrl = body.authorizationRequestUrl as string

        options.extraParams.forEach((p: any) => {
            expect(authorizationRequestUrl).contains(
                `${p.key}=${encodeURIComponent(p.value)}`,
                'The extra parameters were not added to the authorization request URL')
        })
    })
})
