import React, {useEffect, useState} from "react";
import Graph from "../components/graphs/graph";

export default function ChartSection({boxView}) {
    const [testData, setTestData] = useState({
        displacement: [],
        velocity: [],
        heading: [],
        trajectory: []
    });

    function handleData(data) {
        // Update testData with the new formatted data from BLE service
        setTestData(prevTestData => ({
            displacement: [...prevTestData.displacement, ...data.displacement],
            velocity: [...prevTestData.velocity, ...data.velocity],
            heading: [...prevTestData.heading, ...data.heading],
            trajectory: [...prevTestData.trajectory, ...data.trajectory]
        }));
    }

    function clearData() {
        setTestData({
            displacement: [],
            velocity: [],
            heading: [],
            trajectory: []
        });
    }

    useEffect(() => {
        if (window.electronAPI) {
            const bleDataHandler = (newData) => {
                console.log('Received BLE data:', newData.data);
                handleData(newData.data);
            };

            const restartHandler = () => {
                clearData();
            };

            window.electronAPI.onBLEData(bleDataHandler);
            window.electronAPI.onRestartRecording(restartHandler);
        }
    }, []);

    return (
        testData.displacement.length> 0 ? (
                <div className={`${boxView ? 'grid grid-cols-2 gap-8 grow' : 'flex flex-col gap-8 shrink'}`}>
                    <Graph data={testData.displacement}/>
                    <Graph data={testData.heading}/>
                    <Graph data={testData.velocity}/>
                    <Graph data={testData.trajectory}/>
                </div>
            ) : (
            //     No data fallback
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <h3 className="text-xl font-semibold mb-2">No Test Data Available</h3>
                <p className="text-center text-sm mb-4">
                    Start recording to see displacement, velocity, heading, and trajectory charts
                </p>
                <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Waiting for BLE data...</span>
                </div>
            </div>
        )
    );
}