'use client'
import React, { useEffect, useState } from "react";
import DemoChart from "./demoChart";
import {FiArrowLeft} from "react-icons/fi";
import Link from "next/link";
import FlagConsole from "../navbar/flagConsole";
import { useFlagging } from "../context/flaggingContext";
import {BsFillPauseFill, BsGrid, BsGridFill, BsViewStacked} from "react-icons/bs";

export default function Recorder() {
    const [displacement, setDisplacement] = useState([]);
    const [velocity, setVelocity] = useState([]);
    const [heading, setHeading] = useState([]);
    const [trajectory_x, setTrajectoryX] = useState([]);
    const [trajectory_y, setTrajectoryY] = useState([]);
    const [timeStamp, setTimeStamp] = useState([]);
    const [boxView, setBoxView] = useState(false);

    const { flagging, handleFlagging, width } = useFlagging();

    function handleData(data) {
        const { displacement, velocity, heading, trajectory_x, trajectory_y, timeStamp } = data;

        console.log(data)

        // Check if the timeStamp is unique before adding to prevent duplication
        setDisplacement(prev => {
            // Don't add if we already have a point with this exact timestamp
            if (prev.some(item => item.timeStamp === timeStamp)) return prev;
            return [...prev, displacement];
        });

        setVelocity(prev => {
            if (prev.some(item => item.timeStamp === timeStamp)) return prev;
            return [...prev, velocity];
        });

        setHeading(prev => {
            if (prev.some(item => item.timeStamp === timeStamp)) return prev;
            return [...prev, heading];
        });

        setTrajectoryY(prev => {
            if (prev.some(item => item.timeStamp === timeStamp)) return prev;
            return [...prev, trajectory_y];
        });

        setTrajectoryX(prev => {
            if (prev.some(item => item.timeStamp === timeStamp)) return prev;
            return [...prev, trajectory_x];
        });

        setTimeStamp(prev => {
            if (prev.some(item => item === timeStamp)) return prev;
            return [...prev, timeStamp];
        })
    }

    function clearData() {
        setDisplacement([]);
        setVelocity([]);
        setHeading([]);
        setTrajectoryX([]);
        setTrajectoryY([]);
        setTimeStamp([]);
    }

    function handleEndRecording() {
        if (window.electronAPI) {
            window.electronAPI.setTestData(null);
            handleFlagging(false);
        }
    }

    useEffect(() => {
        if (window.electronAPI) {
            // Listen for new BLE data
            window.electronAPI.onBLEData((newData) => {
                if (newData && newData.data) {
                    const dataArray = newData.data;
                    for (let i = 0; i < dataArray.length; i++) {
                        handleData(dataArray[i]);
                    }
                }
            });

            // Add restart listener
            window.electronAPI.onRestartRecording((eventData) => {
                console.log("Resetting recording data", eventData);
                clearData(); // Reset the bleData array
            });
        }

        const fetchTestData = async () => {
            if (window.electronAPI) {
                try {
                    const response = await window.electronAPI.getReviewData();
                    if (!response) return;
                    setDisplacement(response.displacement);
                    setVelocity(response.velocity);
                    setHeading(response.heading);
                    setTrajectoryX(response.trajectory_x);
                    setTrajectoryY(response.trajectory_y);
                } catch (error) {
                    console.error('Error fetching test data:', error);
                }
            }
        };

        fetchTestData();
    }, []);

    return (
        <>
            <div className="flex flex-col py-8 px-4 overflow-x-hidden"
                   style={{ width: flagging ? `${100 - width}vw` : '100vw' }}>

                <div className={"flex flex-col w-full px-12 self-center gap-8 justify-center"}>
                    <div className="flex grow">
                        <div className="flex grow items-center">
                            <Link
                                href={'/smarthubRecorder/connector/'}
                                className=" transition-colors pr-4"
                            >
                                <FiArrowLeft className={'scale-150 rounded-full hover:bg-gray-800'}/>
                            </Link>
                            <h1 className="text-2xl">Test #</h1>
                        </div>

                        <div className={'flex flex-row gap-4  bg-[#0a0a0a] px-4 py-2 rounded-lg justify-center items-center'}>
                            {boxView ? (
                                    <>
                                        <BsViewStacked onClick={(() => setBoxView(!boxView))}/>
                                        <BsGridFill className={'scale-110'}/>
                                    </>

                                ) : (
                                <>
                                    <BsFillPauseFill className={'rotate-90 scale-200'}/>
                                    <BsGrid onClick={(() => setBoxView(!boxView))}  className={'scale-110'}/>
                                </>
                            )}
                        </div>

                        <div className="flex grow items-center justify-end">
                            <Link href={"/smarthubRecorder/reviewer/"}
                                  onClick={handleEndRecording}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                Finish Test
                            </Link>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className={`${boxView ? 'grid grid-cols-2 gap-8' : 'flex flex-col gap-8'} h-screen`}>
                        <DemoChart timeStamps={timeStamp} data={displacement} title={'Displacement vs Time'} graphId={1}/>
                        <DemoChart timeStamps={timeStamp} data={heading} title={'Heading vs Time'} graphId={2}/>
                        <DemoChart timeStamps={timeStamp} data={velocity} title={'Velocity vs Time'} graphId={3}/>
                        <DemoChart timeStamps={trajectory_x} data={trajectory_y} title={'Trajectory'} graphId={4}/>
                    </div>
                </div>
            </div>

            {flagging && (
                <FlagConsole setFlagging={handleFlagging}/>
            )}
        </>
    );
}