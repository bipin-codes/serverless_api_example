import { APIGatewayProxyEventPathParameters } from 'aws-lambda';
import Joi from 'joi';

export interface ICategory {
  categoryName: string;
  id: string;
}
export interface ICategoryParams
  extends Omit<APIGatewayProxyEventPathParameters, 'id'> {
  id: string;
}

const idCheck = {
  id: Joi.string().required().not().empty().guid(),
};
const nameCheck = {
  categoryName: Joi.string().required().not().empty().min(3),
};

export const createCategorySchema = Joi.object({
  ...nameCheck,
});

export const updateCategorySchema = Joi.object({
  ...nameCheck,
  ...idCheck,
});

export const deleteCategorySchema = Joi.object({
  ...idCheck,
});
