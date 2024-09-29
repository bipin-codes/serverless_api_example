import { APIGatewayProxyEventPathParameters } from 'aws-lambda';
import { ObjectSchema } from 'joi';
import { ICategory } from '../validationSchema/category';
import { IBlog } from '../validationSchema/blog';

export const validateRequest = (
    schema: ObjectSchema<ICategory | IBlog>,
    data: APIGatewayProxyEventPathParameters | null
) => {
    return schema.validateAsync(data);
};
