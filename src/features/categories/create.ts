import {
    APIGatewayProxyEvent,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
    Context,
} from 'aws-lambda';

import {
    ICategory,
    createCategorySchema,
} from '../../validationSchema/category';
import logger from '../../utils/logger';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { validateRequest } from '../../utils/validateRequest';

import { generateErrorResponse } from '../../utils/generateErrorResponse';
import generateSuccessResponse from '../../utils/generateSuccessResponse';

import CategoryRepository from '../../respositories/categories/CategoryRepository';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';

const TABLE_NAME = process.env.TABLE_NAME || '';
const REGION = process.env.AWS_REGION;
const client = new DynamoDBClient({ region: REGION });

const eventHandler = async (
    event: APIGatewayProxyEvent,
    _: Context
): Promise<APIGatewayProxyResult> => {
    const {
        path,
        httpMethod,
        body,
        requestContext: { requestId, requestTime },
    } = event;

    logger.info({ path, httpMethod, body, requestId, requestTime });

    try {
        await validateRequest(createCategorySchema, JSON.parse(body!));

        const category: ICategory = JSON.parse(body || '{}');

        const repo = new CategoryRepository(client, TABLE_NAME);
        const createdCategory = await repo.create(category);
        return generateSuccessResponse(
            201,
            `Category ${createdCategory.categoryName} created successfully!`,
            { ...createdCategory }
        );
    } catch (e) {
        logger.error(e);
        return generateErrorResponse(e as Error, 'createCategory');
    }
};
export const handler: APIGatewayProxyHandler =
    middy(eventHandler).use(httpCors());
