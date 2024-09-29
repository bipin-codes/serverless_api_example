import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import logger from '../../utils/logger';
import generateSuccessResponse from '../../utils/generateSuccessResponse';

import { IBlogParams, getBlogSchema } from '../../validationSchema/blog';
import BlogRepository from '../../respositories/blogs/BlogRepository';
import { validateRequest } from '../../utils/validateRequest';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';

const TABLE_NAME = process.env.TABLE_NAME || '';
const REGION = process.env.AWS_REGION;

const client = new DynamoDBClient({ region: REGION });

const eventHandler = async (
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
    const id = (event.queryStringParameters as IBlogParams)?.id;
    const limit = (event.queryStringParameters as IBlogParams)?.limit;

    await validateRequest(
      getBlogSchema,
      (event.queryStringParameters as IBlogParams) ?? {}
    );

    const repo = new BlogRepository(client, TABLE_NAME);
    const content = await repo.all(id, +limit);

    return generateSuccessResponse(200, 'Successfully fetched all blogs!', {
      data: content.blogs,
      key: content.lastKey,
    });
  } catch (e) {
    //TODO : REFINE THIS ERROR DON'T JUST RETURN THE ERROR TO CLIENT!!!!!
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: 'Internal Server Error', errors: e }),
    };
  }
};

export const handler = middy(eventHandler).use(httpCors());
