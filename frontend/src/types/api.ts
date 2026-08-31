/**
 * The standard NestJS HTTP exception body shape returned by every backend
 * error response (thrown via e.g. `throw new NotFoundException('...')`, or
 * produced by the global ValidationPipe). `message` is a single string for
 * manually-thrown exceptions, or an array of strings for class-validator
 * validation failures.
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}
