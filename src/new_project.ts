import { exec } from "child_process";
import { debug } from "console";
import * as vscode from "vscode";
import { AdditionalOpenTapPlugin } from "./additionalOpenTap";
import { Configuration, Launch } from "./launch";
import fs = require("fs");

export interface Project {
  projectName: string;
  folderPath: string;
  additionalPlugin?: AdditionalOpenTapPlugin[];
  packageReference?: OpenTapPackageReference[];
}

export interface OpenTapPackageReference {
  include: string;
  version: string;
  repo: string;
  unpackOnly?: boolean;
  includeAssemblies?: string[];
  excludeAssemblies?: string[];
}

export async function createNewProject(project: Project) {
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Create ${project.projectName}`,
    cancellable: true,
  }, async (progress, token) => {
    token.onCancellationRequested(() => {
      console.log("User canceled the long running operation");
    });

    progress.report({ increment: 0 });

    /// Create OpenTAP Project
    await execute(
      `tap sdk new project ${project.projectName} -o ${project.folderPath}`,
    );
    progress.report({ increment: 20, message: "Create OpenTAP Project" });

    /// Adding VSCODE Folder
    await addVSCodeIntergration(project.folderPath);
    progress.report({ increment: 50, message: "Adding VSCODE folder" });

    /// Modify Lauch to add the Editor Debugger
    let launchJsonFilePath = `${project.folderPath}\\.vscode\\launch.json`;
    await addLaunchConfigureDebugWithEditor(launchJsonFilePath);
    progress.report({
      increment: 80,
      message: "Adding Editor Debugger into launch.json",
    });

    /// Modify the OpenTAP CSProj to add in the Plugins
    let csProjectFilePath = `${project.folderPath}\\${project.projectName}\\${project.projectName}.csproj`;

    await addEditorInCsProject(csProjectFilePath);
    
    progress.report({ increment: 99, message: "Adding Addition Plugin" });

    progress.report({ increment: 100, message: "Done" });

    await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(project.folderPath));
    return true;

  })
  .then(debug);

  return true;
}

async function addVSCodeIntergration(projectPath: string) {
  await execute(`cd ${projectPath} && tap sdk new integration vscode`);
}

function jsonCommentStrip(txt: string) {
  var re = new RegExp("\/\/(.*)", "g");
  return txt.replace(re, "");
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

  await fs.promises.writeFile(launchJsonFilePath, newLaunch, "utf-8");
}

async function addEditorInCsProject(csProjectFilePath: string) {
  let rawdata = (await fs.promises.readFile(csProjectFilePath)).toString();

  let newdata = rawdata.split("</Project>")[0];

  newdata = newdata.concat(
    '<ItemGroup>\r\n  <AdditionalOpenTapPackage Include="Editor" Version="9.15.0" Repository="packages.opentap.io"/>\r\n </ItemGroup>',
  );

  newdata = newdata.concat("\r\n</Project>");

  await fs.promises.rm(csProjectFilePath);

  await fs.promises.writeFile(csProjectFilePath, newdata, "utf-8");
}

async function execute(command: string) {
  const data = await run(command);
  data.split("\n")
    .forEach((msg) => {
      debug(`Tap Log: \n ${msg}`);
    });
}

function run(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {return reject(error);}
      if (stderr) {return reject(stderr);}
      resolve(stdout);
    });
  });
}
