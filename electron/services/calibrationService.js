
// Service to store, set, and get calibration data in memory using a class.
class CalibrationService {
    constructor() {
        this.calibration = null;
    }

    setCalibration(calibration) {
        this.calibration = calibration;
        this.leftGain = calibration.left_gain;
        this.rightGain = calibration.right_gain;
        this.wheelDistance = calibration.wheel_distance;
    }

    getCalibration() {
        return this.calibration;
    }
}

module.exports = new CalibrationService();