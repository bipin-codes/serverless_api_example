export default (statusCode: number, msg: string, body: unknown = []) => {
    return { statusCode, body: JSON.stringify({ msg, body }) };
};
