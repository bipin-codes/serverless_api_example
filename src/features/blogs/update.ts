import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

import logger from '../../utils/logger';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { validateRequest } from '../../utils/validateRequest';
import { generateErrorResponse } from '../../utils/generateErrorResponse';
import generateSuccessResponse from '../../utils/generateSuccessResponse';
import { IBlog, updateBlogSchema } from '../../validationSchema/blog';
import BlogRepository from '../../respositories/blogs/BlogRepository';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';
import { S3Client } from '@aws-sdk/client-s3';

const TABLE_NAME = process.env.TABLE_NAME || '';
const BUCKET_NAME = process.env.BUCKET_NAME || '';

const REGION = process.env.AWS_REGION;
const client = new DynamoDBClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

export const eventHandler = async (
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
    await validateRequest(updateBlogSchema, {
      ...JSON.parse(event.body!),
    });

    const blog: IBlog = JSON.parse(body || '{}');
    const repo = new BlogRepository(client, TABLE_NAME, s3Client, BUCKET_NAME);

    const updatedBlog = await repo.update(blog);

    return generateSuccessResponse(200, `Blog updated successfully!`, {
      ...updatedBlog,
    });
  } catch (e) {
    logger.error(e);
    return generateErrorResponse(e as Error, 'createCategory');
  }
};

export const handler = middy(eventHandler).use(httpCors());
