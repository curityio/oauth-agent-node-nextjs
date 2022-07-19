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

import {OAuthAgentException, UnhandledException} from '../lib/exceptions'
import {RequestLog} from './requestLog';
import {NextApiRequest} from "next";
import {OauthAgentResponse} from "../OauthAgentResponse";

export default function handleException(
    caught: any,
    request: NextApiRequest,
    response: OauthAgentResponse): void {

    const exception = caught instanceof OAuthAgentException ? caught : new UnhandledException(caught)

    if (!response.logger) {

        // For malformed JSON errors, middleware does not get created so write the whole log here
        response.logger = new RequestLog()
        response.logger.start(request)
        response.logger.addError(exception)
        response.logger.end(response)

    } else {

        // Otherwise just include error details in logs
        response.logger.addError(exception)
    }

    // Send the response to the client
    const statusCode = exception.statusCode
    const data = { code: exception.code, message: exception.message}
    response.status(statusCode).send(data)
}
