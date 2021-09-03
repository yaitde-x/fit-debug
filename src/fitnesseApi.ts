
import * as net from 'net';
//import { NotebookControllerAffinity } from 'vscode';
import { DebuggerCallback } from './fitnesseRuntimeProxy';
//import PromiseSocket from 'promise-socket';
// import WebSocketAsPromised = require('websocket-as-promised');
// import WebSocket = require('ws');

export interface FitnesseApiCallback {
    (response: FitnesseResponse): void;
}
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
    name: string;
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
    connect(server: string, port: number, callback: DebuggerCallback): void
    exec(request: FitnesseRequest, callback: FitnesseApiCallback): void;
}


const STATE_DISCONNECTED: number = 0;
const STATE_CONNECTED: number = 1;

export class MockFitnesseApi implements FitnesseApi {
    rootPath: string = '/Users/sakamoto/Temp';

    private _socket: net.Socket;
    //private _client: PromiseSocket<net.Socket>;
    //private _client?: WebSocketAsPromised;

    // eslint-disable-next-line no-use-before-define
    private _queue : any;

    //private _buffer?: string;

    private _state: number = STATE_DISCONNECTED;

    constructor() {
        const that = this;

        this._queue = {};
        this._socket = new net.Socket();
        //this._client = new PromiseSocket(this._socket);

        this._socket.on('data', function (data) {
            const response =<FitnesseResponse>JSON.parse(data.toString('utf-8'));
            const callback = that._queue[response.requestId];

            if (callback) {
                callback(response);
            }
        });

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

    public connect(server: string, port: number, callback: DebuggerCallback): void {
        const that = this;

        if (this._state === STATE_CONNECTED) {
            return;
        }

        // this._client = new WebSocketAsPromised("ws://" + server + ":" + port, {
        //     createWebSocket: url => new WebSocket(url),
        //     extractMessageData: event => event, // <- this is important
        // });

        // this._client.onMessage.addListener(responseBuffer => {

        //     if (that._callback) {
        //         that._callback(<FitnesseResponse>JSON.parse(<string>responseBuffer));
        //     }
        //     //return <FitnesseResponse>JSON.parse(<string>responseBuffer);
        // });

        //await this._client.open();

        //await this._client.connect(port, server);
        this._socket.connect(port, server, () => {
            console.log('Connected');
            that._state = STATE_CONNECTED;
            callback();
        });

        return;
    }

    public exec(request: FitnesseRequest, callback: FitnesseApiCallback): void {

        this._requestId++;

        request.requestId = this._requestId + "";
        this._queue[request.requestId] = callback;

        if (request.statement) {
            request.statement = Buffer.from(this.htmlBuilder(request.statement)).toString('base64');
        }
        request.statement;

        this._socket.write(JSON.stringify(request) + '\r\n\r\n');

        //this._client?.send(JSON.stringify(request) + '\r\n\r\n');
        //await this._client.write(JSON.stringify(request) + '\r\n\r\n');

        // const responseBuffer: string | Buffer | undefined = await this.promiseWithTimeout(this._client.read(), 300);

        // if (responseBuffer && responseBuffer instanceof Buffer) {
        //     const stringBuf = responseBuffer.toString('utf-8');
        //     return <FitnesseResponse>JSON.parse(stringBuf);
        // }
        // return <FitnesseResponse>JSON.parse(<string>responseBuffer);
    }

    // private promiseWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    //     //let timeoutId: NodeJS.Timeout;
    //     const timeoutPromise = new Promise<T>((_, reject) => {
    //         const timeoutId = setTimeout(() => {
    //             clearTimeout(timeoutId);
    //             reject(new Error('Request timed out'));
    //         }, ms);
    //     });

    //     return Promise.race([promise, timeoutPromise]);
    // }
}