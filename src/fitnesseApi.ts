
export interface FitnesseRequest {
    lineNumber: number;
    statement: string;
}

export interface ApplicationState {
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

export interface FitnesseResponse {
    state: ApplicationState;
    globals: StateVar[];
    locals: StateVar[];
}

export interface FitnesseApi {
    exec(request: FitnesseRequest): FitnesseResponse;
}

export class MockFitnesseApi implements FitnesseApi {
    rootPath: string = '/Users/sakamoto/Temp';

    public exec(request: FitnesseRequest): FitnesseResponse {
        const systemTime = new Date().toISOString().slice(0, 10);

        const responses: any = {
            "0": {
                state: {
                    activeForm: ""
                    , user: ""
                    , userId: 0
                    , testNumber: ""
                    , dataSet: ""
                    , systemTime: systemTime
                },
                globals: [
                    { key: "session", value: "someguid" }
                ],
                locals: [
                    
                ]
            },
            "2": {
                state: {
                    activeForm: ""
                    , user: ""
                    , userId: 0
                    , testNumber: ""
                    , dataSet: ""
                    , systemTime: systemTime
                },
                globals: [
                    { key: "session", value: "someguid" }
                ],
                locals: [
                ]
            },
            "27": {
                state: {
                    activeForm: ""
                    , user: ""
                    , userId: 0
                    , testNumber: "PAC95010-001"
                    , dataSet: ""
                    , systemTime: systemTime
                },
                globals: [
                    { key: "session", value: "someguid" }
                ],
                locals: [
                    
                ]
            },
            "31": {
                state: {
                    activeForm: ""
                    , user: ""
                    , userId: 0
                    , testNumber: "PAC95010-001"
                    , dataSet: "ImmediateInterbranchTransferSetup"
                    , systemTime: systemTime
                },
                globals: [
                    { key: "session", value: "someguid" }
                ],
                locals: [
                    
                ]
            },
            "35": {
                state: {
                    activeForm: ""
                    , user: "demo"
                    , userId: 1
                    , testNumber: "PAC95010-001"
                    , dataSet: "ImmediateInterbranchTransferSetup"
                    , systemTime: systemTime
                },
                globals: [
                    { key: "session", value: "someguid" }
                ],
                locals: [
                    { key: "businessProcess", value: { id: 15, description: "abc", customer: "ABC" } }
                ]
            },
            "45": {
                state: {
                    activeForm: ""
                    , user: "demo"
                    , userId: 1
                    , testNumber: "PAC95010-001"
                    , dataSet: "ImmediateInterbranchTransferSetup"
                    , systemTime: "04/10/2013 8:00 AM"
                },
                globals: [
                    { key: "session", value: "someguid" }
                ],
                locals: [
                    { key: "businessProcess", value: { id: 15, description: "abc", customer: "ABC" } }
                ]
            },
            "51": {
                state: {
                    activeForm: "Customer"
                    , user: "demo"
                    , userId: 1
                    , testNumber: "PAC95010-001"
                    , dataSet: "ImmediateInterbranchTransferSetup"
                    , systemTime: "04/10/2013 8:00 AM"
                },
                globals: [
                    { key: "session", value: "someguid" }
                ],
                locals: [
                    { key: "businessProcess", value: { id: 15, description: "abc", customer: "ABC" } }
                ]
            }
        };

        var key = (request.lineNumber + "");
        if (responses[key] === undefined) {
            return {
                state: {
                    activeForm: "unknown"
                    , user: "unknown"
                    , userId: -1
                    , testNumber: "unknown"
                    , dataSet: "unknown"
                    , systemTime: ""
                },
                globals: [
                ],
                locals: [
                ]
            };
        }

        return responses[key];
    }
}