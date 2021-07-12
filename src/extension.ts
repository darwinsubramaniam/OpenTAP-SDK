// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { debug } from "console";
import { promises } from "fs";
import path = require("path");
import * as vscode from "vscode";
import { devProjectFolder } from "./devProjectFolder";
import { HelloWorldPanel } from "./HelloWorldPanel";
import { createNewProject, Project } from "./new_project";

export function activate(context: vscode.ExtensionContext) {
  console.log("Welcome to OpenTAP VSCODE SDK");

  let cancellationToken = new vscode.CancellationTokenSource();

  // opentap.PackageRepo
  // opentap.ProjectDirectory

  let createProjectCommand = vscode.commands.registerCommand(
    "opentap-sdk.newproject",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInputBox(
        { title: "Project Name" },
        cancellationToken.token,
      )
        .then(async (projectName) => {
          let devDir = await defaultDevDir();

          let dirChoice = [
            `${devDir.fsPath}`,
            "Select Other Folder",
          ];

          vscode.window.showQuickPick(dirChoice, {
            title: "Location to create the Project",
          })
            .then(async (value) => {
              if (value === dirChoice[0]) {
                await createProjectInDefaultFolder(projectName!, devDir);
              } else if (value === dirChoice[1]) {
                selectFolderAndCreate(projectName);
              } else {
                vscode.window.showErrorMessage(
                  "Fail to create new OpenTAP project, as no directory was selected.",
                );
              }
            });
        });
    },
  );

  let test = vscode.commands.registerCommand("opentap-sdk.test", () => {
    HelloWorldPanel.createOrShow(context.extensionUri);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("opentap-sdk.progress", () => {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "New OpenTAP Project",
        cancellable: true,
      }, (progress, token) => {
        token.onCancellationRequested(() => {
          console.log("User canceled the long running operation");
        });

        progress.report({ increment: 0 });

        /// Create Folder
        setTimeout(() => {
          progress.report({ increment: 10, message: "Folder Created" });
        }, 1000);

        /// Create OpenTAP Project
        setTimeout(() => {
          progress.report({ increment: 40, message: "Create OpenTAP Project" });
        }, 2000);

        /// Adding VSCODE Folder
        setTimeout(() => {
          progress.report({ increment: 50, message: "Adding VSCODE folder" });
        }, 3000);

        /// Modify Lauch to add the Editor Debugger
        setTimeout(() => {
          progress.report({
            increment: 50,
            message: "Adding Editor Debugger into lauch.json",
          });
        }, 4000);

        /// Modify the OpenTAP CSProj to add in the Plugins
        setTimeout(() => {
          progress.report({ increment: 50, message: "Adding Addition Plugin" });
        }, 5000);

        const p = new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 6000);
        });

        return p;
      });
    }),
  );

  context.subscriptions.push(createProjectCommand);
  context.subscriptions.push(test);
}

/**
 *
 * @param projectName Enable user to select the folder to create the new project.
 */
function selectFolderAndCreate(projectName: string | undefined) {
  vscode.window.showOpenDialog({
    title: "Select Folder to create the new project",
    canSelectFolders: true,
    canSelectMany: false,
  })
    .then(async (selectedFolder) => {
      if (selectedFolder === undefined) {
        vscode.window.showWarningMessage(
          "Cancelled OpenTAP project creation process",
        );
      } else {
        let folderPath = selectedFolder![0];

        if (await isDirEmpty(folderPath)) {
          debug(`Folder Path to create project : ${folderPath}`);

          await actionCreateNewProject(
            projectName!,
            folderPath,
          );
        } else {
          let createFolderChoice = ["Yes", "No"];
          vscode.window
            .showQuickPick(createFolderChoice, {
              title:
                `Folder is not empty. Do you want to create new folder with the name ${projectName!}`,
            })
            .then(async (choice) => {
              if (choice === createFolderChoice[0]) {
                let newProjectDirPath = path.join(
                  folderPath.fsPath,
                  projectName!,
                );
                try {
                  await promises.mkdir(newProjectDirPath);
                  await actionCreateNewProject(
                    projectName!,
                    vscode.Uri.parse(newProjectDirPath),
                  );
                } catch (error) {
                  vscode.window.showErrorMessage(error);
                }
              } else {
                await actionCreateNewProject(
                  projectName!,
                  folderPath,
                );
              }
            });
        }
      }
    });
}

async function createProjectInDefaultFolder(
  projectName: string,
  devDir: vscode.Uri,
) {
  if (await isDirEmpty(devDir)) {
    await actionCreateNewProject(
      projectName!,
      devDir,
    );
  } else {
    let createFolderChoice = ["Yes", "No"];
    vscode.window
      .showQuickPick(createFolderChoice, {
        title:
          `Folder is not empty. Do you want to create new folder with the name ${projectName!}`,
      })
      .then(async (choice) => {
        if (choice === createFolderChoice[0]) {
          let newProjectDirPath = path.join(
            devDir.fsPath,
            projectName!,
          );
          try {
            await promises.mkdir(newProjectDirPath);
            await actionCreateNewProject(
              projectName!,
              vscode.Uri.parse(newProjectDirPath),
            );
          } catch (error) {
            vscode.window.showErrorMessage(error);
          }
        } else {
          await actionCreateNewProject(
            projectName!,
            devDir,
          );
        }
      });
  }
}
async function isDirEmpty(devDir: vscode.Uri) {
  return await promises.readdir(
    devDir.fsPath,
  )
    .then((files) => {
      return files.length === 0;
    });
}

async function actionCreateNewProject(
  projectName: string,
  folderDir: vscode.Uri,
) {
  let project: Project = {
    projectName: projectName!,
    folderPath: folderDir.fsPath,
  };

  try {
    await createNewProject(project);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Tap Error : \n ${error}`,
    );
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * Get the default folder to store the new project.
 * @returns
 */
async function defaultDevDir(): Promise<vscode.Uri> {
  let configProjectDir = vscode.workspace.getConfiguration("opentap")
    .get("ProjectDirectory");

  configProjectDir = configProjectDir === undefined
    ? "${DEFAULT}"
    : configProjectDir;

  let defaultDevFolder = await devProjectFolder(configProjectDir as string);

  return defaultDevFolder;
}
