import axios, { AxiosError, AxiosResponse } from 'axios';

export { HealthReport, LogType };

/**
 * Represents the type of log message for HealthReport.
 */
enum LogType {
    /**
     * Informational purposes; Signals the service is alive, along with a payload messsage.
     * Causes a 'ping' to the endpoint, using POST http method.
     * See https://healthchecks.io/docs/attaching_logs/
     */
    Information,

    /**
     * Signals a service error, along with the payload messsage.
     * Causes a 'ping' to the 'fail' endpoint, using POST http method.
     * See https://healthchecks.io/docs/signaling_failures/ and 
     * https://healthchecks.io/docs/attaching_logs/
    */
    Error
}

/**
 * Represents a Health Report class for monitoring health of an arbitrary service.
 * Meant to be used in conjuction with https://healthchecks.io/docs/, following
 * its simple schemas/endpoints.
 */
class HealthReport {
    httpsModule: typeof import('https') | undefined = undefined;
    lastExecutionTime: Date = new Date();

    private healthCheckURL: URL;
    private pingIntervalInSeconds: number;
    private failPingURL: URL;

    private pingTimeoutInMilliseconds = 3000;
    private pingWithMessageTimoutInMilliseconds = 5000;

    /**
     * Creates a new HealthReport instance.
     * @param {URL} healthCheckURL - The URL of the monitoring service.
     * @param {number} pingIntervalInSeconds - The interval for ping in seconds.
     * @param {number} [pingTimeoutInMilliseconds=3000] - Maximum wait time for the alive/ping request to complete (default: 3000).
     * @param {number} [pingWithMessageTimoutInMilliseconds=5000] - Maximum wait time for ping with log requests to complete (default: 5000).
     */
    constructor(healthCheckURL: URL,
        pingIntervalInSeconds: number,
        pingTimeoutInMilliseconds: number = 3000,
        pingWithMessageTimoutInMilliseconds: number = 5000) {
        this.healthCheckURL = healthCheckURL;
        this.pingIntervalInSeconds = pingIntervalInSeconds;
        // `${HEALTH_CHECK_URL}/fail`
        this.failPingURL = new URL(healthCheckURL.toString() + '/fail');
        this.pingTimeoutInMilliseconds = pingTimeoutInMilliseconds;
        this.pingWithMessageTimoutInMilliseconds = pingWithMessageTimoutInMilliseconds;
    }

    /**
     * Sends a simple alive signal / heart-beat to the monitoring system. Can 
     * be called multiple times, but will only execute if enough time has passed since
     * the last call (as defined in pingIntervalInSeconds in the constructor).
     * @returns {Promise<void>} A Promise that resolves when the signal is sent.
     */
    async sendAliveSignal() {
        const elapsedTime = new Date().getTime() - this.lastExecutionTime.getTime();
        if (!this.lastExecutionTime || elapsedTime / 1000 >= this.pingIntervalInSeconds) {
            try {
                const response = await this.sendGetRequest(this.healthCheckURL);

                this.handleAliveSignalResponse(response);
            } catch (error) {
                this.handleAliveSignalError(error as Error);
            }
        }
    }

    /**
     * Posts log to the monitoring system.
     * If type is error, the message is sent to 'fail' ping endpoint.
     * Otherwise, a 'live' signal/heartbeat is sent with the given payload/message.
     * @param {string} message - The log message to be posted.
     * @param {LogType} logType - The type of log (Information or Error).
     * @returns {Promise<void>} A Promise that resolves when the log is posted.
     */
    async postExternalLog(message: string, logType: LogType) {
        try {
            const postData = message;
            const endpoint = this.getEndpoint(logType);
            const response = await this.sendPostRequest(endpoint, postData);
            this.handlePostResponse(response);
        } catch (error) {
            this.handlePostError(error as Error);
        }
    }

    private async sendGetRequest(url: URL): Promise<AxiosResponse> {
        try {
            return await axios.get(url.toString(), { timeout: this.pingTimeoutInMilliseconds });
        } catch (error) {
            throw new Error('Monitoring/alive ping failed: ' + (error as AxiosError).message);
        }
    }

    private handleAliveSignalResponse(response: AxiosResponse) {
        if (response.status === 200) {
            this.lastExecutionTime = new Date();
        } else {
            console.log('Warning: Monitoring/alive ping failed with status code: ' + response.status);
        }
    }

    private handleAliveSignalError(error: Error) {
        console.log('Warning: Monitoring/alive ping failed: ' + error.message);
    }

    private getEndpoint(logType: LogType): string {
        return logType === LogType.Error ? this.failPingURL.toString() : this.healthCheckURL.toString();
    }

    private async sendPostRequest(endpoint: string, postData: string): Promise<AxiosResponse> {
        try {
            const response = await axios.post(endpoint, postData, {
                timeout: this.pingWithMessageTimoutInMilliseconds,
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Length': Buffer.byteLength(postData).toString(),
                },
            });
            return response;
        } catch (error) {
            throw new Error((error as AxiosError).message);
        }
    }

    private handlePostResponse(response: AxiosResponse) {
        if (response.status !== 200) {
            console.log(`Warning: Failed to send error message to monitoring service. Response code: ${response.status} message: ${response.statusText}`);
        } else {
            this.lastExecutionTime = new Date();
            if (process.env.NODE_ENV == "development") {
                console.log('Sent log to monitoring service.');
            }
        }
    }

    private handlePostError(error: Error) {
        console.log('Warning: Failed to send error message to monitoring service:', error.message);
    }
}