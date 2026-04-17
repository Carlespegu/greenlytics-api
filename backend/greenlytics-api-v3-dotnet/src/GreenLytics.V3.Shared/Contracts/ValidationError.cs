namespace GreenLytics.V3.Shared.Contracts;

public sealed record ValidationError(
    string Field,
    string Code,
    string Message
);
