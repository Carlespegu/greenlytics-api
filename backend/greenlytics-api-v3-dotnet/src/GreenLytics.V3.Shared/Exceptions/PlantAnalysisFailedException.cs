namespace GreenLytics.V3.Shared.Exceptions;

public sealed class PlantAnalysisFailedException : Exception
{
    public PlantAnalysisFailedException(string message, bool isTimeout = false)
        : base(message)
    {
        IsTimeout = isTimeout;
    }

    public bool IsTimeout { get; }
}
