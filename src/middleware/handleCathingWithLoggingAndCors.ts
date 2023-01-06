import {config} from "../config";
import Cors from "cors";
import {NextApiRequest} from "next";
import {OauthAgentResponse} from "../OauthAgentResponse";
import runMiddleware from "./runMiddleware";
import loggingMiddleware from "./loggingMiddleware";
import handleException from "./handleException";

const corsConfiguration = {
    origin: config.trustedWebOrigins,
    credentials: true,
    methods: ['POST']
}

const cors = Cors(corsConfiguration)

export default function handleCatchingWithLoggingAndCors(handler: (req: NextApiRequest, res: OauthAgentResponse) => unknown | Promise<unknown>) {
    return async (req: NextApiRequest, res: OauthAgentResponse) => {
        await runMiddleware(req, res, loggingMiddleware)
        
        if (config.corsEnabled) {
            await runMiddleware(req, res, cors)
        }

        try {
            await handler(req, res)
        } catch(e) {
            handleException(e, req, res)
        }
    }
}
