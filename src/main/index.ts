import { app, BrowserWindow, dialog, ipcMain , shell } from 'electron';
import { join , basename } from 'path';
import { readFile , writeFile } from "node:fs/promises";

type MarkdownFile = {
    content?: string;
    filePath?: string;
}

let currentFile: MarkdownFile = {
    content: '',
    filePath: undefined,
};

const getCurrentFile = (browserWindow: BrowserWindow)=>{
  //当前路径信息为空，调用保存对话框
  if( currentFile.filePath ) return currentFile.filePath;
  if(!browserWindow) return;
  //最终会返回一个路径
  return showSaveFileDialog(browserWindow)
}

const setCurrentFile = (browserWindow: BrowserWindow,filePath: string,content: string) => {
  currentFile.filePath = filePath
  currentFile.content = content;
  console.log('currentFile',currentFile);
  app.addRecentDocument(filePath);
  browserWindow.setTitle(`${basename(filePath)} - ${app.name}`);
}

const hasChanged = (content :string)=>{
  return currentFile.content!==content;
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // mainWindow.webContents.openDevTools({
  //   mode: 'detach',
  // });
  mainWindow.once('ready-to-show',()=>{
    mainWindow.show();
    mainWindow.focus();
  })
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  console.log(process.env)
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const showOpenDialog = async (browserWindow: BrowserWindow) => {
  const result = await dialog.showOpenDialog(browserWindow, {
    properties: ['openFile'],
    filters: [{name:'Markdown', extensions:['md']}]
  });

  if(result.canceled){
    return;
  }

  console.log(result);
  const { filePaths } = result;
  const [filePath] = filePaths;
  openFile(filePath, browserWindow);

}

const openFile = async (filePath: string, browserWindow: BrowserWindow)=>{
  const fileContent = await readFile(filePath,{encoding: 'utf-8'});

  setCurrentFile(browserWindow,filePath,fileContent);

  browserWindow.webContents.send('file-opened',fileContent,filePath,);
  console.log(fileContent);
}

//export html file
const showSaveDialog = async(browserWindow: BrowserWindow,htmlFile:string)=>{
  const result = await dialog.showSaveDialog(browserWindow,{
    properties:['createDirectory'],
    filters:[{name:'HTML',extensions:['html']}],
    defaultPath: 'index.html'
  })
  if(result.canceled){
    return;
  }
  const {filePath} = result;
  if (!filePath) return;
  saveFile(browserWindow,htmlFile,filePath);
}

//save file
const showSaveFileDialog = async (browserWindow:BrowserWindow) => {
  const result = await dialog.showSaveDialog(browserWindow, {
    properties: ['createDirectory'],
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    defaultPath: 'index.md',
  });
  if(result.canceled) return;

  const {filePath} = result;
  if (!filePath) return;
  return filePath;
}

// const saveMarkDownFile = async (filePath: string, content: string) => {
//   await writeFile(filePath,content,{encoding:'utf-8'});
// }

//复用实现html和md文件的保存
const saveFile = async (browserWindow: BrowserWindow,content: string,htmlPath?:string) => {
  //如果有设置htmlPath，就使用htmlPath，否则使用当前文件路径
  const filePath = htmlPath || await getCurrentFile(browserWindow);
  if (!filePath) return;
  await writeFile(filePath,content,{encoding:'utf-8'});
  //如果是导出html，不保存路径
  if(htmlPath) return;
  setCurrentFile(browserWindow,filePath,content);
}


ipcMain.on('show-open-dialog', (_) => {
  const browserWindow = BrowserWindow.fromWebContents(_.sender);
  if(!browserWindow){
    return;
  }
  showOpenDialog(browserWindow);
})

ipcMain.on('show-save',(_,html:string)=>{
  const browserWindow = BrowserWindow.fromWebContents(_.sender);
  if(!browserWindow){
    return;
  }
  showSaveDialog(browserWindow,html);
})

// ipcMain.on('file-saving',(_,markdown:string)=>{
//   const browserWindow = BrowserWindow.fromWebContents(_.sender);
//   if (!browserWindow) {
//     return;
//   }
//   showSaveFileDialog(browserWindow,markdown);
// })

ipcMain.on('save-file',(_,content:string)=>{
  const browserWindow = BrowserWindow.fromWebContents(_.sender);
  if (!browserWindow) return;
    saveFile(browserWindow,content);
})

ipcMain.handle('has-changed',async (_event,content:string)=>{
  return hasChanged(content);
})

ipcMain.on('show-in-folder',async ()=>{
  if(currentFile.filePath){
    await shell.showItemInFolder(currentFile.filePath)
  }
})

ipcMain.on('open-in-default',async ()=>{
  if (currentFile.filePath){
    await shell.openPath(currentFile.filePath);
  }
})