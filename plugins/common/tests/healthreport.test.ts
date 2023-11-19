import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { HealthReport, LogType } from '../src/HealthReport';

describe('HealthReport', () => {
    let healthReport: HealthReport;
    let mock: MockAdapter;

    const healthCheckURL = new URL('https://example.com');
    const pingInterval = 60; // seconds

    beforeEach(() => {
        mock = new MockAdapter(axios);
        healthReport = new HealthReport(healthCheckURL, pingInterval);
    });

    afterEach(() => {
        mock.restore();
    });

    it('sends alive signal when ping interval is reached', async () => {

        mock.onGet(healthCheckURL.toString()).reply(200, 'OK');

        const initialLastExecutionTime = healthReport.lastExecutionTime;
        healthReport.lastExecutionTime = new Date(initialLastExecutionTime.getTime() - (pingInterval * 1000 + 1));

        await healthReport.sendAliveSignal();

        expect(mock.history.get.length).toBe(1);
        expect(mock.history.get[0].url).toBe(healthCheckURL.toString());
        expect(healthReport.lastExecutionTime).not.toEqual(initialLastExecutionTime);
    });

    it('posts external log with type Information', async () => {

        const consoleSpy = jest.spyOn(console, 'log');

        mock.onPost(healthCheckURL.toString()).reply(200, 'OK');

        const message = 'Test Information Log';

        await healthReport.postExternalLog(message, LogType.Information);

        expect(mock.history.post.length).toBe(1);
        expect(mock.history.post[0].url).toBe(healthCheckURL.toString());
        expect(mock.history.post[0].data).toBe(message);
        expect(consoleSpy).toHaveBeenCalledWith(`Sent logs to monitoring service: 200`);
        consoleSpy.mockRestore();
    });

    it('handles post external log error', async () => {

        const consoleSpy = jest.spyOn(console, 'log');

        mock.onPost(healthCheckURL.toString() + '/fail').reply(200, 'OK');

        const message = 'Test Information Log';

        await healthReport.postExternalLog(message, LogType.Error);

        expect(mock.history.post.length).toBe(1);
        expect(mock.history.post[0].url).toBe(healthCheckURL.toString() + '/fail');
        expect(mock.history.post[0].data).toBe(message);
        expect(consoleSpy).toHaveBeenCalledWith(`Sent logs to monitoring service: 200`);
        consoleSpy.mockRestore();
    });
});
