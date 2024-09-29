import middy from '@middy/core';
import httpCors from '@middy/http-cors';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateId } from '../../utils/idGenerator';

const REGION = process.env.AWS_REGION;
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3Client = new S3Client({ region: REGION });

const eventHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const { images } = JSON.parse(event.body!);
  const keyRoot = generateId();

  const presignedURLs = [];
  const urls = [];

  for (const { index, type } of images) {
    const key = `${keyRoot}/${index}.${type}`;
    const command = new PutObjectCommand({
      Key: key,
      Bucket: BUCKET_NAME,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    presignedURLs.push(url);

    urls.push(`https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ presignedURLs, urls }),
  };
};

export const handler = middy(eventHandler).use(httpCors());
