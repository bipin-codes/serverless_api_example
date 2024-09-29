import {
    APIGatewayProxyEvent,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
} from 'aws-lambda';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { validateRequest } from '../../utils/validateRequest';
import { deleteCategorySchema } from '../../validationSchema/category';
import { generateErrorResponse } from '../../utils/generateErrorResponse';
import generateSuccessResponse from '../../utils/generateSuccessResponse';
import CategoryRepository from '../../respositories/categories/CategoryRepository';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';

const TABLE_NAME = process.env.TABLE_NAME || '';
const REGION = process.env.AWS_REGION;

const client = new DynamoDBClient({ region: REGION });

const eventHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        await validateRequest(deleteCategorySchema, event.pathParameters);

        const { id } = event.pathParameters as { id: string };
        const repo = new CategoryRepository(client, TABLE_NAME);
        const result = await repo.delete(id);
        return generateSuccessResponse(200, 'Category deleted successfully', {
            ...result,
        });
    } catch (e) {
        console.log(e);
        return generateErrorResponse(e as Error, 'deleteCategory');
    }
};
export const handler: APIGatewayProxyHandler =
    middy(eventHandler).use(httpCors());
