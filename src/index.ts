import middy from '@middy/core';
import httpCors from '@middy/http-cors';

import {
    APIGatewayProxyEvent,
    Handler,
    Context,
    APIGatewayAuthorizerResult,
    APIGatewayProxyHandler,
} from 'aws-lambda';

const eventHandler: Handler = async (
    event: APIGatewayProxyEvent,
    context: Context
) => {
    return {
        statusCode: 200,
        body: 'Welcome to mydomain.com',
    };
};
export const handler: APIGatewayProxyHandler =
    middy(eventHandler).use(httpCors());
