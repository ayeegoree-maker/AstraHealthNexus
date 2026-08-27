import { test } from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from './errorHandler.js';

function makeResponse() {
    let statusCode = 200;
    let body: unknown;

    return {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(value: unknown) {
            body = value;
            return this;
        },
        get statusCode() {
            return statusCode;
        },
        get body() {
            return body;
        }
    };
}

test('404 errors use the public message', () => {
    const res = makeResponse();

    const error = new Error('internal route detail') as Error & {
        status: number;
        publicMessage: string;
    };

    error.status = 404;
    error.publicMessage = 'Route not found';

    errorHandler(
        error,
        {} as never,
        res as never,
        (() => undefined) as never
    );

    assert.equal(res.statusCode, 404);

    assert.deepEqual(res.body, {
        status: 'error',
        message: 'Route not found'
    });
});

test('500 errors do not expose internal details', () => {
    const res = makeResponse();

    const error = new Error('secret database connection details');

    errorHandler(
        error,
        {} as never,
        res as never,
        (() => undefined) as never
    );

    assert.equal(res.statusCode, 500);

    assert.deepEqual(res.body, {
        status: 'error',
        message: 'Internal server error'
    });
});

test('malformed JSON gets a 400 response', () => {
    const res = makeResponse();

    const error = new SyntaxError('Unexpected token') as SyntaxError & {
        status: number;
        type: string;
    };

    error.status = 400;
    error.type = 'entity.parse.failed';

    errorHandler(
        error,
        {} as never,
        res as never,
        (() => undefined) as never
    );

    assert.equal(res.statusCode, 400);

    assert.deepEqual(res.body, {
        status: 'error',
        message: 'Invalid JSON payload'
    });
});