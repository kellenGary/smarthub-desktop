const { ipcMain } = require('electron');
const recordingService = require('./services/recordingService');

function setupRecordingHandlers() {

    ipcMain.handle('restart-recording', async () => {
        return await recordingService.restartRecording();
    });

    ipcMain.handle('get-recording-state', () => {
        return recordingService.getRecordingState();
    });

    ipcMain.handle('end-test', () => {
        recordingService.endTest();
    });
}

module.exports = {
    setupRecordingHandlers
};