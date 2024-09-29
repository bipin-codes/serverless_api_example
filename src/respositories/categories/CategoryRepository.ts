import {
  AttributeValue,
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { ICategory } from '../../validationSchema/category';
import ICategoryRepositoryInterface from './ICategoryRepository';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { generateId } from '../../utils/idGenerator';

export default class CategoryRepository
  implements ICategoryRepositoryInterface
{
  constructor(
    private dbClient: DynamoDBClient,
    private tableName: string
  ) {}

  async all(): Promise<ICategory[]> {
    const { Items } = await this.dbClient.send(
      new ScanCommand({ TableName: this.tableName })
    );
    const userRequiredData = Items?.map((item) => unmarshall(item));
    return userRequiredData as ICategory[];
  }

  async create(category: ICategory): Promise<ICategory> {
    const id = generateId();

    await this.dbClient.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: {
          id: { S: id },
          categoryName: { S: category.categoryName },
        },
        ConditionExpression: `attribute_not_exists(categoryName)`,
      })
    );

    return { id, categoryName: category.categoryName };
  }

  async delete(id: string): Promise<ICategory> {
    const { Attributes } = await this.dbClient.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: {
          id: { S: id },
        },
        ReturnValues: 'ALL_OLD',
      })
    );
    return unmarshall(
      Attributes as Record<string, AttributeValue>
    ) as ICategory;
  }

  async update({ id, categoryName }: ICategory): Promise<ICategory> {
    const result = await this.dbClient.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: {
          id: { S: id },
        },
        UpdateExpression: 'set categoryName = :category',
        ExpressionAttributeValues: {
          ':category': { S: categoryName },
        },
        ConditionExpression: 'attribute_exists(id)',
        ReturnValues: 'UPDATED_OLD',
      })
    );
    return unmarshall(result.Attributes!) as ICategory;
  }
}
