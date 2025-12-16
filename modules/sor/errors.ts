export class SorAbortError extends Error {
    constructor(message: string = 'SOR request aborted') {
        super(message);
        this.name = 'SorAbortError';

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SorAbortError);
        }
    }
}
