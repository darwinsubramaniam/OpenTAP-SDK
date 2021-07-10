// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createNewProject } from './new_project';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Welcome to OpenTAP VSCODE SDK');
	
	let cancellationToken = new vscode.CancellationTokenSource();
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('opentap-sdk.newproject', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInputBox({title:"Project Name"},cancellationToken.token)
		.then(async projectName => {

			let folderPath = "C:\\Users\\daramani\\Desktop\\ExtensionVSCode";

			try {
				await createNewProject(projectName!,folderPath);
			} catch (error) {
				vscode.window.showErrorMessage(`Tap Error : \n ${error}`);

			}
			
		});
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
