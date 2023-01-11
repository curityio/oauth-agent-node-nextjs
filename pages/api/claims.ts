import {NextApiRequest} from "next";
import {OauthAgentResponse} from "../../src/OauthAgentResponse";
import handleException from "../../src/middleware/handleException";
import {getIDCookieName, getIDTokenClaims, ValidateRequestOptions} from "../../src/lib";
import {config} from "../../src/config";
import validateNextRequest from "../../src/validateNextRequest";
import {InvalidCookieException} from "../../src/lib/exceptions";
import MethodNotAllowedException from "../../src/lib/exceptions/MethodNotAllowedException";
import handleCatchingWithLoggingAndCors from "../../src/middleware/handleCathingWithLoggingAndCors";

const handler = (req: NextApiRequest, res: OauthAgentResponse) => {
    if (req.method === 'GET') {
        handleGet(req, res)
    } else {
        const error = new MethodNotAllowedException()
        handleException(error, req, res)
    }
}

const handleGet = (req: NextApiRequest, res: OauthAgentResponse) => {
    
    const options = new ValidateRequestOptions()
    options.requireTrustedOrigin = config.corsEnabled;
    options.requireCsrfHeader = false;
    validateNextRequest(req, options)

    const idTokenCookieName = getIDCookieName(config.cookieNamePrefix)
    if (req.cookies && req.cookies[idTokenCookieName]) {

        const userData = getIDTokenClaims(config.encKey, req.cookies[idTokenCookieName])
        res.status(200).json(userData)

    } else {
        const error = new InvalidCookieException()
        error.logInfo = 'No ID cookie was supplied in a call to get claims'
        handleException(error, req, res)
    }
}

export default handleCatchingWithLoggingAndCors(handler)
