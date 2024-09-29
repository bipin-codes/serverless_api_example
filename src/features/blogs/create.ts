import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../../utils/logger';
import { validateRequest } from '../../utils/validateRequest';
import { IBlog, createBlogSchema } from '../../validationSchema/blog';
import generateSuccessResponse from '../../utils/generateSuccessResponse';
import { generateErrorResponse } from '../../utils/generateErrorResponse';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import BlogRepository from '../../respositories/blogs/BlogRepository';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';

const TABLE_NAME = process.env.TABLE_NAME || '';
const REGION = process.env.AWS_REGION;
const client = new DynamoDBClient({ region: REGION });

export const eventHandler = async (
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
    const userData: IBlog = JSON.parse(body || '{}');
    await validateRequest(createBlogSchema, JSON.parse(body!));

    const createdBlog = await new BlogRepository(client, TABLE_NAME).create(
      userData
    );

    return generateSuccessResponse(
      201,
      'Blog created successfully!',
      createdBlog
    );
  } catch (e) {
    console.log(e);
    return generateErrorResponse(e as Error, 'createBlog');
  }
};

export const handler = middy(eventHandler).use(httpCors());
