
import * as net from 'net';
import PromiseSocket from 'promise-socket';
export interface FitnesseRequest {
    requestId?: string;
    control: string;
    lineNumber: number;
    statement?: string;
}

export interface ApplicationState {
    connectionId: number;
    activeForm: string;
    testNumber: string;
    dataSet: string;
    user: string;
    userId: number;
    systemTime: string;
}

export interface StateVar {
    key: string;
    value: any;
}

export interface ExecutionError {
    code: string;
    stack: string[];
    messages: string[];
}

export interface ExecutionResult {
    pass: number;
    fail: number;
    exceptions?: number;
    messages?: string[];
    error?: ExecutionError;
}

export interface FitnesseResponse {
    requestId: string;
    state: ApplicationState;
    globals: StateVar[];
    locals: StateVar[];
    result?: ExecutionResult;
}

export interface FitnesseApi {
    connect(server: string, port: number): Promise<void>
    exec(request: FitnesseRequest): Promise<FitnesseResponse>;
}


const STATE_DISCONNECTED: number = 0;
const STATE_CONNECTED: number = 1;

export class MockFitnesseApi implements FitnesseApi {
    rootPath: string = '/Users/sakamoto/Temp';

    private _socket: net.Socket;
    private _client: PromiseSocket<net.Socket>;
    private _state: number = STATE_DISCONNECTED;

    constructor() {
        const that = this;

        this._socket = new net.Socket();
        this._client = new PromiseSocket(this._socket);

        this._socket.on('close', function () {
            that._state = STATE_DISCONNECTED;
            console.log('Connection closed');
        });
    }

    private _requestId: number = 0;

    private htmlBuilder(fixture: string): string {
        const lines = fixture.split(/\r?\n/);
        let html = '<table>';

        for (const ln of lines) {
            if (ln.trim().length > 0) {
                html += '<tr>';
                const parts = ln.trim()
                    .split('|')
                    .filter(part => part !== '|' && part !== '' && part !== '!');

                for (const part of parts) {
                    html += '<td>' + part + '</td>';
                }

                html += '</tr>';
            }
        }

        html += '</table>';
        return html;
    };

    public async connect(server: string, port: number): Promise<void> {

        if (this._state === STATE_CONNECTED) {
            return;
        }

        await this._client.connect(port, server);

        console.log('Connected');
        this._state = STATE_CONNECTED;

        return;
    }

    public async exec(request: FitnesseRequest): Promise<FitnesseResponse> {

        this._requestId++;
        request.requestId = this._requestId + "";

        if (request.statement) {
            request.statement = Buffer.from(this.htmlBuilder(request.statement)).toString('base64');
        }
        request.statement += '\r\n\r\n';
        
        await this._client.write(JSON.stringify(request));

        const responseBuffer: string | Buffer | undefined = await this.promiseWithTimeout(this._client.read(), 300);

        if (responseBuffer && responseBuffer instanceof Buffer) {
            const stringBuf = responseBuffer.toString('utf-8');
            return <FitnesseResponse>JSON.parse(stringBuf);
        }
        return <FitnesseResponse>JSON.parse(<string>responseBuffer);
    }

    private promiseWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        //let timeoutId: NodeJS.Timeout;
        const timeoutPromise = new Promise<T>((_, reject) => {
            const timeoutId = setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error('Request timed out'));
            }, ms);
        });

        return Promise.race([promise, timeoutPromise]);
    }
}