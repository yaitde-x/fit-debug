/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { FitnesseDebugSession } from './fitnesseDebug';

import * as fs from 'fs';
import * as Net from 'net';
import { FileAccessor } from './fitnesseRuntimeProxy';
import { SocketFitnesseApi } from './fitnesseApi';
import { MockFitnesseApi } from './tests/mockAdapter';

/*
 * debugAdapter.js is the entrypoint of the debug adapter when it runs as a separate process.
 */

/*
 * Since here we run the debug adapter as a separate ("external") process, it has no access to VS Code API.
 * So we can only use node.js API for accessing files.
 */
const fsAccessor:  FileAccessor = {
	async readFile(path: string): Promise<string> {
		return new Promise((resolve, reject) => {
			fs.readFile(path, { flag : 'r' }, (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(data.toString());
				}
			});
		});
	}
};

/*
 * When the debug adapter is run as an external process,
 * normally the helper function DebugSession.run(...) takes care of everything:
 *
 * 	MockDebugSession.run(MockDebugSession);
 *
 * but here the helper is not flexible enough to deal with a debug session constructors with a parameter.
 * So for now we copied and modified the helper:
 */

// first parse command line arguments to see whether the debug adapter should run as a server
let port = 0;
let mockStrategy = '';

const args = process.argv.slice(2);
args.forEach(function (val, index, array) {
	const portMatch = /^--server=(\d{4,5})$/.exec(val);
	if (portMatch) {
		port = parseInt(portMatch[1], 10);
	}

	const mockMatch = /^--mock=(\d{4,5})$/.exec(val);
	if (mockMatch) {
		mockStrategy = mockMatch[1];
	}
});

if (port > 0) {

	// start a server that creates a new session for every connection request
	console.error(`waiting for debug protocol on port ${port}`);
	Net.createServer((socket) => {
		console.error('>> accepted connection from client');
		socket.on('end', () => {
			console.error('>> client connection closed\n');
		});
		const session = new FitnesseDebugSession(fsAccessor, new SocketFitnesseApi());
		session.setRunAsServer(true);
		session.start(socket, socket);
	}).listen(port);
} else {

	// start a single session that communicates via stdin/stdout
	const session = new FitnesseDebugSession(fsAccessor, new MockFitnesseApi(mockStrategy));
	process.on('SIGTERM', () => {
		session.shutdown();
	});
	session.start(process.stdin, process.stdout);
}
