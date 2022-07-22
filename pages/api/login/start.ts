import type {NextApiRequest} from 'next'
import {getAuthorizationURL, getTempLoginDataCookie, ValidateRequestOptions} from "../../../src/lib";
import validateNextRequest from "../../../src/validateNextRequest";
import {config} from "../../../src/config";
import handleException from "../../../src/middleware/handleException";
import {OauthAgentResponse} from "../../../src/OauthAgentResponse";
import MethodNotAllowedException from "../../../src/lib/exceptions/MethodNotAllowedException";
import handleCatchingWithLoggingAndCors from "../../../src/middleware/handleCathingWithLoggingAndCors";

const handler = (req: NextApiRequest, res: OauthAgentResponse) => {
    if (req.method === 'POST') {
        handlePost(req, res)
    } else {
        const error = new MethodNotAllowedException()
        handleException(error, req, res)
    }
}

const handlePost = (req: NextApiRequest, res: OauthAgentResponse) => {

    // Verify the web origin
    const options = new ValidateRequestOptions()
    options.requireCsrfHeader = false;
    validateNextRequest(req, options)
    const authorizationRequestData = getAuthorizationURL(config, req.body)

    res.setHeader('Set-Cookie',
        getTempLoginDataCookie(authorizationRequestData.codeVerifier, authorizationRequestData.state, config.cookieOptions, config.cookieNamePrefix, config.encKey))

    res.status(200).json({
        authorizationRequestUrl: authorizationRequestData.authorizationRequestURL
    })
}

export default handleCatchingWithLoggingAndCors(handler)
