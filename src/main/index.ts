import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { join } from 'path';
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
  if( currentFile.filePath ) return currentFile.filePath;
  if(!browserWindow) return;
  return showSaveDialog(browserWindow)
}

const setCurrentFile = (filePath: string,content: string) => {
  currentFile.filePath = filePath
  currentFile.content = content;
}

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

  setCurrentFile(filePath,fileContent);

  browserWindow.webContents.send('file-opened',fileContent,filePath,);
  console.log(fileContent);
}

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
  saveFile(filePath,htmlFile);
}

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

const saveFile = async (browserWindow: BrowserWindow,content: string) => {
  const filePath = await getCurrentFile(browserWindow);
  if (!filePath) return;
  await writeFile(filePath,content,{encoding:'utf-8'});
  setCurrentFile(filePath,content);
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

ipcMain.on('file-saving',(_,markdown:string)=>{
  const browserWindow = BrowserWindow.fromWebContents(_.sender);
  if (!browserWindow) {
    return;
  }
  showSaveFileDialog(browserWindow,markdown);
})

ipcMain.on('save-file',(_,content:string)=>{
  const browserWindow = BrowserWindow.fromWebContents(_.sender);
  if (!browserWindow) return;
    saveFile(browserWindow,content);
})