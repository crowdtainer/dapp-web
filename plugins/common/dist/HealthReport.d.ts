export { HealthReport, LogType };
/**
 * Represents the type of log message for HealthReport.
 */
declare enum LogType {
    /**
     * Informational purposes; Signals the service is alive, along with a payload messsage.
     * Causes a 'ping' to the endpoint, using POST http method.
     * See https://healthchecks.io/docs/attaching_logs/
     */
    Information = 0,
    /**
     * Signals a service error, along with the payload messsage.
     * Causes a 'ping' to the 'fail' endpoint, using POST http method.
     * See https://healthchecks.io/docs/signaling_failures/ and
     * https://healthchecks.io/docs/attaching_logs/
    */
    Error = 1
}
/**
 * Represents a Health Report class for monitoring health of an arbitrary service.
 * Meant to be used in conjuction with https://healthchecks.io/docs/, following
 * its simple schemas/endpoints.
 */
declare class HealthReport {
    httpsModule: typeof import('https') | undefined;
    lastExecutionTime: Date;
    private healthCheckURL;
    private pingIntervalInSeconds;
    private failPingURL;
    private pingTimeoutInMilliseconds;
    private pingWithMessageTimoutInMilliseconds;
    /**
     * Creates a new HealthReport instance.
     * @param {URL} healthCheckURL - The URL of the monitoring service.
     * @param {number} pingIntervalInSeconds - The interval for ping in seconds.
     * @param {number} [pingTimeoutInMilliseconds=3000] - Maximum wait time for the alive/ping request to complete (default: 3000).
     * @param {number} [pingWithMessageTimoutInMilliseconds=5000] - Maximum wait time for ping with log requests to complete (default: 5000).
     */
    constructor(healthCheckURL: URL, pingIntervalInSeconds: number, pingTimeoutInMilliseconds?: number, pingWithMessageTimoutInMilliseconds?: number);
    /**
     * Sends a simple alive signal / heart-beat to the monitoring system. Can
     * be called multiple times, but will only execute if enough time has passed since
     * the last call (as defined in pingIntervalInSeconds in the constructor).
     * @returns {Promise<void>} A Promise that resolves when the signal is sent.
     */
    sendAliveSignal(): Promise<void>;
    /**
     * Posts log to the monitoring system.
     * If type is error, the message is sent to 'fail' ping endpoint.
     * Otherwise, a 'live' signal/heartbeat is sent with the given payload/message.
     * @param {string} message - The log message to be posted.
     * @param {LogType} logType - The type of log (Information or Error).
     * @returns {Promise<void>} A Promise that resolves when the log is posted.
     */
    postExternalLog(message: string, logType: LogType): Promise<void>;
    private sendGetRequest;
    private handleAliveSignalResponse;
    private handleAliveSignalError;
    private getEndpoint;
    private sendPostRequest;
    private handlePostResponse;
    private handlePostError;
}
