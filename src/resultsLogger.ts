import { FitnesseRequest, FitnesseResponse } from "./fitnesseApi";
import * as fs from 'fs';
import * as path from 'path';

export interface IFitResultsLogger {
	logExecution(results: FitnesseRequest, response: FitnesseResponse): void;
	initialize(): void;
}

export class NullResultsLogger implements IFitResultsLogger {
	logExecution(results: FitnesseRequest, response: FitnesseResponse): void {
	}

	initialize(): void {

	}
}

export class FileResultsLogger implements IFitResultsLogger {

	private _logPath: string;

	constructor(logPath: string) {
		this._logPath = logPath;
	}

	private getHistoryFile(logFile: string): string {
		const historyPath = path.join(path.dirname(logFile), 'run-history');
		const baseName = path.basename(logFile, path.extname(logFile));
		const serialTime = Date.now();

		const historyFile = path.join(historyPath, baseName + serialTime + '.fitlog');
		return historyFile;
	}

	initialize(): void {

		// copy the old file to history
		fs.copyFileSync(this._logPath, this.getHistoryFile(this._logPath));
		// blank current run
		fs.writeFile(this._logPath, '', err => {
			if (err) {
				console.error(err);
				return;
			}
		});
	}

	logExecution(request: FitnesseRequest, response: FitnesseResponse): void {

		let buf: string = '----------\r\n';
		buf += 'request : ' + request.requestId + '\r\n\tline : ' + request.lineNumber + '\r\n';
		buf += request.statement + '\r\n';
		buf += 'response : ' + '\r\n';
		buf += '\tpass : ' + response.result?.pass +
			', fail : ' + response.result?.fail +
			', exceptions : ' + response.result?.exceptions;

		if (response.result?.error) {
			const error = response.result.error;
			buf += '\r\n\r\nerrors : \r\n\tCode : ' + error.code + '\r\n';
			for (const e of error.messages) {
				buf += '\t' + e + '\r\n';
			}

			if (error.stack) {
				buf += 'stack : \r\n\t' + error.stack;
			}
		}

		buf += '\r\n----------\r\n\r\n';

		fs.writeFile(this._logPath, buf, { flag: 'a+' }, err => {
			if (err) {
				console.error(err);
				return;
			}
		});

	}
}