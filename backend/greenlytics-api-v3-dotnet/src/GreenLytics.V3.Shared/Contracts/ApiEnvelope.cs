namespace GreenLytics.V3.Shared.Contracts;

public sealed record ApiEnvelope<T>(
    bool Success,
    T? Data,
    string? Message = null,
    string? ErrorCode = null,
    IReadOnlyList<ValidationError>? Errors = null
);
