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

import validateRequest, {ValidateRequestData, ValidateRequestOptions} from './lib/validateRequest'
import {config} from './config'
import {getCSRFCookieName} from './lib'
import {NextApiRequest} from "next"

export default function validateNextRequest(req: NextApiRequest, options: ValidateRequestOptions) {
    let csrfCookie: string | undefined
    const csrfCookieHeader = req.headers['x-' + config.cookieNamePrefix + '-csrf']
    if (Array.isArray(csrfCookieHeader)) {
        csrfCookie = csrfCookieHeader[0]
    } else {
        csrfCookie = csrfCookieHeader
    }

    const data = new ValidateRequestData(
        csrfCookie,
        req.cookies && req.cookies[getCSRFCookieName(config.cookieNamePrefix)],
        req.headers.origin,
        config.trustedWebOrigins,
        config.encKey,
    )

    validateRequest(data, options);
}
