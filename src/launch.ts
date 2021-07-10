import { ConfigurationTarget } from "vscode";

export class Launch{
    version!:string;
    configurations!:Configuration[];
}

export class Configuration{
    name!:string;
    type:string = "clr";
    request:string = "launch";
    preLaunchTask:string ="Build";
    program:string = "${workspaceFolder}/bin/Debug/Editor";
    args?:string[];
    cwd:string =  "${workspaceFolder}";
    stopAtEntry:boolean =  false;
    console:string = "integratedTerminal";
	internalConsoleOptions:string = "neverOpen";
}