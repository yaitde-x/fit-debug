/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert = require('assert');

const fixtureText = '!|Set Form Fields|\r\n' +
	'|txtCustomer|Company Name|Go!|\r\n' +
	'|PACCAR|Paccar Warranty Customer|TRUE|\r\n';

const htmlBuilder = (fixture: string): string => {
	const lines = fixture.split(/\r?\n/);
	let html = '<table>';

	for (const ln of lines) {
		if (ln.trim().length > 0) {
			html += '<tr>';
			const parts = ln.trim().split('|').filter(part => part !== '|' && part !== '');

			for (const part of parts) {
				html += '<td>' + part + '</td>';
			}

			html += '</tr>';
		}
	}

	html += '</table>';
	return html;
};

suite('Fixture 2 Html', () => {

	//setup( () => {	});

	//teardown( () => {} );

	test('builds html', done => {
		const html = htmlBuilder(fixtureText);
		assert.strictEqual(html, "html");
	});
});
