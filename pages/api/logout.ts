import {NextApiRequest} from "next";
import {OauthAgentResponse} from "../../src/OauthAgentResponse";
import {getATCookieName, getCookiesForUnset, getLogoutURL, ValidateRequestOptions} from "../../src/lib";
import validateNextRequest from "../../src/validateNextRequest";
import {config} from "../../src/config";
import {InvalidCookieException} from "../../src/lib/exceptions";
import handleException from "../../src/supportability/handleException";
import MethodNotAllowedException from "../../src/lib/exceptions/MethodNotAllowedException";
import handleCatchingWithLoggingAndCors from "../../src/supportability/handleCathingWithLoggingAndCors";

const handler = (req: NextApiRequest, res: OauthAgentResponse) => {
    if (req.method === 'POST') {
        handlePost(req, res)
    } else {
        const error = new MethodNotAllowedException()
        handleException(error, req, res)
    }
}

const handlePost = (req: NextApiRequest, res: OauthAgentResponse) => {
    const options = new ValidateRequestOptions()
    validateNextRequest(req, options)

    if (req.cookies && req.cookies[getATCookieName(config.cookieNamePrefix)]) {

        const logoutURL = getLogoutURL(config)
        res.setHeader('Set-Cookie', getCookiesForUnset(config.cookieOptions, config.cookieNamePrefix))
        res.json({ url: logoutURL})

    } else {
        const error = new InvalidCookieException()
        error.logInfo = 'No auth cookie was supplied in a logout call'
        handleException(error, req, res)
    }
}

export default handleCatchingWithLoggingAndCors(handler)
