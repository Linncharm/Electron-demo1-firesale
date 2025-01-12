import {contextBridge, ipcRenderer} from 'electron';
import Elements from "./renderer/elements";
import {renderMarkdown, toHTML} from "./renderer/markdown";

ipcRenderer.on('file-opened',(_,fileContent:string)=>{
    console.log('file opened',{fileContent});
    Elements.MarkdownView.value=fileContent;
    renderMarkdown(fileContent);
    Elements.ShowFileButton.disabled = false;
    Elements.OpenInDefaultApplicationButton.disabled = false;
})

contextBridge.exposeInMainWorld('api',{
    showOpenDialog: ()=> ipcRenderer.send('show-open-dialog'),
    showSave: (html:string)=> ipcRenderer.send('show-save',html),
    saveFile: async (content:string)=> ipcRenderer.send('save-file',content),
    checkForUnsavedChanges: async (content: string)=>{
        const result = await ipcRenderer.invoke('has-changed',content);
        console.log( {result} )
        return result
    },
    showInFolder: () => {
        ipcRenderer.send('show-in-folder');
    },
    openInDefault: () => {
        ipcRenderer.send('open-in-default');
    }
});
// contextBridge.exposeInMainWorld('api',{
//     showSaveDialog: (htmlFile:string,filePath:string)=> ipcRenderer.send('file-saved',htmlFile,filePath),
// });


ipcRenderer.on('file-saving',async (_) => {
    const markdown = Elements.MarkdownView.value;
    let htmlFile = await toHTML(markdown);
    console.log('html file', htmlFile);
    ipcRenderer.send('file-saved', htmlFile)
})
