import { CanvasStage } from './canvas/CanvasStage';
import { useKeyboard } from './hooks/useKeyboard';
import { ContextMenu } from './ui/ContextMenu';
import { CalibrateDialog, ExportDialog } from './ui/Dialogs';
import { LibraryPanel } from './ui/LibraryPanel';
import { PropertiesPanel } from './ui/PropertiesPanel';
import { StatusBar, Toast } from './ui/StatusBar';
import { Toolbar } from './ui/Toolbar';
import { TopBar } from './ui/TopBar';

export default function App() {
  useKeyboard();
  return (
    <div className="app">
      <TopBar />
      <div className="main">
        <Toolbar />
        <LibraryPanel />
        <CanvasStage />
        <PropertiesPanel />
      </div>
      <StatusBar />
      <ContextMenu />
      <ExportDialog />
      <CalibrateDialog />
      <Toast />
    </div>
  );
}
