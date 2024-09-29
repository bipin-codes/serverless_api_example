import { ValidationError } from 'joi';
import validationErrorHandler from './validationErrorHandler';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import logger from './logger';
import {
    ItemAlreadyExistsException,
    ItemCouldNotBeDeletedException,
    ItemCouldNotBeUpdatedException,
} from '../exceptions/Exceptions';

const GetErrorDetails = (source: string) => {
    switch (source) {
        case 'createCategory':
            return new ItemAlreadyExistsException();
        case 'updateCategory':
            return new ItemCouldNotBeUpdatedException();
        case 'deleteCategory':
            return new ItemCouldNotBeDeletedException();

        default:
            logger.warn('ERROR NOT HANDLED!!!');
    }
};
//TODO: Refactor this code once publication is complete...
const generateErrorResponse = (error: Error, source: string) => {
    

    if (error instanceof ValidationError) {
        return validationErrorHandler(error);
    } else if (error instanceof ConditionalCheckFailedException) {
        return {
            statusCode: 400,
            body: JSON.stringify(GetErrorDetails(source)),
        };
        //improve this ...
    } else if (error.name === 'InvalidCredentials') {
        return { statusCode: 401, body: JSON.stringify(error) };
    } else if (
        error.name === 'SyntaxError' ||
        error.name == 'ValidationException'
    ) {
        return {
            statusCode: 400,
            body: JSON.stringify({ msg: 'Bad Request!' }),
        };
    } else {
        return {
            statusCode: 500,
            body: JSON.stringify({ msg: 'Internal Server Error!' }),
        };
    }
};

export { generateErrorResponse };
