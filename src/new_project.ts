import { exec } from "child_process";
import {Progress, ProgressLocation, ProgressOptions, Task, window} from "vscode";
import fs = require('fs');
import { Configuration, Launch } from "./launch";


export async function createNewProject(projectName: string, folderPath: string) {
    await execute(`tap sdk new project ${projectName} -o ${folderPath}`);

    await addVSCodeIntergration(folderPath);

    let launchJsonFilePath = `${folderPath}\\.vscode\\launch.json`;

    await addLaunchConfigureDebugWithEditor(launchJsonFilePath);

    let csProjectFilePath = `${folderPath}\\${projectName}\\${projectName}.csproj`;

    await addEditorInCsProject(csProjectFilePath);

    return true;
}

async function addVSCodeIntergration(projectPath: string) {
    await execute(`cd ${projectPath} && tap sdk new integration vscode`);
}

function jsonCommentStrip(txt: string) {
    var re = new RegExp("\/\/(.*)", "g");
    return txt.replace(re, '');
}

async function addLaunchConfigureDebugWithEditor(launchJsonFilePath: string) {
    let rawdata = (await fs.promises.readFile(launchJsonFilePath)).toString();
    let jsontxt = jsonCommentStrip(rawdata);
    let lauch = JSON.parse(jsontxt) as Launch;
    let editorDebug = new Configuration();
    editorDebug.name = "Debug Editor (Windows)";
    lauch.configurations.push(editorDebug);

    let newLaunch = JSON.stringify(lauch);

    await fs.promises.rm(launchJsonFilePath);

    await fs.promises.writeFile(launchJsonFilePath, newLaunch, 'utf-8');
}

async function addEditorInCsProject(csProjectFilePath: string) {
    let rawdata = (await fs.promises.readFile(csProjectFilePath)).toString();

    let newdata = rawdata.split("</Project>")[0];

    newdata = newdata.concat("<ItemGroup>\r\n  <AdditionalOpenTapPackage Include=\"Editor\" Version=\"9.15.0\" Repository=\"packages.opentap.io\"/>\r\n </ItemGroup>");

    newdata = newdata.concat("\r\n</Project>");

    await fs.promises.rm(csProjectFilePath);

    await fs.promises.writeFile(csProjectFilePath, newdata, 'utf-8');  
}


async function execute(command: string) {
    const data = await run(command);
    data.split("\n")
        .forEach((msg) => {
            window.showInformationMessage(`Tap Log: \n ${msg}`);
        });
}

function run(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) { return reject(error); }
            if (stderr) { return reject(stderr); }
            resolve(stdout);
        });
    });
}