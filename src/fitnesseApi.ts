
import * as net from 'net';
//import { NotebookControllerAffinity } from 'vscode';
import { DebuggerCallback, DebuggerCallbackWithResult } from './fitnesseRuntimeProxy';
//import PromiseSocket from 'promise-socket';
// import WebSocketAsPromised = require('websocket-as-promised');
// import WebSocket = require('ws');

export interface FitnesseApiCallback {
    (response: FitnesseResponse): void;
}
export interface FitnesseRequest {
    testName: string;
    requestId: string;
    control: string;
    lineNumber: number;
    statement?: string;
}

export const DEFAULT_APPLICATION_STATE = () : ApplicationState => {
    return {
        connectionId : 0, activeForm: '', testNumber: '', dataSet: '', user: '', userId: 0, systemTime: ''
    };
};
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
    resumeOnLine?: number;
    state: ApplicationState;
    globals: StateVar[];
    locals: StateVar[];
    result?: ExecutionResult;
}

export interface FitnesseApi {
    connect(server: string, port: number, callback: DebuggerCallback, disconnectCallback: DebuggerCallbackWithResult<string>): void
    disconnect(callback: DebuggerCallback);

    exec(request: FitnesseRequest, callback: FitnesseApiCallback): void;
}


const STATE_DISCONNECTED: number = 0;
const STATE_CONNECTED: number = 1;

export class SocketFitnesseApi implements FitnesseApi {
    rootPath: string = '/Users/sakamoto/Temp';

    private _socket: net.Socket;
    // eslint-disable-next-line no-use-before-define
    private _queue: any;
    private _state: number = STATE_DISCONNECTED;
    private _buffer: Buffer;
    private _bufferPos: number = 0;
    private _disconnectCallback?: DebuggerCallbackWithResult<string>;

    constructor() {
        const that = this;

        this._queue = {};
        this._socket = new net.Socket();
        this._buffer = Buffer.alloc(1024000 * 4);

        this._socket.on('data', function (data) {

            let readPos = 0;
            let eotCnt = 0;

            while (readPos < data.length) {
                const char = data[readPos];

                if (char === 13 || char === 10) {
                    eotCnt++;
                } else {
                    eotCnt = 0;
                }

                that._buffer[that._bufferPos++] = char;

                ++readPos;

                if (eotCnt === 4) {
                    const payload = that._buffer.toString('utf-8', 0, that._bufferPos);
                    const response = <FitnesseResponse>JSON.parse(payload);
                    const callback = that._queue[response.requestId];

                    console.log('req in: ' + response.requestId);
                    that._bufferPos = 0;

                    if (callback) {
                        delete that._queue[response.requestId];
                        callback(response);
                    }
                }
            }
        });

        this._socket.on('close', function () {
            that._state = STATE_DISCONNECTED;
            console.log('Connection closed');

            if (that._disconnectCallback) {
                that._disconnectCallback('end');
            }
        });
    }

    public disconnect(callback: DebuggerCallback) : void {
        this._socket.end(callback);
    }

    public connect(server: string, port: number, callback: DebuggerCallback, disconnectCallback: DebuggerCallbackWithResult<string>): void {
        const that = this;

        if (this._state === STATE_CONNECTED) {
            return;
        }

        this._socket.connect(port, server, () => {
            console.log('Connected');
            that._state = STATE_CONNECTED;
            callback();
        });

        return;
    }

    public exec(request: FitnesseRequest, callback: FitnesseApiCallback): void {
        this._queue[request.requestId] = callback;

        console.log('req out : ' + request.requestId);
        this._socket.write(JSON.stringify(request) + '\r\n\r\n');
    }
}