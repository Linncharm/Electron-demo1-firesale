import {renderMarkdown} from './markdown';
import Elements from './elements';

Elements.MarkdownView.addEventListener('input', async () => {
  const markdown = Elements.MarkdownView.value;
  renderMarkdown(markdown);
  Elements.SaveMarkdownButton.disabled = !await window.api.checkForUnsavedChanges(markdown);
});

Elements.OpenFileButton.addEventListener('click', async () => {
  window.api.showOpenDialog();
})

Elements.ExportHtmlButton.addEventListener('click', () => {
    const html = Elements.RenderedView.innerHTML;
    window.api.showSave(html);
})

Elements.SaveMarkdownButton.addEventListener('click', () => {
    const markdown = Elements.MarkdownView.value;

    window.api.saveFile(markdown);
})

Elements.ShowFileButton.addEventListener('click',()=>{
    window.api.showInFolder();
})

Elements.OpenInDefaultApplicationButton.addEventListener('click',()=>{
    window.api.openInDefault();
})