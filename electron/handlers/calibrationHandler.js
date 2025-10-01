const { ipcMain } = require("electron");
const calibrationService = require("../services/calibrationService");

function setupCalibrationHandlers() {
    ipcMain.handle('set-calibration', async (event, calibration) => {
        calibrationService.setCalibration(calibration);
        return true;
    });

    ipcMain.handle("get-calibration", async (event) => {
        return calibrationService.getCalibration();
    });
}

module.exports = {
    setupCalibrationHandlers
}