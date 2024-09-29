export class EmptyRequestException extends Error {
    constructor() {
        super();
        this.message = 'Empty request body was passed!';
        this.name = 'EmptyRequestException.';
    }
}
