const bufferService = require('../utils/bufferUtils');
const calculationUtils = require('../utils/calculationUtils');

class CalculationService {
    calculateMetrics(data) {

        // Use the calculation utils to process data
        return {
            averageForce: calculationUtils.calculateAverage(data.force),
            peakForce: calculationUtils.calculateMax(data.force),
            averagePower: calculationUtils.calculateAverage(data.power),
            peakPower: calculationUtils.calculateMax(data.power),
            totalDistance: calculationUtils.calculateCumulative(data.distance),
            // Add other metrics as needed
        };
    }

    recalculateDerivedData() {
        const rawData = bufferService.getRawDataBuffer();

        // Process and update derived values
        const processedData = calculationUtils.recalculateDerivedValues(rawData);

        // Update the processed data buffer
        bufferService.updateDataBuffer(processedData);

        return processedData;
    }

    runAnalysis(dataSet, options = {}) {

        // Perform specialized analysis based on options
        const results = calculationUtils.performAnalysis(dataSet, options);

        return results;
    }
}

module.exports = new CalculationService();