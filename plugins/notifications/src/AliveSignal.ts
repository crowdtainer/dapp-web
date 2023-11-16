import { RequestOptions } from 'https';

export class AliveSignal {
    httpsModule: typeof import('https') | undefined = undefined;
    lastExecutionTime: Date = new Date();

    async sendAliveSignal(pingURL: URL, pingIntervalInSeconds: number) {
        if (!this.httpsModule) this.httpsModule = await import('https');
        const elapsedTime = new Date().getTime() - this.lastExecutionTime.getTime();
        if (!this.lastExecutionTime || elapsedTime / 1000 >= pingIntervalInSeconds) {
            try {
                this.httpsModule.get(pingURL).on('error', (error) => {
                    console.log('Warning: Monitoring/alive ping failed: ' + error)
                }).on('response', () => {
                    this.lastExecutionTime = new Date();
                });
            } catch (error) {
                console.log('Warning: Monitoring/alive ping failed: ' + error);
            }
        }
    }

    async postExternalLog(url: URL, message: string) {
        const options: RequestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Content-Length': Buffer.byteLength(message),
            },
        };

        if (!this.httpsModule) this.httpsModule = await import('https');
        const req = this.httpsModule.request(url, options, (res) => {
            console.log('Sent logs to monitoring service.');
        });

        req.on('error', (error) => {
            console.log('Warning: Failed to send error message to monitoring service: ' + error);
        });

        req.write(message);
        req.end();
    }
}