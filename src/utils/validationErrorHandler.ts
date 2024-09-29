import { APIGatewayProxyResult } from 'aws-lambda';
import { ValidationError } from 'joi';

const createErrorResponse = (
    statusCode: number,
    message: string,
    errors: string[] | undefined
): APIGatewayProxyResult => ({
    statusCode,
    body: JSON.stringify({ message, errors }),
});

const validationErrorHandler = ({
    details,
}: ValidationError): APIGatewayProxyResult => {
    const validationErrors = details.map((detail) => {
        return detail.message;
    });
    return createErrorResponse(
        400,
        'Request validation failed',
        validationErrors
    );
};

export default validationErrorHandler;
