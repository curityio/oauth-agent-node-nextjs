import {NextApiRequest} from "next";
import {OauthAgentResponse} from "../../src/OauthAgentResponse";
import handleException from "../../src/supportability/handleException";
import {getATCookieName, getUserInfo, ValidateRequestOptions} from "../../src/lib";
import validateNextRequest from "../../src/validateNextRequest";
import {config} from "../../src/config";
import {InvalidCookieException} from "../../src/lib/exceptions";
import MethodNotAllowedException from "../../src/lib/exceptions/MethodNotAllowedException";
import handleCatchingWithLoggingAndCors from "../../src/supportability/handleCathingWithLoggingAndCors";

const handler = async (req: NextApiRequest, res: OauthAgentResponse) => {
    if (req.method === 'GET') {
        await handleGet(req, res)
    } else {
        const error = new MethodNotAllowedException()
        handleException(error, req, res)
    }
}

const handleGet = async (req: NextApiRequest, res: OauthAgentResponse) => {
    // Verify the web origin
    const options = new ValidateRequestOptions()
    options.requireCsrfHeader = false;
    validateNextRequest(req, options)

    const atCookieName = getATCookieName(config.cookieNamePrefix)
    if (req.cookies && req.cookies[atCookieName]) {

        const userData = await getUserInfo(config, config.encKey, req.cookies[atCookieName])
        res.status(200).json(userData)

    } else {
        const error = new InvalidCookieException()
        error.logInfo = 'No AT cookie was supplied in a call to get user info'
        handleException(error, req, res)
    }
}

export default handleCatchingWithLoggingAndCors(handler)
