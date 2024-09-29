import {
  AttributeValue,
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';

import { IBlog } from '../../validationSchema/blog';
import IBlogRepository from './IBlogRepository';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { generateId } from '../../utils/idGenerator';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import logger from '../../utils/logger';

import { load } from 'cheerio';

export default class BlogRepository implements IBlogRepository {
  constructor(
    private dbClient: DynamoDBClient,
    private tableName: string,
    private s3Client?: S3Client,
    private bucketName?: string
  ) {}

  parseHTMLForS3Links(html: string) {
    const $ = load(html);
    const s3Pattern = new RegExp(
      `^https://${this.bucketName}\\.s3\\.${process.env.AWS_REGION}.amazonaws\\.com/`
    );

    const s3ImageLinks: Array<string> = [];

    $('img').each((index, img) => {
      const src = $(img).attr('src');
      if (src && s3Pattern.test(src)) s3ImageLinks.push(src);
    });

    return s3ImageLinks;
  }

  async filterAndCleanBlogImages(blog: IBlog): Promise<Array<string>> {
    const s3Links = this.parseHTMLForS3Links(blog.content);

    const objectsToDelete = [];
    const toKeep: Array<string> = [];

    for (const url of Array.from(blog.preSignedURLs)) {
      if (url === '' || s3Links.includes(url)) {
        toKeep.push(url);
        continue;
      }
      const key = url.split('/').slice(-2).join('/');
      const promiseToDelete = this.s3Client?.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
      objectsToDelete.push(promiseToDelete);
    }
    try {
      await Promise.all(objectsToDelete);
      return toKeep;
    } catch (e) {
      logger.error('Error while deleteting objects from S3');
      console.log(e);
      return [];
    }
  }

  async cleanUpBlogImages({ preSignedURLs }: IBlog) {
    const deletePromise = [];

    for (const url of Array.from(preSignedURLs)) {
      const key = url.split('/').slice(-2).join('/');
      const promiseToDelete = this.s3Client?.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
      deletePromise.push(promiseToDelete);
    }
    try {
      await Promise.all(deletePromise);
    } catch (e) {
      logger.error('Error while deleteting objects from S3');
      console.log(e);
      return [];
    }
  }

  async all(
    lastKey: string,
    limit: number
  ): Promise<{ blogs: IBlog[]; lastKey: string | undefined }> {
    const queryCommandInput: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: '#sortPartitionKey = :sortPartitionKey',
      ExpressionAttributeNames: {
        '#sortPartitionKey': 'sortPartitionKey',
      },
      ExpressionAttributeValues: {
        ':sortPartitionKey': { S: 'BLOGS' },
      },
      IndexName: 'SortingIndex',
      Limit: limit ? limit : 10,
      ScanIndexForward: false,
    };

    if (lastKey) {
      const key = JSON.parse(decodeURIComponent(lastKey));
      queryCommandInput.ExclusiveStartKey = key;
    }

    const { Items, LastEvaluatedKey } = await this.dbClient.send(
      new QueryCommand(queryCommandInput)
    );

    const evaluatedKey = LastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(LastEvaluatedKey))
      : undefined;

    const userRequiredData = Items?.map((item) => unmarshall(item)).map(
      (blog) => ({
        ...blog,
        categories: Array.from(blog.categories),
        additionalLinks: Array.from(blog.additionalLinks),
        preSignedURLs: Array.from(blog.preSignedURLs),
      })
    );

    return { blogs: userRequiredData as IBlog[], lastKey: evaluatedKey };
  }

  generateValue(array: Array<string>) {
    return array ? (array.length > 0 ? array : ['']) : [''];
  }

  async create({
    title,
    content,
    additionalLinks,
    isFeatured,
    categories,
    preSignedURLs,
    published,
  }: IBlog): Promise<IBlog> {
    const created = new Date().toISOString();
    const updated = new Date().toISOString();

    const blog = {
      id: { S: generateId() },
      title: { S: title },
      content: { S: content },
      additionalLinks: {
        SS: this.generateValue(additionalLinks),
      },
      isFeatured: { BOOL: isFeatured },
      categories: { SS: categories },
      published: { BOOL: published },
      preSignedURLs: {
        SS: this.generateValue(preSignedURLs),
      },
      created: { S: created },
      updated: { S: updated },
      sortPartitionKey: { S: 'BLOGS' },
    };

    await this.dbClient.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: blog,
        ConditionExpression: `attribute_not_exists(id)`,
      })
    );

    return {
      id: blog.id.S,
      content,
      additionalLinks,
      categories,
      isFeatured,
      published,
      title,
      preSignedURLs,
      created,
      updated,
    };
  }

  async delete(id: string): Promise<IBlog> {
    const { Attributes } = await this.dbClient.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: { id: { S: id } },
        ReturnValues: 'ALL_OLD',
      })
    );

    const deleted = unmarshall(
      Attributes as Record<string, AttributeValue>
    ) as IBlog;

    await this.cleanUpBlogImages(deleted);

    return deleted;
  }

  async update(blog: IBlog): Promise<IBlog> {
    const {
      additionalLinks,
      categories,
      content,
      id,
      isFeatured,
      preSignedURLs,
      published,
      title,
    } = blog;

    let toKeep: Array<string> = [];
    try {
      toKeep = await this.filterAndCleanBlogImages(blog); //incoming blog content...
    } catch (e) {
      console.log(e);
    }

    const { Attributes } = await this.dbClient.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: {
          id: { S: id },
        },
        UpdateExpression:
          'set published = :published, title = :title, categories = :categories, additionalLinks = :additionalLinks, isFeatured = :isFeatured, content = :content, preSignedURLs = :preSignedURLs',
        ExpressionAttributeValues: {
          ':published': { BOOL: published },
          ':title': { S: title },
          ':categories': { SS: categories },
          ':additionalLinks': { SS: additionalLinks },
          ':isFeatured': { BOOL: isFeatured },
          ':content': { S: content },
          ':preSignedURLs': {
            SS: toKeep ? (toKeep.length > 0 ? toKeep : ['']) : [''],
          },
        },
        ReturnValues: 'ALL_NEW',
        ConditionExpression: 'attribute_exists(id)',
      })
    );
    const updatedBlog = unmarshall(
      Attributes as Record<string, AttributeValue>
    ) as IBlog;

    return {
      ...updatedBlog,
      categories: Array.from(updatedBlog.categories),
      additionalLinks: Array.from(updatedBlog.additionalLinks),
    };
  }
}
