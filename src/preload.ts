import { ipcRenderer , contextBridge } from 'electron';
import Elements from "./renderer/elements";
import {renderMarkdown,toHTML} from "./renderer/markdown";

ipcRenderer.on('file-opened',(_,fileContent:string)=>{
    console.log('file opened',{fileContent});
    Elements.MarkdownView.value=fileContent;
    renderMarkdown(fileContent);
})

contextBridge.exposeInMainWorld('api',{
    showOpenDialog: ()=> ipcRenderer.send('show-open-dialog'),
    showSave: (html:string)=> ipcRenderer.send('show-save',html),
    saveFile: (content:string)=> ipcRenderer.send('save-file',content),
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
