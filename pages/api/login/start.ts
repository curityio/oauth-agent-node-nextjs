import type {NextApiRequest} from 'next'
import Cors from 'cors'
import {getAuthorizationURL, getTempLoginDataCookie, ValidateRequestOptions} from "../../../src/lib";
import validateNextRequest from "../../../src/validateNextRequest";
import {config} from "../../../src/config";
import handleException from "../../../src/supportability/handleException";
import {OauthAgentResponse} from "../../../src/OauthAgentResponse";
import runMiddleware from "../../../src/supportability/runMiddleware";
import loggingMiddleware from "../../../src/supportability/loggingMiddleware";
import handleWithCatch from "../../../src/supportability/handleWithCatch";
import MethodNotAllowedException from "../../../src/lib/exceptions/MethodNotAllowedException";

export default async (req: NextApiRequest, res: OauthAgentResponse) => {

    const corsConfiguration = {
        origin: config.trustedWebOrigins,
        credentials: true,
        methods: ['POST']
    }

    const cors = Cors(corsConfiguration)

    await runMiddleware(req, res, loggingMiddleware)

    switch (req.method) {
        case 'OPTIONS':
            await runMiddleware(req, res, cors)
            res.status(204).end()
            break
        case 'POST':
            handleWithCatch(req, res, handlePost)
            break
        default:
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
