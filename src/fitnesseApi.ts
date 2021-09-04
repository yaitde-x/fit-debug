
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
    // eslint-disable-next-line no-use-before-define
    private _queue: any;
    private _state: number = STATE_DISCONNECTED;
    private _buffer: Buffer;
    private _bufferPos: number = 0;

    constructor(errorCallback? : DebuggerCallbackWithResult<string>) {
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
                    that._buffer[that._bufferPos++] = char;
                }

                ++readPos;

                if (eotCnt === 4) {
                    const payload = that._buffer.toString('utf-8', 0, that._bufferPos);
                    const response = <FitnesseResponse>JSON.parse(payload);
                    const callback = that._queue[response.requestId];

                    console.log('req in: ' + response.requestId);
                    that._bufferPos = 0;

                    if (callback){
                        delete that._queue[response.requestId];
                        callback(response);
                    }
                }
            }
        });

        this._socket.on('close', function () {
            that._state = STATE_DISCONNECTED;
            console.log('Connection closed');

            if (errorCallback){
                errorCallback('close');
            }
        });
    }

    private _requestId: number = 0;

    public connect(server: string, port: number, callback: DebuggerCallback): void {
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

        this._requestId++;

        request.requestId = this._requestId + "";
        this._queue[request.requestId] = callback;
        
        this._socket.write(JSON.stringify(request) + '\r\n\r\n');
    }
}