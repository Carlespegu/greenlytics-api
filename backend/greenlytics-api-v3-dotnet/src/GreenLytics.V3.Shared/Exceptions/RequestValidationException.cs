using GreenLytics.V3.Shared.Contracts;

namespace GreenLytics.V3.Shared.Exceptions;

public sealed class RequestValidationException : Exception
{
    public RequestValidationException(
        string message,
        int statusCode,
        string errorCode,
        IReadOnlyList<ValidationError>? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
        Errors = errors ?? Array.Empty<ValidationError>();
    }

    public int StatusCode { get; }
    public string ErrorCode { get; }
    public IReadOnlyList<ValidationError> Errors { get; }

    public static RequestValidationException BadRequest(string message, params ValidationError[] errors)
        => new(message, 400, "validation_error", errors);

    public static RequestValidationException Conflict(string message, params ValidationError[] errors)
        => new(message, 409, "conflict", errors);

    public static RequestValidationException Unprocessable(string message, params ValidationError[] errors)
        => new(message, 422, "unprocessable_image", errors);

    public static ValidationError Field(string field, string code, string message)
        => new(field, code, message);
}
