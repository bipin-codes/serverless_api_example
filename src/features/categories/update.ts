import {
    APIGatewayProxyEvent,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
} from 'aws-lambda';

import {
    ICategory,
    updateCategorySchema,
} from '../../validationSchema/category';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { validateRequest } from '../../utils/validateRequest';
import logger from '../../utils/logger';
import { generateErrorResponse } from '../../utils/generateErrorResponse';
import generateSuccessResponse from '../../utils/generateSuccessResponse';
import CategoryRepository from '../../respositories/categories/CategoryRepository';
import httpCors from '@middy/http-cors';
import middy from '@middy/core';

const TABLE_NAME = process.env.TABLE_NAME || '';
const REGION = process.env.AWS_REGION;

const client = new DynamoDBClient({ region: REGION });

export const eventHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        const { categoryName, id }: ICategory = JSON.parse(event.body || '{}');
        await validateRequest(updateCategorySchema, JSON.parse(event.body!));

        const repo = new CategoryRepository(client, TABLE_NAME);
        const userRequiredData = await repo.update({ categoryName, id });

        return generateSuccessResponse(
            200,
            'updated successfully',
            userRequiredData
        );
    } catch (e) {
        logger.error(e);
        return generateErrorResponse(e as Error, 'updateCategory');
    }
};

export const handler: APIGatewayProxyHandler =
    middy(eventHandler).use(httpCors());
