import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import logger from '../../utils/logger';
import { validateRequest } from '../../utils/validateRequest';
import { deleteBlogSchema } from '../../validationSchema/blog';
import generateSuccessResponse from '../../utils/generateSuccessResponse';
import { generateErrorResponse } from '../../utils/generateErrorResponse';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import BlogRepository from '../../respositories/blogs/BlogRepository';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';
import { S3Client } from '@aws-sdk/client-s3';

const TABLE_NAME = process.env.TABLE_NAME || '';
const BUCKET_NAME = process.env.BUCKET_NAME || '';

const REGION = process.env.AWS_REGION;
const dbClient = new DynamoDBClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

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
    await validateRequest(deleteBlogSchema, event.pathParameters);

    const { id } = event.pathParameters as { id: string };

    const repo = new BlogRepository(
      dbClient,
      TABLE_NAME,
      s3Client,
      BUCKET_NAME
    );
    const result = await repo.delete(id);

    return generateSuccessResponse(200, 'Blog deleted successfully', {
      ...result,
    });
  } catch (e) {
    return generateErrorResponse(e as Error, 'deleteCategory');
  }
};

export const handler = middy(eventHandler).use(httpCors());
