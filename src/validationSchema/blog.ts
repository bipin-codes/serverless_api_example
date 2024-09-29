import { APIGatewayProxyEventPathParameters } from 'aws-lambda';
import Joi from 'joi';

export interface IBlog {
  id: string;
  title: string;
  content: string;
  categories: string[];
  additionalLinks: string[];
  isFeatured: boolean;
  published: boolean;
  preSignedURLs: string[];
  created: string;
  updated: string;
}

export interface IBlogParams
  extends Omit<APIGatewayProxyEventPathParameters, 'id'> {
  id: string;
  limit: string;
}

const commonChecks = {
  title: Joi.string().required().not().empty().min(5),
  content: Joi.string().required().not().empty().min(5),
  additionalLinks: Joi.array().optional(),
  preSignedURLs: Joi.array().optional(),
  categories: Joi.array().required().not().empty(),
  isFeatured: Joi.bool().required(),
  published: Joi.boolean().required(),
};
const idChecks = {
  id: Joi.string().required().not().empty().guid(),
};

export const createBlogSchema = Joi.object({
  ...commonChecks,
  additionalLinks: commonChecks.additionalLinks
    .allow(null) // allow null values
    .default([]),
  preSignedURLs: commonChecks.preSignedURLs.allow(null).default([]),
});

export const updateBlogSchema = Joi.object({
  ...commonChecks,
  ...idChecks,
  preSignedURLs: commonChecks.preSignedURLs.allow(null).default([]),
});

export const deleteBlogSchema = Joi.object({
  ...idChecks,
});

export const getBlogSchema = Joi.object({
  limit: Joi.number().optional().min(1).max(10).default(5),
  id: Joi.alternatives()
    .try(
      Joi.object({
        created: Joi.object({
          S: Joi.string().isoDate().required(),
        }).required(),
        id: Joi.object({
          S: Joi.string().guid().required(),
        }).required(),
        sortPartitionKey: Joi.object({
          S: Joi.string().valid('BLOGS').required(),
        }).required(),
      }),
      Joi.any().allow(null)
    )
    .optional(),
}).unknown(false);
