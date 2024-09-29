class CustomError extends Error {
    constructor(msg = 'Custom Error') {
        super(msg);
    }
    errors: Array<string> = [];
}

export class ItemAlreadyExistsException extends CustomError {
    constructor() {
        super();
        this.message = 'ItemAlreadyExistsException';
        this.errors.push('This item already exists!');
    }
}
export class ItemCouldNotBeUpdatedException extends CustomError {
    constructor() {
        super();
        this.message = 'ItemCouldNotBeUpdatedException';
        this.errors.push('Item not be updated since no such ID exists!');
    }
}
export class ItemCouldNotBeDeletedException extends CustomError {
    constructor() {
        super();
        this.message = 'ItemCouldNotBeDeletedException';
        this.errors.push('Item could not be deleted since no such ID exists!');
    }
}

export class InvalidCredentials extends Error {
    constructor(message: string = 'Invalid Credentials Passed!') {
        super(message);
        this.name = 'InvalidCredentials';
    }
}
