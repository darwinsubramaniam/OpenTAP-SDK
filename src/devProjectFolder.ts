import username = require('username');
import { Uri } from 'vscode';

export async function devProjectFolder(path:string):Promise<Uri>{

    /**
     * For Window Dev
     * store in the c:\Users\{user}\source\repos
     * For Mac and Linux Dev
     * store in /home/{user}/Tap/Dev/repo
     */
    if(path.includes("${DEFAULT}")){
        let user = await username();

        if(user === undefined){
            throw new Error("No username was found");
        }

        let platform = process.platform;

        if(platform === "win32"){
            user = removeDomain(user);
            return Uri.parse(`file:///c:/Users/${user}/source/repos`);
        } else if(platform === 'darwin' || platform === 'linux'){
            /// TODO require Implementation
            throw new Error("Haven't Implemented for mac and linux");
        }else{
            throw new Error(`Platform ${platform} is not supported`);
        }
    }   

    return Uri.parse(path);
}

function removeDomain(username:string):string{
    if(username.includes('\\')){
        return username.split('\\').pop()!;
    }

    return username;
}