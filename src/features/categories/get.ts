import {
    APIGatewayProxyEvent,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
    Handler,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import logger from '../../utils/logger';
import generateSuccessResponse from '../../utils/generateSuccessResponse';
import CategoryRepository from '../../respositories/categories/CategoryRepository';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';

const TABLE_NAME = process.env.TABLE_NAME || '';
const REGION = process.env.AWS_REGION;
const client = new DynamoDBClient({ region: REGION });

export const eventHandler: Handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const {
        path,
        httpMethod,
        body,
        requestContext: { requestId, requestTime },
    } = event;

    logger.info({ path, httpMethod, body, requestId, requestTime });

    try {
        const repo = new CategoryRepository(client, TABLE_NAME);
        const categories = await repo.all();
        return generateSuccessResponse(
            200,
            'Successfully fetched all categories!',
            { data: categories }
        );
    } catch (e) {
        //TODO : REFINE THIS ERROR DON'T JUST RETURN THE ERROR TO CLIENT!!!!!

        return {
            statusCode: 500,
            body: JSON.stringify({ msg: 'Internal Server Error', errors: e }),
        };
    }
};
export const handler: APIGatewayProxyHandler =
    middy(eventHandler).use(httpCors());
