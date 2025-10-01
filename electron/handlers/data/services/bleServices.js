const BrowserWindow = require('electron').BrowserWindow;
const connectionStore = require('../../../services/connectionStore');
const dataBuffer = require('./dataBufferService');
const constants = require('../../../config/constants');
const downsamplingUtils = require('../utils/downsamplingUtils')
const calculationUtils = require("../utils/calculationUtils")
const calibration = require('../../../services/calibrationService')
const timeManager = require('../../../services/timeManager')

// Global variables for BLE data processing
let pendingLeftData = null;
let pendingRightData = null;

const { TARGET_POINTS, DOWNSAMPLE_TO } = constants;

async function findCharacteristics(shouldRecord, peripheral) {
    peripheral.discoverServices([], (error, services) => {
        if (error) {
            console.error(error);
            return;
        }

        services.forEach(service => {
            service.discoverCharacteristics([], (error, characteristics) => {
                if (error) {
                    console.error(error);
                    return;
                }

                characteristics.forEach(characteristic => {
                    if (characteristic.uuid === "2a56") {
                        if (shouldRecord) {
                            subscribeToCharacteristics(characteristic, peripheral);
                        } else {
                            unsubscribeToCharacteristics(characteristic);
                        }
                    }
                });
            });
        });
    });
}

function subscribeToCharacteristics(characteristic, peripheral) {
    characteristic.subscribe((error) => {
        if (error) {
            console.error('Subscribe error:', error);
        }
    });

    characteristic._dataCallback = async (data) => {
        let accelData = [];
        let gyroData = [];
        calculationUtils.decodeSensorData(data, accelData, gyroData);
    
        if (peripheral === connectionStore.getConnectionOne()) {
            // Store data from left device
            pendingLeftData = {
                accelData: accelData,
                gyroData: gyroData,
                timeStamp: Date.now()
            };
        } else if (peripheral === connectionStore.getConnectionTwo()) {
            // Store data from right device
            pendingRightData = {
                accelData: accelData,
                gyroData: gyroData,
                timeStamp: Date.now()
            };
        }

        // Only process data when we have both left and right readings and the difference in their arrival times is within 1 message interval
        if (pendingLeftData && pendingRightData) {
            let time_curr = (Date.now() - timeManager.getRecordingStartTime()) / 1000
            let time_from_start = []
            // Creates 4 time stamps at sensor intervals
            for (let i = 3; i > -1; i--) {
                time_from_start.push(time_curr - i * (1/68))
            }
            
            // Use configurable calculation method
            // const smoothedData = smoothData(pendingRightData, pendingLeftData, time_from_start)
            // pendingLeftData.gyroData = smoothedData.gyro_left_smoothed;
            // pendingRightData.gyroData = smoothedData.gyro_right_smoothed;

            // applyGain(pendingLeftData, pendingRightData)
            applyThreshold(pendingLeftData, pendingRightData)
            let jsonData = calculationUtils.calc(time_from_start, pendingLeftData.gyroData, pendingRightData.gyroData, pendingLeftData.accelData, pendingRightData.accelData);
            console.log(jsonData)

            // Append data to both buffers
            dataBuffer.appendToBuffer(jsonData);
            const buffer = dataBuffer.getDataBuffer();
            
            // Transform buffer structure to match processData expectations
            const transformedBuffer = transformBufferForProcessing(buffer);
            
            // reformat data for our graphs
            let finalData = processData(transformedBuffer);

            // Clear only the current buffer and not the raw buffer
            dataBuffer.clearBuffer();

            // Send downsampled data to frontend
            BrowserWindow.getAllWindows().forEach((win) => {
                if (win && !win.isDestroyed()) {
                    win.webContents.send('new-ble-data', {data: finalData});
                }
            });

            // Clear the pending data after processing
            pendingLeftData = null;
            pendingRightData = null;
        }
    }

    characteristic.on('data', characteristic._dataCallback);
}

async function smoothData(pendingRightData, pendingLeftData, time_from_start) {
    const response = await fetch("http://localhost:8000/calibrate/smooth", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            gyro_right: pendingRightData.gyroData,
            gyro_left: pendingLeftData.gyroData,
            time_from_start: time_from_start
        })
    });
    return await response.json();
}

// Both data comes in the form of {
//  accelData:
//  gyroData:
// }
function applyGain(leftData, rightData) {
    for (let i = 0; i < leftData.gyroData.length; i++) {
        leftData.gyroData[i] *= calibration.leftGain;
        rightData.gyroData[i] *= calibration.rightGain;
    }
}

// Both data comes in the form of {
//  accelData:
//  gyroData:
// }
const THRESHOLD = 0.05
function applyThreshold(leftData, rightData) {
    for (let i = 0; i < leftData.gyroData.length; i++) {
        // Dead zone thresholding: set values within ±THRESHOLD to 0
        leftData.gyroData[i] = (Math.abs(leftData.gyroData[i]) > THRESHOLD ? leftData.gyroData[i] : 0) 
        rightData.gyroData[i] = (Math.abs(rightData.gyroData[i]) > THRESHOLD ? rightData.gyroData[i] : 0)
    }
}

function transformBufferForProcessing(buffer) {
    // Transform buffer structure from {prop: [array1, array2, ...]} 
    // to [{prop: array1}, {prop: array2}, ...]
    const transformed = [];
    const numEntries = buffer.displacement.length;
    
    for (let i = 0; i < numEntries; i++) {
        transformed.push({
            displacement: buffer.displacement[i],
            heading: buffer.heading[i],
            velocity: buffer.velocity[i],
            trajectory_x: buffer.trajectory_x[i],
            trajectory_y: buffer.trajectory_y[i],
            gyro_left: buffer.gyro_left[i],
            gyro_right: buffer.gyro_right[i],
            timeStamp: buffer.timeStamp[i]
        });
    }
    
    return transformed;
}

function processData(data) {
    let returnData = {
        displacement: [],
        heading: [],
        velocity: [],
        trajectory: [],
        gyro_left: [],
        gyro_right: [],
        timeStamp: []
    };
    // Flatten all packets into a single array
    const flatData = data.flat();
    flatData.forEach((item) => {
        // Merge arrays for each property
        if (Array.isArray(item.timeStamp)) {
            for (let i = 0; i < item.timeStamp.length; i++) {
                returnData.displacement.push({
                    time: item.timeStamp[i],
                    displacement: item.displacement[i],
                });
                returnData.heading.push({
                    time: item.timeStamp[i],
                    heading: item.heading[i],
                });
                returnData.velocity.push({
                    time: item.timeStamp[i],
                    velocity: item.velocity[i],
                });
                returnData.trajectory.push({
                    time: item.timeStamp[i],
                    trajectory_x: item.trajectory_x[i],
                    trajectory_y: item.trajectory_y[i],
                });
                returnData.gyro_left.push(item.gyro_left[i]);
                returnData.gyro_right.push(item.gyro_right[i]);
                returnData.timeStamp.push(item.timeStamp[i]);
            }
        } else {
            // Fallback for non-array (single value) items
            returnData.displacement.push({
                time: item.timeStamp,
                displacement: item.displacement,
            });
            returnData.heading.push({
                time: item.timeStamp,
                heading: item.heading,
            });
            returnData.velocity.push({
                time: item.timeStamp,
                velocity: item.velocity,
            });
            returnData.trajectory.push({
                time: item.timeStamp,
                trajectory_x: item.trajectory_x,
                trajectory_y: item.trajectory_y,
            });
            returnData.gyro_left.push(item.gyro_left);
            returnData.gyro_right.push(item.gyro_right);
            returnData.timeStamp.push(item.timeStamp);
        }
    });
    return returnData;
}

function isDeviceConnected(peripheral) {
    if (!peripheral) return false;
    return peripheral.state === 'connected';
}

function checkConnectionStatus() {
    const conn1 = connectionStore.getConnectionOne();
    const conn2 = connectionStore.getConnectionTwo();

    const isConn1Connected = conn1 ? isDeviceConnected(conn1) : false;
    const isConn2Connected = conn2 ? isDeviceConnected(conn2) : false;

    return {
        deviceOne: isConn1Connected,
        deviceTwo: isConn2Connected
    };
}

function setupDisconnectionListeners() {
    const conn1 = connectionStore.getConnectionOne();
    const conn2 = connectionStore.getConnectionTwo();

    if (conn1) {
        conn1.on('disconnect', () => {
            BrowserWindow.getAllWindows().forEach((win) => {
                win.webContents.send('device-disconnected', { device: 'one' });
            });
        });
    }

    if (conn2) {
        conn2.on('disconnect', () => {
            BrowserWindow.getAllWindows().forEach((win) => {
                win.webContents.send('device-disconnected', { device: 'two' });
            });
        });
    }
}

function unsubscribeToCharacteristics(characteristic) {
    characteristic.unsubscribe((error) => {
        if (error) {
            console.error('Unsubscribe error:', error);
        }
    });

    if (characteristic._dataCallback) {
        characteristic.off('data', characteristic._dataCallback);
        delete characteristic._dataCallback;
    }
}

module.exports = {
    checkConnectionStatus,
    setupDisconnectionListeners,
    findCharacteristics
};